import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRupiah } from '../utils/formatRupiah';

interface Props {
  totalSisaChecked: number;
  jumlahBayar: number;
  sisaSetelahBayar: number;
}

export default function PaymentSummaryBox({ totalSisaChecked, jumlahBayar, sisaSetelahBayar }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="wallet-outline" size={16} color="#fff" />
        <Text style={styles.headerText}>RINGKASAN PEMBAYARAN</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Total Sisa Piutang:</Text>
        <Text style={styles.value}>{formatRupiah(totalSisaChecked)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Jumlah Bayar:</Text>
        <Text style={styles.value}>{formatRupiah(jumlahBayar)}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.labelBold}>Sisa Setelah Bayar:</Text>
        <Text style={styles.valueBold}>{formatRupiah(sisaSetelahBayar)}</Text>
      </View>

      <View style={styles.noteBox}>
        <Ionicons name="alert-circle-outline" size={14} color="#fcd34d" style={{ marginTop: 1 }} />
        <Text style={styles.noteText}>
          Pembayaran masuk status <Text style={styles.noteBold}>Belum Posting</Text> dan memerlukan verifikasi
          keuangan sebelum piutang dikurangi secara permanen.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d9488',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
  },
  headerText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  value: { color: '#fff', fontWeight: '700', fontSize: 12 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 6,
  },
  labelBold: { color: '#fff', fontWeight: '800', fontSize: 13 },
  valueBold: { color: '#d1fae5', fontWeight: '800', fontSize: 14 },
  noteBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 8,
    marginTop: 8,
    flexDirection: 'row',
    gap: 6,
  },
  noteText: { color: '#d1fae5', fontSize: 9.5, lineHeight: 13, flex: 1 },
  noteBold: { fontWeight: '800' },
});