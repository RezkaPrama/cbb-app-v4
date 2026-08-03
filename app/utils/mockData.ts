import { StoreOption, ShelfLog, PresetQR, UserDb, CrmLocationSalesDb } from './types';

export const STORE_OPTIONS: StoreOption[] = [
  {
    id: 'store-1',
    pelanggan: 'PT Kharisma Retailindo',
    namaToko: 'Kharisma Fashion Festival Citylink',
    defaultLocation: { lat: -6.936012, lng: 107.601423 }
  },
  {
    id: 'store-2',
    pelanggan: 'UD Samudra Bandung',
    namaToko: 'Toko Samudra Kerudung Pasar Baru',
    defaultLocation: { lat: -6.924219, lng: 107.605381 }
  },
  {
    id: 'store-3',
    pelanggan: 'PT Rabbani Retailindo',
    namaToko: 'Rabbani Dipatiukur',
    defaultLocation: { lat: -6.892341, lng: 107.618642 }
  },
  {
    id: 'store-4',
    pelanggan: 'CV Hijab Amanda Global',
    namaToko: 'Amanda Hijab Store Rancaekek',
    defaultLocation: { lat: -6.974512, lng: 107.766345 }
  },
  {
    id: 'store-5',
    pelanggan: 'PT Cipta Sandang Lestari',
    namaToko: 'Cipta Fashion FO Dago',
    defaultLocation: { lat: -6.887201, lng: 107.615124 }
  }
];

export const PRESET_QRS: PresetQR[] = [
  {
    serial: '243EQ60HGX',
    pelanggan: 'PT Kharisma Retailindo',
    namaToko: 'Kharisma Fashion Festival Citylink',
    desc: 'Rak Gondola A1 - Display Utama'
  },
  {
    serial: '882WM11KTY',
    pelanggan: 'UD Samudra Bandung',
    namaToko: 'Toko Samudra Kerudung Pasar Baru',
    desc: 'Rak Samping B3 - Display Jilbab'
  },
  {
    serial: '401PX99NMM',
    pelanggan: 'PT Rabbani Retailindo',
    namaToko: 'Rabbani Dipatiukur',
    desc: 'Rak Tengah C2 - Promo Bundling'
  },
  {
    serial: '990ZX55CVB',
    pelanggan: 'CV Hijab Amanda Global',
    namaToko: 'Amanda Hijab Store Rancaekek',
    desc: 'Rak Island E5 - Koleksi Premium'
  }
];

export const INITIAL_LOGS: ShelfLog[] = [
  {
    id: 'log-1',
    pelanggan: 'PT Kharisma Retailindo',
    namaToko: 'Kharisma Fashion Festival Citylink',
    kondisiRak: 'Sangat Baik',
    serialNumber: '243EQ60HGX',
    fotoUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=400&q=80',
    latitude: -6.935904148335567,
    longitude: 107.66475410026406,
    tanggalInput: '2026-05-20 14:22:15',
    picName: 'Rezka Pramaditha'
  },
  {
    id: 'log-2',
    pelanggan: 'UD Samudra Bandung',
    namaToko: 'Toko Samudra Kerudung Pasar Baru',
    kondisiRak: 'Perlu Perbaikan',
    serialNumber: '882WM11KTY',
    fotoUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80',
    latitude: -6.924219,
    longitude: 107.605381,
    tanggalInput: '2026-05-21 09:12:00',
    picName: 'Rezka Pramaditha'
  }
];

// -------------------------------------------------------------
// USER & CRM VISIT HISTORY TABLE MOCK DATA (SQL aligned)
// -------------------------------------------------------------

export const MOCK_USERS: UserDb[] = [
  {
    id: 591,
    username: 'rezkaprama',
    name: 'Rezka Pramaditha',
    iddept: 'SALES',
    idjab: 'SLS-CORD',
    id_rayon: 12,
    branch_id: 1,
    email: 'RezkaPrama@gmail.com',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    whatsapp: '081234567890',
    status: 'active'
  },
  {
    id: 592,
    username: 'budisantoso',
    name: 'Budi Santoso',
    iddept: 'SALES',
    idjab: 'SLS-REP',
    id_rayon: 12,
    branch_id: 1,
    email: 'budi.santoso@cbb.com',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
    whatsapp: '085733221144',
    status: 'active'
  },
  {
    id: 593,
    username: 'aniwijaya',
    name: 'Ani Wijaya',
    iddept: 'SALES',
    idjab: 'SLS-REP',
    id_rayon: 14,
    branch_id: 2,
    email: 'ani.wijaya@cbb.com',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    whatsapp: '081299887766',
    status: 'active'
  }
];

// Helper to calculate offset date formatted string YYYY-MM-DD
export function getOffsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

// Generate dynamic visit tracking details mimicking t_crm_locations_sales table
export function getMockLocationSales(): CrmLocationSalesDb[] {
  const todayStr = getOffsetDateString(0);
  const yesterdayStr = getOffsetDateString(-1);
  const twoDaysAgoStr = getOffsetDateString(-2);

  return [
    // === REZKA PRAMADITHA (userid: 591) - Today Tracking Path ===
    {
      id: 55800,
      salesman_id: '591',
      id_contact: 101,
      name_store: 'Kharisma Fashion Festival Citylink',
      address_store: 'Lantai Ground Blok A, Jl. Peta No.241, Bandung',
      result: 'Kunjungan berkala, penataan display jilbab di Rak Gondola utama rapi. Ada pesanan 40 kodi hijab instant.',
      date: todayStr,
      latitude: '-6.936012',
      longitude: '107.601423',
      distance: 0.15,
      timestamp_checkin: `${todayStr} 08:32:10`,
      timestamp_checkout: `${todayStr} 09:45:00`,
      purpose: 'Pengecekan Rak / Display',
      order_quantity: '800 pcs (40 kodi)',
      bill_quantity: 'Rp 12.000.000',
      insentif_effective_call: 25000,
      foto_checkin: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=300&q=80',
      foto_display: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 55801,
      salesman_id: '591',
      id_contact: 102,
      name_store: 'Rabbani Dipatiukur',
      address_store: 'Jl. Dipati Ukur No.47, Lebakgede, Bandung',
      result: 'Sosialisasi potongan harga produk baru knitting motif CBB. Rak dalam kondisi sangat baik.',
      date: todayStr,
      latitude: '-6.892341',
      longitude: '107.618642',
      distance: 4.8,
      timestamp_checkin: `${todayStr} 11:15:30`,
      timestamp_checkout: `${todayStr} 12:40:15`,
      purpose: 'Pengenalan Produk',
      order_quantity: '150 pcs',
      bill_quantity: 'Rp 3.500.000',
      insentif_effective_call: 15000,
      foto_checkin: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 55802,
      salesman_id: '591',
      id_contact: 103,
      name_store: 'Cipta Fashion FO Dago',
      address_store: 'Jl. Ir. H. Juanda No.125, Lebakgede, Bandung',
      result: 'Melakukan penagihan faktur jatuh tempo. Pembayaran diterima cash sebagian, sisa transfer.',
      date: todayStr,
      latitude: '-6.887201',
      longitude: '107.615124',
      distance: 0.85,
      timestamp_checkin: `${todayStr} 14:02:00`,
      timestamp_checkout: `${todayStr} 15:10:00`,
      purpose: 'Penagihan Faktur',
      order_quantity: null,
      bill_quantity: 'Rp 8.750.000',
      insentif_effective_call: 10000,
      foto_checkin: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80'
    },

    // === REZKA PRAMADITHA (userid: 591) - Yesterday Tracking Path ===
    {
      id: 55700,
      salesman_id: '591',
      id_contact: 104,
      name_store: 'Toko Samudra Kerudung Pasar Baru',
      address_store: 'Pasar Baru Trade Center Lt. 2 Blok B, Bandung',
      result: 'Pengecekan stok rak jilbab. Rak sisi kanannya longgar/goyang perlu obeng & kencangkan baut.',
      date: yesterdayStr,
      latitude: '-6.924219',
      longitude: '107.605381',
      distance: 1.2,
      timestamp_checkin: `${yesterdayStr} 09:10:05`,
      timestamp_checkout: `${yesterdayStr} 10:30:12`,
      purpose: 'Pengecekan Rak / Display',
      order_quantity: '500 pcs',
      bill_quantity: 'Rp 5.500.000',
      insentif_effective_call: 20000,
      foto_checkin: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 55701,
      salesman_id: '591',
      id_contact: 105,
      name_store: 'Amanda Hijab Store Rancaekek',
      address_store: 'Jl. Raya Rancaekek Kencana No.12, Bandung',
      result: 'Monitoring pengiriman barang knitting v5. Rak island display terpasang sempurna.',
      date: yesterdayStr,
      latitude: '-6.974512',
      longitude: '107.766345',
      distance: 18.2,
      timestamp_checkin: `${yesterdayStr} 13:45:00`,
      timestamp_checkout: `${yesterdayStr} 15:20:00`,
      purpose: 'Kunjungan Rutin',
      order_quantity: '1000 pcs (50 kodi)',
      bill_quantity: 'Rp 15.000.000',
      insentif_effective_call: 30000,
      foto_checkin: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=300&q=80'
    },

    // === BUDI SANTOSO (userid: 592) - Today Tracking Path ===
    {
      id: 55810,
      salesman_id: '592',
      id_contact: 104,
      name_store: 'Toko Samudra Kerudung Pasar Baru',
      address_store: 'Pasar Baru Trade Center Lt. 2 Blok B, Bandung',
      result: 'Pengecekan display & penambalan stok kosong. Toko sangat ramai menjelang libur.',
      date: todayStr,
      latitude: '-6.924219',
      longitude: '107.605381',
      distance: 0.3,
      timestamp_checkin: `${todayStr} 09:15:00`,
      timestamp_checkout: `${todayStr} 11:20:00`,
      purpose: 'Pengecekan Rak / Display',
      order_quantity: '600 pcs',
      bill_quantity: 'Rp 7.200.000',
      insentif_effective_call: 25000,
      foto_checkin: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 55811,
      salesman_id: '592',
      id_contact: 101,
      name_store: 'Kharisma Fashion Festival Citylink',
      address_store: 'Lantai Ground Blok A, Jl. Peta No.241, Bandung',
      result: 'Follow up komplain warna jilbab pudar. Retur disetujui, rak diganti koleksi baru.',
      date: todayStr,
      latitude: '-6.936012',
      longitude: '107.601423',
      distance: 1.6,
      timestamp_checkin: `${todayStr} 13:10:00`,
      timestamp_checkout: `${todayStr} 14:50:00`,
      purpose: 'Kunjungan Rutin',
      order_quantity: null,
      bill_quantity: null,
      insentif_effective_call: 10000,
      foto_checkin: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80'
    },

    // === BUDI SANTOSO (userid: 592) - Yesterday Tracking Path ===
    {
      id: 55710,
      salesman_id: '592',
      id_contact: 103,
      name_store: 'Cipta Fashion FO Dago',
      address_store: 'Jl. Ir. H. Juanda No.125, Lebakgede, Bandung',
      result: 'Kunjungan komersial, owner bersedia menambah 2 rak gantung di pojok timur.',
      date: yesterdayStr,
      latitude: '-6.887201',
      longitude: '107.615124',
      distance: 1.1,
      timestamp_checkin: `${yesterdayStr} 10:00:00`,
      timestamp_checkout: `${yesterdayStr} 11:45:00`,
      purpose: 'Pengenalan Produk',
      order_quantity: '300 pcs',
      bill_quantity: 'Rp 4.500.000',
      insentif_effective_call: 20000,
      foto_checkin: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80'
    },

    // === ANI WIJAYA (userid: 593) - Today Tracking Path ===
    {
      id: 55820,
      salesman_id: '593',
      id_contact: 105,
      name_store: 'Amanda Hijab Store Rancaekek',
      address_store: 'Jl. Raya Rancaekek Kencana No.12, Bandung',
      result: 'Cek display rak utama. Ada kerusakan sambungan di panel bawah, disisipkan foam tape.',
      date: todayStr,
      latitude: '-6.974512',
      longitude: '107.766345',
      distance: 0.5,
      timestamp_checkin: `${todayStr} 10:15:00`,
      timestamp_checkout: `${todayStr} 11:55:00`,
      purpose: 'Pengecekan Rak / Display',
      order_quantity: '120 pcs',
      bill_quantity: 'Rp 2.100.000',
      insentif_effective_call: 15000,
      foto_checkin: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 55821,
      salesman_id: '593',
      id_contact: 102,
      name_store: 'Rabbani Dipatiukur',
      address_store: 'Jl. Dipati Ukur No.47, Lebakgede, Bandung',
      result: 'Mengambil pesanan tertunda untuk kaos anak rajut. Melakukan audit kebersihan rak.',
      date: todayStr,
      latitude: '-6.892341',
      longitude: '107.618642',
      distance: 17.5,
      timestamp_checkin: `${todayStr} 14:15:00`,
      timestamp_checkout: `${todayStr} 15:40:00`,
      purpose: 'Kunjungan Rutin',
      order_quantity: '400 pcs',
      bill_quantity: 'Rp 6.000.000',
      insentif_effective_call: 20000,
      foto_checkin: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80'
    },

    // === ANI WIJAYA (userid: 593) - Yesterday Tracking Path ===
    {
      id: 55720,
      salesman_id: '593',
      id_contact: 101,
      name_store: 'Kharisma Fashion Festival Citylink',
      address_store: 'Lantai Ground Blok A, Jl. Peta No.241, Bandung',
      result: 'Pengenalan produk baris eksklusif rajut. Rak dipindahkan ke posisi lorong depan escalator.',
      date: yesterdayStr,
      latitude: '-6.936012',
      longitude: '107.601423',
      distance: 1.8,
      timestamp_checkin: `${yesterdayStr} 11:00:00`,
      timestamp_checkout: `${yesterdayStr} 13:15:00`,
      purpose: 'Pengenalan Produk',
      order_quantity: '80 pcs',
      bill_quantity: 'Rp 1.950.000',
      insentif_effective_call: 15000,
      foto_checkin: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=300&q=80'
    },

    // === TWO DAYS AGO ALL SALES ===
    {
      id: 55601,
      salesman_id: '591',
      id_contact: 102,
      name_store: 'Rabbani Dipatiukur',
      address_store: 'Jl. Dipati Ukur No.47, Lebakgede, Bandung',
      result: 'Kunjungan rutin 2 hari lalu. Rak bersih berkilau, stok aman melimpah.',
      date: twoDaysAgoStr,
      latitude: '-6.892341',
      longitude: '107.618642',
      distance: 0.1,
      timestamp_checkin: `${twoDaysAgoStr} 10:05:00`,
      timestamp_checkout: `${twoDaysAgoStr} 11:20:00`,
      purpose: 'Kunjungan Rutin',
      order_quantity: null,
      bill_quantity: null,
      insentif_effective_call: 10000,
      foto_checkin: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 55602,
      salesman_id: '592',
      id_contact: 105,
      name_store: 'Amanda Hijab Store Rancaekek',
      address_store: 'Jl. Raya Rancaekek Kencana No.12, Bandung',
      result: 'Audit display mingguan. Hasil memuaskan, rak ditempatkan strategis.',
      date: twoDaysAgoStr,
      latitude: '-6.974512',
      longitude: '107.766345',
      distance: 0.4,
      timestamp_checkin: `${twoDaysAgoStr} 13:00:00`,
      timestamp_checkout: `${twoDaysAgoStr} 14:15:00`,
      purpose: 'Kunjungan Rutin',
      order_quantity: '200 pcs',
      bill_quantity: 'Rp 3.000.000',
      insentif_effective_call: 15000,
      foto_checkin: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=300&q=80'
    }
  ];
}
