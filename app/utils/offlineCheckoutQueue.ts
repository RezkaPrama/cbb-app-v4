// Pakai path /legacy karena expo-file-system versi baru (SDK 53+) mengganti
// API berbasis fungsi (documentDirectory, copyAsync, dst) dengan API berbasis
// class (File/Directory/Paths). Import dari /legacy tetap punya API lama yang
// kita pakai di file ini.
import * as FileSystem from 'expo-file-system/legacy';
import { storeDataLara, getDataLara } from './asyncStorage';

const QUEUE_KEY = 'pendingCheckouts';
const PHOTO_DIR = `${FileSystem.documentDirectory}pending_checkouts/`;

export interface PendingCheckout {
  localId: string;
  idAbsen: number;
  name_store: string;
  result: string;
  order_quantity?: string;
  bill_quantity?: string;
  timestamp_checkout: string;
  fotoDisplayUri: string;
  fotoDisplayExtension: string;
  fotoPicTokoUri: string;
  fotoPicTokoExtension: string;
  attempts: number;
  createdAt: string;
}

type NewCheckoutInput = Omit<
  PendingCheckout,
  'localId' | 'fotoDisplayUri' | 'fotoPicTokoUri' | 'attempts' | 'createdAt'
> & {
  sourceFotoDisplayUri: string;
  sourceFotoPicTokoUri: string;
};

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export async function getQueue(): Promise<PendingCheckout[]> {
  const queue = await getDataLara<PendingCheckout[]>(QUEUE_KEY);
  return queue ?? [];
}

async function saveQueue(queue: PendingCheckout[]): Promise<void> {
  await storeDataLara(QUEUE_KEY, queue);
}

/**
 * Simpan checkout ke antrian lokal. Kedua foto dipindah dari cache
 * ImagePicker ke documentDirectory supaya tidak ikut terhapus OS.
 */
export async function enqueueCheckout(data: NewCheckoutInput): Promise<string> {
  await ensureDir();
  const localId = `cko_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const destDisplayUri = `${PHOTO_DIR}${localId}_display.${data.fotoDisplayExtension}`;
  const destPicTokoUri = `${PHOTO_DIR}${localId}_pic.${data.fotoPicTokoExtension}`;

  await FileSystem.copyAsync({ from: data.sourceFotoDisplayUri, to: destDisplayUri });
  await FileSystem.copyAsync({ from: data.sourceFotoPicTokoUri, to: destPicTokoUri });

  const { sourceFotoDisplayUri, sourceFotoPicTokoUri, ...rest } = data;
  const queue = await getQueue();
  queue.push({
    ...rest,
    fotoDisplayUri: destDisplayUri,
    fotoPicTokoUri: destPicTokoUri,
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
    await FileSystem.deleteAsync(target.fotoDisplayUri, { idempotent: true }).catch(() => {});
    await FileSystem.deleteAsync(target.fotoPicTokoUri, { idempotent: true }).catch(() => {});
  }
  await saveQueue(queue.filter((q) => q.localId !== localId));
}

async function incrementAttempts(localId: string): Promise<void> {
  const queue = await getQueue();
  const updated = queue.map((q) => (q.localId === localId ? { ...q, attempts: q.attempts + 1 } : q));
  await saveQueue(updated);
}

/**
 * Catatan: sama seperti antrian check-in, fungsi ini tidak membedakan
 * "gagal karena jaringan" vs "gagal karena validasi server" (misal id
 * absen sudah checkout). Keduanya akan dihitung sebagai attempt dan
 * tetap di antrian sampai 5x percobaan, baru dilewati (tidak dihapus).
 * Kalau perlu pembeda yang lebih ketat, bisa cek data.errors dari
 * response dan langsung removeFromQueue + tampilkan error ke user.
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
      formData.append('id', String(item.idAbsen));
      formData.append('name_store', item.name_store);
      formData.append('result', item.result);
      if (item.order_quantity) formData.append('order_quantity', item.order_quantity);
      if (item.bill_quantity) formData.append('bill_quantity', item.bill_quantity);
      formData.append('timestamp_checkout', item.timestamp_checkout);
      formData.append('foto_display', {
        uri: item.fotoDisplayUri,
        name: `foto_display.${item.fotoDisplayExtension}`,
        type: `image/${item.fotoDisplayExtension}`,
      } as any);
      formData.append('foto_pic_toko', {
        uri: item.fotoPicTokoUri,
        name: `foto_pic_toko.${item.fotoPicTokoExtension}`,
        type: `image/${item.fotoPicTokoExtension}`,
      } as any);

      const res = await fetch(`${baseUrl}/api/store-visit/check-out`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.code === 200 && data?.status === 'success') {
        await removeFromQueue(item.localId);
        synced += 1;
      } else {
        await incrementAttempts(item.localId);
        failed += 1;
      }
    } catch {
      await incrementAttempts(item.localId);
      failed += 1;
    }
  }

  return { synced, failed };
}