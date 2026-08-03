/**
 * Format angka ke Rupiah tanpa bergantung pada Intl/toLocaleString('id-ID')
 * (support-nya tidak konsisten di semua Hermes build).
 */
export function formatRupiah(value: number | string | undefined | null): string {
  const num = typeof value === 'string' ? parseInt(value.replace(/[^0-9-]/g, '') || '0', 10) : value ?? 0;
  const isNegative = num < 0;
  const abs = Math.abs(Math.round(num));
  const withDots = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (isNegative ? '-Rp ' : 'Rp ') + withDots;
}

/** Ambil hanya digit dari string input (untuk TextInput jumlah bayar) */
export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

/** Format string digit -> "1.000.000" (tanpa prefix Rp), untuk ditampilkan di TextInput */
export function formatDigitsWithDots(value: string): string {
  const clean = digitsOnly(value);
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}