// Pakai path /legacy karena expo-file-system versi baru (SDK 53+) mengganti
// API berbasis fungsi (documentDirectory, copyAsync, dst) dengan API berbasis
// class (File/Directory/Paths). Import dari /legacy tetap punya API lama yang
// kita pakai di file ini, tanpa perlu menulis ulang logic.
import * as FileSystem from 'expo-file-system/legacy';
import { storeDataLara, getDataLara } from './asyncStorage';

// Sesuaikan path import di atas kalau lokasi file utils/asyncStorage.ts
// berbeda dari yang ada di project Rezka (saya asumsikan satu folder yang sama).

const QUEUE_KEY = 'pendingCheckins';
const PHOTO_DIR = `${FileSystem.documentDirectory}pending_checkins/`;

export interface PendingCheckin {
  localId: string;
  latitude: number;
  longitude: number;
  timestamp_checkin: string;
  name_store: string;
  purpose: string;
  notes?: string;
  id_contact?: string;
  address_store?: string;
  photoUri: string;
  photoExtension: string;
  attempts: number;
  createdAt: string;
}

type NewCheckinInput = Omit<PendingCheckin, 'localId' | 'photoUri' | 'attempts' | 'createdAt'> & {
  sourcePhotoUri: string;
};

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export async function getQueue(): Promise<PendingCheckin[]> {
  const queue = await getDataLara<PendingCheckin[]>(QUEUE_KEY);
  return queue ?? [];
}

async function saveQueue(queue: PendingCheckin[]): Promise<void> {
  await storeDataLara(QUEUE_KEY, queue);
}

/**
 * Simpan check-in ke antrian lokal. Foto dipindah dari cache ImagePicker
 * ke documentDirectory supaya tidak ikut terhapus saat OS membersihkan cache.
 */
export async function enqueueCheckin(data: NewCheckinInput): Promise<string> {
  await ensureDir();
  const localId = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${localId}.${data.photoExtension}`;
  const destUri = `${PHOTO_DIR}${filename}`;

  await FileSystem.copyAsync({ from: data.sourcePhotoUri, to: destUri });

  const { sourcePhotoUri, ...rest } = data;
  const queue = await getQueue();
  queue.push({
    ...rest,
    photoUri: destUri,
    localId,
    attempts: 0,
    createdAt: new Date().toISOString(),
  });
  await saveQueue(queue);
  return localId;
}

export async function removeFromQueue(localId: string): Promise<void> {
  const queue = await getQueue();
  const target = queue.find((q) => q.localId === localId);
  if (target) {
    await FileSystem.deleteAsync(target.photoUri, { idempotent: true }).catch(() => {});
  }
  await saveQueue(queue.filter((q) => q.localId !== localId));
}

async function incrementAttempts(localId: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map((q) => (q.localId === localId ? { ...q, attempts: q.attempts + 1 } : q));
  await saveQueue(updated);
}

/**
 * Coba kirim semua item di antrian ke server. Item yang sukses langsung
 * dihapus dari antrian (termasuk file fotonya). Item yang gagal lebih dari
 * 5x dilewati dulu (supaya tidak menghabiskan kuota/waktu terus-terusan),
 * tapi tetap tersimpan di antrian — bisa ditambah UI untuk hapus manual.
 */
export async function syncQueue(
  token: string,
  baseUrl: string
): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    if (item.attempts >= 5) continue;

    try {
      const formData = new FormData();
      formData.append('latitude', String(item.latitude));
      formData.append('longitude', String(item.longitude));
      formData.append('timestamp_checkin', item.timestamp_checkin);
      formData.append('name_store', item.name_store);
      formData.append('purpose', item.purpose);
      if (item.notes) formData.append('notes', item.notes);
      if (item.id_contact) formData.append('id_contact', item.id_contact);
      if (item.address_store) formData.append('address_store', item.address_store);
      formData.append('foto_checkin', {
        uri: item.photoUri,
        name: `foto_checkin.${item.photoExtension}`,
        type: `image/${item.photoExtension}`,
      } as any);

      const res = await fetch(`${baseUrl}/api/store-visit/check-in`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        await removeFromQueue(item.localId);
        synced += 1;
      } else {
        await incrementAttempts(item.localId);
        failed += 1;
      }
    } catch {
      // Masih offline / server tidak terjangkau → biarkan tetap di antrian
      await incrementAttempts(item.localId);
      failed += 1;
    }
  }

  return { synced, failed };
}