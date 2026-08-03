import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import apiService, {
  CustomerPiutangSearch, InvoicePiutang, BankAccountPiutang, ReturPiutang,
  PhotoFile, PembayaranPiutangPayload,
} from '../../service/apiService';
// ^ path ini berlaku kalau struktur folder: screens/Piutang/PiutangFormScreen.tsx

import { useDebouncedValue } from './hooks/useDebouncedValue';
import { formatRupiah } from './utils/formatRupiah';

import CustomerSearchBar from './components/CustomerSearchBar';
import SelectedCustomerCard from './components/SelectedCustomerCard';
import PaymentDetailForm from './components/PaymentDetailForm';
import ProofUploadField from './components/ProofUploadField';
import InvoiceAllocationList, { FifoAllocationItem } from './components/InvoiceAllocationList';
import PaymentSummaryBox from './components/PaymentSummaryBox';
import PaymentSuccessModal from './components/PaymentSuccessModal';
import PiutangHeader from './PiutangHeader';

type JenisPembayaran = PembayaranPiutangPayload['jenis_pembayaran'];

interface Props {
  navigation: StackNavigationProp<any>;
}

const todayISO = () => new Date().toISOString().split('T')[0];

export default function PiutangFormScreen({ navigation }: Props) {
  // --- Customer search ---
  const [customerQuery, setCustomerQuery] = useState('');
  const debouncedCustomerQuery = useDebouncedValue(customerQuery, 400);
  const [customerResults, setCustomerResults] = useState<CustomerPiutangSearch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPiutangSearch | null>(null);

  // --- Invoices for selected customer ---
  const [invoices, setInvoices] = useState<InvoicePiutang[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({});

  // --- Payment methods / bank accounts / retur options ---
  const [bankAccounts, setBankAccounts] = useState<BankAccountPiutang[]>([]);
  const [returOptions, setReturOptions] = useState<ReturPiutang[]>([]);

  // --- Form fields ---
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [paymentMethod, setPaymentMethod] = useState<JenisPembayaran>('Tunai');
  const [bankAccountId, setBankAccountId] = useState<number | null>(null);
  const [namaGiro, setNamaGiro] = useState('');
  const [noGiro, setNoGiro] = useState('');
  const [tglJatuhTempoGiro, setTglJatuhTempoGiro] = useState('');
  const [noRetur, setNoRetur] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [proofPhoto, setProofPhoto] = useState<PhotoFile | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{ no_bayar: string } | null>(null);

  // --- Fetch payment methods (bank accounts) once on mount ---
  useEffect(() => {
    apiService.getPiutangPaymentMethods().then((res) => {
      if (res.success && res.data) setBankAccounts(res.data.bank_accounts || []);
    });
  }, []);

  // --- Search customer (debounced) ---
  useEffect(() => {
    const q = debouncedCustomerQuery.trim();
    if (q.length < 2) {
      setCustomerResults([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    apiService.searchPiutangCustomer(q).then((res) => {
      if (cancelled) return;
      setSearchLoading(false);
      if (res.success) setCustomerResults(res.data || []);
    });
    return () => { cancelled = true; };
  }, [debouncedCustomerQuery]);

  // --- Load invoices + retur list when customer selected ---
  useEffect(() => {
    if (!selectedCustomer) {
      setInvoices([]);
      setCheckedMap({});
      return;
    }
    setInvoicesLoading(true);
    Promise.all([
      apiService.getPiutangCustomerInvoices(selectedCustomer.idcust),
      apiService.getPiutangReturByCustomer(selectedCustomer.idcust),
    ]).then(([invRes, returRes]) => {
      setInvoicesLoading(false);
      const invData = (invRes.success ? (invRes as any).data : []) as InvoicePiutang[];
      setInvoices(invData || []);
      // default: semua faktur dicentang (FIFO default)
      const initialChecked: Record<number, boolean> = {};
      (invData || []).forEach((inv) => { initialChecked[inv.id] = true; });
      setCheckedMap(initialChecked);

      if (returRes.success) setReturOptions(returRes.data || []);
    });
  }, [selectedCustomer]);

  const handleSelectCustomer = (c: CustomerPiutangSearch) => {
    setSelectedCustomer(c);
    setCustomerQuery('');
    setCustomerResults([]);
  };

  const handleChangeCustomer = () => {
    setSelectedCustomer(null);
    setInvoices([]);
    setCheckedMap({});
  };

  const toggleInvoiceCheck = (invoiceId: number) => {
    setCheckedMap((prev) => ({ ...prev, [invoiceId]: !prev[invoiceId] }));
  };

  const numericAmount = useMemo(() => parseInt(amountStr || '0', 10), [amountStr]);

  // Invoices sudah terurut FIFO (tgl_faktur ASC) dari API — urutkan ulang untuk jaga-jaga
  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => (a.tgl_terima || '').localeCompare(b.tgl_terima || '')),
    [invoices]
  );

  // Engine alokasi FIFO — otomatis geser ke faktur berikutnya kalau salah satu di-uncheck
  const fifoAllocations: FifoAllocationItem[] = useMemo(() => {
    let remaining = paymentMethod === 'Retur' ? 0 : numericAmount;

    return sortedInvoices.map((inv) => {
      const isChecked = checkedMap[inv.id] !== false;
      if (!isChecked) {
        return { invoice: inv, isChecked: false, allocatedAmount: 0, sisaSetelah: inv.sisa_piutang, statusResult: 'Tidak Terpengaruh' };
      }

      const balance = inv.sisa_piutang;
      let allocated = 0;
      if (remaining > 0) {
        allocated = Math.min(remaining, balance);
        remaining -= allocated;
      }
      const sisaSetelah = balance - allocated;
      const statusResult = allocated > 0 ? (sisaSetelah <= 0 ? 'LUNAS' : 'SEBAGIAN') : 'Tidak Terpengaruh';

      return { invoice: inv, isChecked: true, allocatedAmount: allocated, sisaSetelah, statusResult };
    });
  }, [sortedInvoices, checkedMap, numericAmount, paymentMethod]);

  const totalCheckedSisa = useMemo(
    () => fifoAllocations.filter((a) => a.isChecked).reduce((sum, a) => sum + a.invoice.sisa_piutang, 0),
    [fifoAllocations]
  );

  const remainingAfterPayment = Math.max(totalCheckedSisa - numericAmount, 0);
  const overpaid = numericAmount > totalCheckedSisa && paymentMethod !== 'Retur';

  const validate = (): string | null => {
    if (!selectedCustomer) return 'Pilih pelanggan terlebih dahulu.';
    if (!paymentDate) return 'Tanggal pembayaran wajib diisi.';

    if (paymentMethod === 'Retur') {
      if (!noRetur) return 'Pilih nomor retur.';
      return null;
    }

    if (numericAmount <= 0) return 'Masukkan jumlah pembayaran yang valid.';
    if (overpaid) return `Jumlah pembayaran melebihi total sisa piutang yang dicentang (kelebihan ${formatRupiah(numericAmount - totalCheckedSisa)}). Centang faktur lain atau kurangi nominal.`;

    const checkedIds = fifoAllocations.filter((a) => a.isChecked).map((a) => a.invoice.id);
    if (checkedIds.length === 0) return 'Centang minimal satu faktur untuk dialokasikan.';

    if (paymentMethod === 'Transfer' && !bankAccountId) return 'Pilih rekening tujuan transfer.';
    if (paymentMethod === 'Giro') {
      if (!bankAccountId) return 'Pilih rekening tujuan giro.';
      if (!namaGiro || !noGiro || !tglJatuhTempoGiro) return 'Lengkapi data giro (nama, no. giro, jatuh tempo).';
    }

    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Periksa Kembali', err);
      return;
    }
    if (!selectedCustomer) return;

    setSubmitting(true);

    const checkedIds = fifoAllocations.filter((a) => a.isChecked).map((a) => a.invoice.id);

    const payload: PembayaranPiutangPayload = {
      customer_id: selectedCustomer.idcust,
      tgl_bayar: paymentDate,
      jenis_pembayaran: paymentMethod,
      total_bayar: paymentMethod === 'Retur'
        ? (returOptions.find((r) => r.no_retur === noRetur)?.netto ?? 0)
        : numericAmount,
      keterangan: keterangan || undefined,
      bukti_transfer: proofPhoto,
      ...(paymentMethod !== 'Retur' ? { piutang_ids: checkedIds } : {}),
      ...(paymentMethod === 'Transfer' || paymentMethod === 'Giro' ? { bank_account_id: bankAccountId! } : {}),
      ...(paymentMethod === 'Giro' ? { nama_giro: namaGiro, no_giro: noGiro, tgl_jatuh_tempo_giro: tglJatuhTempoGiro } : {}),
      ...(paymentMethod === 'Retur' ? { no_retur: noRetur } : {}),
    };

    const res = await apiService.submitPiutangPayment(payload);
    setSubmitting(false);

    if (!res.success) {
      Alert.alert('Gagal Menyimpan', res.message || 'Terjadi kesalahan saat menyimpan pembayaran.');
      return;
    }

    setSuccessResult({ no_bayar: res.data?.no_bayar || '-' });
  };

  const closeSuccessAndGoBack = () => {
    setSuccessResult(null);
    navigation.navigate('PiutangListScreen');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <SafeAreaView edges={['top']} style={styles.headerBlue}>
        <PiutangHeader
          title="Form Input Pembayaran"
          subtitle="Alokasi FIFO & Potong Faktur"
          onBackPress={() => navigation.goBack()}
        />
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* STEP 1: Cari & pilih pelanggan */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.rowInline}>
                <Ionicons name="search" size={14} color="#043DAE" />
                <Text style={styles.cardTitle}>PILIH PELANGGAN / TOKO</Text>
              </View>
            </View>

            {!selectedCustomer ? (
              <>
                <View style={{ marginTop: 8 }}>
                  <CustomerSearchBar
                    query={customerQuery}
                    onChangeQuery={setCustomerQuery}
                    loading={searchLoading}
                    results={customerResults}
                    onSelectCustomer={handleSelectCustomer}
                  />
                </View>
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxText}>Cari & pilih pelanggan untuk memproses pembayaran piutang.</Text>
                </View>
              </>
            ) : (
              <SelectedCustomerCard
                customer={selectedCustomer}
                totalSisaPiutang={invoices.reduce((s, i) => s + i.sisa_piutang, 0)}
                jumlahFaktur={invoices.length}
                onChangeCustomer={handleChangeCustomer}
              />
            )}
          </View>

          {selectedCustomer && invoicesLoading && (
            <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#043DAE" />
          )}

          {selectedCustomer && !invoicesLoading && (
            <>
              {/* STEP 2: Detail pembayaran */}
              <View style={styles.card}>
                <PaymentDetailForm
                  paymentDate={paymentDate}
                  onChangeDate={setPaymentDate}
                  paymentMethod={paymentMethod}
                  onChangeMethod={setPaymentMethod}
                  bankAccounts={bankAccounts}
                  bankAccountId={bankAccountId}
                  onChangeBankAccount={setBankAccountId}
                  namaGiro={namaGiro}
                  onChangeNamaGiro={setNamaGiro}
                  noGiro={noGiro}
                  onChangeNoGiro={setNoGiro}
                  tglJatuhTempoGiro={tglJatuhTempoGiro}
                  onChangeTglJatuhTempoGiro={setTglJatuhTempoGiro}
                  returOptions={returOptions}
                  noRetur={noRetur}
                  onChangeNoRetur={setNoRetur}
                  amountStr={amountStr}
                  onChangeAmount={setAmountStr}
                  maxAmount={totalCheckedSisa}
                  keterangan={keterangan}
                  onChangeKeterangan={setKeterangan}
                />

                <View style={{ marginTop: 12 }}>
                  <ProofUploadField photo={proofPhoto} onChangePhoto={setProofPhoto} />
                </View>
              </View>

              {/* STEP 3: Alokasi FIFO (hanya untuk metode non-Retur) */}
              {paymentMethod !== 'Retur' && invoices.length > 0 && (
                <InvoiceAllocationList allocations={fifoAllocations} onToggle={toggleInvoiceCheck} />
              )}

              {/* STEP 4: Ringkasan */}
              {paymentMethod !== 'Retur' && (
                <PaymentSummaryBox
                  totalSisaChecked={totalCheckedSisa}
                  jumlahBayar={numericAmount}
                  sisaSetelahBayar={remainingAfterPayment}
                />
              )}
            </>
          )}
        </ScrollView>

        {/* Footer actions */}
        {selectedCustomer && !invoicesLoading && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Submit Pembayaran</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <PaymentSuccessModal
        visible={!!successResult}
        noBayar={successResult?.no_bayar || ''}
        namaCustomer={selectedCustomer?.nama || ''}
        jenisPembayaran={paymentMethod}
        jumlahBayar={paymentMethod === 'Retur' ? (returOptions.find((r) => r.no_retur === noRetur)?.netto ?? 0) : numericAmount}
        onClose={closeSuccessAndGoBack}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f9fd' },
  headerBlue: { backgroundColor: '#043DAE' },
  scrollContent: { padding: 14, gap: 14, paddingBottom: 30 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 11, fontWeight: '800', color: '#334155', letterSpacing: 0.4 },
  infoBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, padding: 10, marginTop: 10 },
  infoBoxText: { fontSize: 10.5, color: '#92400e', textAlign: 'center', fontWeight: '600' },
  footer: {
    flexDirection: 'row', gap: 8, padding: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 12,
  },
  cancelBtnText: { color: '#475569', fontWeight: '700', fontSize: 12 },
  submitBtn: {
    flex: 2, flexDirection: 'row', gap: 6, backgroundColor: '#059669', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 12,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});