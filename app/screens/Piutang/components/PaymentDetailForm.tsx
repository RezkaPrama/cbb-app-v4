import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
// npm install @react-native-picker/picker (kalau belum ada di project)
import { formatRupiah, formatDigitsWithDots, digitsOnly } from '../utils/formatRupiah';
import type { BankAccountPiutang, ReturPiutang } from '../../../service/apiService';

type JenisPembayaran = 'Tunai' | 'Transfer' | 'Giro' | 'Credit Memo' | 'Debit Memo' | 'Retur';

interface Props {
  paymentDate: string;
  onChangeDate: (v: string) => void;

  paymentMethod: JenisPembayaran;
  onChangeMethod: (v: JenisPembayaran) => void;

  bankAccounts: BankAccountPiutang[];
  bankAccountId: number | null;
  onChangeBankAccount: (id: number) => void;

  namaGiro: string;
  onChangeNamaGiro: (v: string) => void;
  noGiro: string;
  onChangeNoGiro: (v: string) => void;
  tglJatuhTempoGiro: string;
  onChangeTglJatuhTempoGiro: (v: string) => void;

  returOptions: ReturPiutang[];
  noRetur: string;
  onChangeNoRetur: (v: string) => void;

  amountStr: string;
  onChangeAmount: (v: string) => void;
  maxAmount: number;

  keterangan: string;
  onChangeKeterangan: (v: string) => void;
}

const QUICK_PRESETS = (max: number) => [
  { label: 'Pelunasan Total', val: max },
  { label: '50%', val: Math.round(max * 0.5) },
  { label: 'Rp 1.000.000', val: 1000000 },
  { label: 'Rp 3.000.000', val: 3000000 },
];

export default function PaymentDetailForm(props: Props) {
  const {
    paymentDate, onChangeDate,
    paymentMethod, onChangeMethod,
    bankAccounts, bankAccountId, onChangeBankAccount,
    namaGiro, onChangeNamaGiro, noGiro, onChangeNoGiro, tglJatuhTempoGiro, onChangeTglJatuhTempoGiro,
    returOptions, noRetur, onChangeNoRetur,
    amountStr, onChangeAmount, maxAmount,
    keterangan, onChangeKeterangan,
  } = props;

  const needsBankAccount = paymentMethod === 'Transfer' || paymentMethod === 'Giro';

  return (
    <View style={{ gap: 12 }}>
      {/* Tanggal & Metode */}
      <View style={styles.rowTwoCol}>
        <View style={styles.col}>
          <Text style={styles.label}>TANGGAL PEMBAYARAN *</Text>
          <TextInput
            style={styles.input}
            value={paymentDate}
            onChangeText={onChangeDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>METODE BAYAR *</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={paymentMethod} onValueChange={(v) => onChangeMethod(v as JenisPembayaran)}>
              <Picker.Item label="Tunai / Cash" value="Tunai" />
              <Picker.Item label="Bank Transfer" value="Transfer" />
              <Picker.Item label="Giro" value="Giro" />
              <Picker.Item label="Credit Memo" value="Credit Memo" />
              <Picker.Item label="Debit Memo" value="Debit Memo" />
              <Picker.Item label="Retur Produk" value="Retur" />
            </Picker>
          </View>
        </View>
      </View>

      {/* Bank account (Transfer / Giro) */}
      {needsBankAccount && (
        <View>
          <Text style={styles.label}>REKENING TUJUAN *</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={bankAccountId ?? undefined}
              onValueChange={(v) => onChangeBankAccount(Number(v))}
            >
              <Picker.Item label="-- Pilih Rekening --" value={undefined} />
              {bankAccounts.map((b) => (
                <Picker.Item key={b.id} label={`${b.bank_name} - ${b.account_number}`} value={b.id} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Giro extra fields */}
      {paymentMethod === 'Giro' && (
        <View style={{ gap: 8 }}>
          <View>
            <Text style={styles.label}>NAMA GIRO *</Text>
            <TextInput style={styles.input} value={namaGiro} onChangeText={onChangeNamaGiro} placeholder="Nama pada giro" />
          </View>
          <View style={styles.rowTwoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>NO. GIRO *</Text>
              <TextInput style={styles.input} value={noGiro} onChangeText={onChangeNoGiro} placeholder="No. giro" />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>JATUH TEMPO *</Text>
              <TextInput style={styles.input} value={tglJatuhTempoGiro} onChangeText={onChangeTglJatuhTempoGiro} placeholder="YYYY-MM-DD" />
            </View>
          </View>
        </View>
      )}

      {/* Retur */}
      {paymentMethod === 'Retur' && (
        <View>
          <Text style={styles.label}>NO. RETUR *</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={noRetur} onValueChange={onChangeNoRetur}>
              <Picker.Item label="-- Pilih Retur --" value="" />
              {returOptions.map((r) => (
                <Picker.Item key={r.no_retur} label={`${r.no_retur} · ${r.netto_formatted}`} value={r.no_retur} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Jumlah pembayaran */}
      {paymentMethod !== 'Retur' && (
        <View>
          <View style={styles.amountHeaderRow}>
            <Text style={styles.label}>JUMLAH PEMBAYARAN *</Text>
            <Text style={styles.maxText}>Max: {formatRupiah(maxAmount)}</Text>
          </View>

          <View style={styles.amountInputWrap}>
            <Text style={styles.rpPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              value={formatDigitsWithDots(amountStr)}
              onChangeText={(v) => onChangeAmount(digitsOnly(v))}
              placeholder="0"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {QUICK_PRESETS(maxAmount).map((btn) => (
                <TouchableOpacity key={btn.label} style={styles.quickBtn} onPress={() => onChangeAmount(String(btn.val))}>
                  <Text style={styles.quickBtnText}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Keterangan */}
      <View>
        <Text style={styles.label}>KETERANGAN (OPSIONAL)</Text>
        <TextInput
          style={styles.input}
          value={keterangan}
          onChangeText={onChangeKeterangan}
          placeholder="Keterangan tambahan..."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 9.5, fontWeight: '700', color: '#64748b', marginBottom: 4, letterSpacing: 0.3 },
  rowTwoCol: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  pickerWrap: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  amountHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  maxText: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  rpPrefix: { fontWeight: '800', color: '#043DAE', fontSize: 13, marginRight: 4 },
  amountInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  quickBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickBtnText: { fontSize: 10, fontWeight: '700', color: '#334155' },
});