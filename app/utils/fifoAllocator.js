/**
 * Hitung alokasi FIFO berdasarkan daftar invoice (sudah terurut tgl_faktur ASC dari API)
 * dan set id invoice yang di-uncheck user.
 *
 * @param {Array} invoices - dari getCustomerInvoices, field: id, sisa_piutang, dst
 * @param {number} jumlahBayar
 * @param {Set<string|number>} excludedIds - id invoice yang di-uncheck
 * @returns {Array} allocations dengan field tambahan: isChecked, allocatedAmount, sisaSetelah, statusResult
 */
export function calculateFifoAllocation(invoices, jumlahBayar, excludedIds = new Set()) {
  let sisaBayar = Number(jumlahBayar) || 0;

  return invoices.map((inv) => {
    const isChecked = !excludedIds.has(String(inv.id));
    const sisaSaatIni = Number(inv.sisa_piutang);

    if (!isChecked || sisaSaatIni <= 0) {
      return {
        ...inv,
        isChecked,
        allocatedAmount: 0,
        sisaSetelah: sisaSaatIni,
        statusResult: isChecked ? 'Tidak Terpengaruh' : 'Dikecualikan',
      };
    }

    let allocated = 0;
    if (sisaBayar > 0) {
      allocated = Math.min(sisaBayar, sisaSaatIni);
      sisaBayar -= allocated;
    }

    const sisaSetelah = sisaSaatIni - allocated;
    let statusResult = 'Tidak Terpengaruh';
    if (allocated > 0) {
      statusResult = sisaSetelah <= 0.01 ? 'LUNAS' : 'SEBAGIAN';
    }

    return { ...inv, isChecked: true, allocatedAmount: allocated, sisaSetelah, statusResult };
  });
}

export function totalCheckedSisa(invoices, excludedIds = new Set()) {
  return invoices
    .filter((inv) => !excludedIds.has(String(inv.id)))
    .reduce((sum, inv) => sum + Number(inv.sisa_piutang), 0);
}

export function formatRp(num) {
  const n = Math.round(Number(num) || 0);
  return 'Rp ' + n.toLocaleString('id-ID');
}