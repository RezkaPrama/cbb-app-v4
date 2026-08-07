import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { formatRupiah } from '../../Piutang/utils/formatRupiah';

interface Props {
  hpp: number;
  bruto: number;
  diskon1: number;
  diskon2: number;
  diskon3: number;
  onChangeDiskon1: (v: number) => void;
  onChangeDiskon2: (v: number) => void;
  onChangeDiskon3: (v: number) => void;
  diskon1Rp: number;
  diskon2Rp: number;
  diskon3Rp: number;
  netto: number;
}

export default function DiscountBreakdownBox({
  hpp, bruto, diskon1, diskon2, diskon3,
  onChangeDiskon1, onChangeDiskon2, onChangeDiskon3,
  diskon1Rp, diskon2Rp, diskon3Rp, netto,
}: Props) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.box}>
        <View style={styles.rowBetween}>
          <Text style={styles.rowLabel}>Hpp</Text>
          <Text style={styles.rowValueMuted}>(+) {formatRupiah(hpp)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.rowLabel}>Bruto</Text>
          <Text style={styles.rowValue}>(+) {formatRupiah(bruto)}</Text>
        </View>
        <View style={[styles.rowBetween, styles.discRow]}>
          <Text style={styles.discLabel}>Diskon 1</Text>
          <Text style={styles.discValue}>(-) {formatRupiah(diskon1Rp)}</Text>
        </View>
        <View style={[styles.rowBetween, styles.discRow]}>
          <Text style={styles.discLabel}>Diskon 2</Text>
          <Text style={styles.discValue}>(-) {formatRupiah(diskon2Rp)}</Text>
        </View>
        <View style={[styles.rowBetween, styles.discRow]}>
          <Text style={styles.discLabel}>Diskon 3</Text>
          <Text style={styles.discValue}>(-) {formatRupiah(diskon3Rp)}</Text>
        </View>
        <View style={[styles.rowBetween, styles.nettoRow]}>
          <Text style={styles.nettoLabel}>Netto</Text>
          <Text style={styles.nettoValue}>{formatRupiah(netto)}</Text>
        </View>
      </View>

      <View style={styles.discInputRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Diskon 1 (%)</Text>
          <TextInput
            style={[styles.discInput, styles.discInputDisabled]}
            keyboardType="numeric"
            value={String(diskon1)}
            editable={false}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Diskon 2 (%)</Text>
          <TextInput
            style={styles.discInput}
            keyboardType="numeric"
            value={String(diskon2)}
            onChangeText={(v) => onChangeDiskon2(parseFloat(v) || 0)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Diskon 3 (%)</Text>
          <TextInput
            style={styles.discInput}
            keyboardType="numeric"
            value={String(diskon3)}
            onChangeText={(v) => onChangeDiskon3(parseFloat(v) || 0)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, gap: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 10.5, color: '#64748b', fontFamily: 'monospace' },
  rowValue: { fontSize: 10.5, fontWeight: '700', color: '#334155', fontFamily: 'monospace' },
  rowValueMuted: { fontSize: 10.5, fontWeight: '700', color: '#64748b', fontFamily: 'monospace' },
  discRow: { backgroundColor: '#fff1f2', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  discLabel: { fontSize: 10.5, color: '#e11d48', fontFamily: 'monospace' },
  discValue: { fontSize: 10.5, fontWeight: '800', color: '#e11d48', fontFamily: 'monospace' },
  nettoRow: { paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  nettoLabel: { fontSize: 12.5, fontWeight: '900', color: '#0f172a' },
  nettoValue: { fontSize: 13, fontWeight: '900', color: '#4338ca', fontFamily: 'monospace' },
  discInputRow: { flexDirection: 'row', gap: 8 },
  inputLabel: { fontSize: 9, fontWeight: '700', color: '#475569', marginBottom: 3 },
  discInput: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 8,
    fontSize: 12, fontWeight: '700', color: '#0f172a', textAlign: 'center', fontFamily: 'monospace',
  },
  discInputDisabled: {
    backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', color: '#64748b',
  },
});