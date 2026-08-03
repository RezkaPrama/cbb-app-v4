import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './../../service/apiService';

export interface VisitHistoryItem {
  id: number;
  salesman_id: string;
  id_contact: number | null;
  name_store: string;
  address_store: string | null;
  latitude: string | number;  // ← API kadang kirim number
  longitude: string | number; // ← API kadang kirim number
  date: string;               // ← tambahkan ini
  timestamp_checkin: string | null;
  timestamp_checkout: string | null;
  purpose: string | null;
  result: string | null;
  order_quantity: string | null;
  bill_quantity: string | null;
  foto_checkin: string | null;
  foto_display: string | null;
  foto_pic_toko: string | null;
}

// Helper lokal — hanya dipakai di file ini
// Masalah: getDataLara menyimpan token dengan JSON.stringify sehingga
// tersimpan sebagai "\"eyJ...\"". apiService membaca raw dan mengirim
// Bearer "eyJ..." (dengan kutip) yang ditolak server.
async function getCleanToken(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem('tokenUser');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
    } catch {
      // bukan JSON, sudah plain string
    }
    return raw;
  } catch {
    return null;
  }
}

export async function fetchVisitHistoryByDate(
  date: string
): Promise<VisitHistoryItem[]> {
  const token = await getCleanToken();

  if (!token) {
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

  const queryString = new URLSearchParams({
    start_date: date,
    end_date: date,
  }).toString();

  // Bypass apiService.makeRequest() dan fetch langsung dengan token bersih
  const BASE_URL = 'https://citrabarubusana.org/api';
  const response = await fetch(`${BASE_URL}/store-visit/history?${queryString}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/html')) {
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.message || 'Gagal memuat histori kunjungan');
  }

  return json.data || [];
}