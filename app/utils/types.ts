/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScreenId = 'splash' | 'login' | 'home' | 'scanner' | 'shelfForm' | 'shelfLogs' | 'tracking';

export type ShelfCondition = 'Sangat Baik' | 'Baik' | 'Perlu Perbaikan' | 'Rusak Berat';

export interface UserDb {
  id: number;
  username: string;
  name: string;
  iddept: string | null;
  idjab: string | null;
  id_rayon: number | null;
  branch_id: number | null;
  email: string | null;
  image: string | null;
  whatsapp: string | null;
  status: 'active' | 'non active';
}

export interface CrmLocationSalesDb {
  id: number;
  salesman_id: string; // matches UserDb.id as string
  id_contact: number | null;
  name_store: string | null;
  address_store: string | null;
  result: string | null;
  date: string; // YYYY-MM-DD
  latitude: string;
  longitude: string;
  distance: number | null;
  timestamp_checkin: string | null;
  timestamp_checkout: string | null;
  purpose: string | null;
  order_quantity: string | null;
  bill_quantity: string | null;
  insentif_effective_call: number | null;
  foto_checkin?: string | null;
  foto_display?: string | null;
  foto_pic_toko?: string | null;
}

export interface ShelfLog {
  id: string;
  pelanggan: string;
  namaToko: string;
  kondisiRak: ShelfCondition;
  serialNumber: string;
  fotoUrl: string | null;
  latitude: number;
  longitude: number;
  tanggalInput: string;
  picName: string;
}

export interface StoreOption {
  id: string;
  pelanggan: string;
  namaToko: string;
  defaultLocation: {
    lat: number;
    lng: number;
  };
}

export interface PresetQR {
  serial: string;
  pelanggan: string;
  namaToko: string;
  desc: string;
}
