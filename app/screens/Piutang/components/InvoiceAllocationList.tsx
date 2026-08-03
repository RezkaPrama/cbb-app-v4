import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRupiah } from '../utils/formatRupiah';
import type { InvoicePiutang } from '../../../service/apiService';

export interface FifoAllocationItem {
  invoice: InvoicePiutang;
  isChecked: boolean;
  allocatedAmount: number;
  sisaSetelah: number;
  statusResult: 'LUNAS' | 'SEBAGIAN' | 'Tidak Terpengaruh';
}

interface Props {
  allocations: FifoAllocationItem[];
  onToggle: (invoiceId: number) => void;
}

export default function InvoiceAllocationList({ allocations, onToggle }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="document-text-outline" size={14} color="#043DAE" />
          <Text style={styles.headerTitle}>ALOKASI FAKTUR (FIFO)</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{allocations.length} Faktur</Text>
        </View>
      </View>

      <Text style={styles.hint}>
        Urutan FIFO berdasarkan tanggal faktur terlama. Hilangkan centang jika pembayaran hanya untuk faktur tertentu.
      </Text>

      <View style={{ gap: 10, marginTop: 4 }}>
        {allocations.map((item, index) => {
          const inv = item.invoice;
          const cardStyle = !item.isChecked
            ? styles.cardUnchecked
            : item.allocatedAmount > 0
            ? styles.cardActive
            : styles.cardDefault;

          const statusStyle =
            item.statusResult === 'LUNAS'
              ? styles.statusLunas
              : item.statusResult === 'SEBAGIAN'
              ? styles.statusSebagian
              : styles.statusNone;

          return (
            <View key={inv.id} style={[styles.card, cardStyle]}>
              <View style={styles.rowTop}>
                <TouchableOpacity onPress={() => onToggle(inv.id)} style={styles.checkboxTouch} hitSlop={{top:6,bottom:6,left:6,right:6}}>
                  <Ionicons
                    name={item.isChecked ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={item.isChecked ? '#043DAE' : '#94a3b8'}
                  />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <View style={styles.rowInline}>
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexBadgeText}>#{index + 1}</Text>
                    </View>
                    <Text style={styles.noPenjualan} numberOfLines={1}>{inv.no_penjualan}</Text>
                  </View>
                  <Text style={styles.metaText}>
                    No. Piutang: {inv.no_piutang} · Jatuh Tempo: {inv.tgl_jatuh_tempo}
                  </Text>
                </View>

                <View style={[styles.statusBadge, statusStyle]}>
                  <Text style={styles.statusBadgeText}>{item.statusResult}</Text>
                </View>
              </View>

              <View style={styles.amountGrid}>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Sisa Saat Ini</Text>
                  <Text style={styles.amountRed}>{formatRupiah(inv.sisa_piutang)}</Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Dibayar Kali Ini</Text>
                  <Text style={styles.amountBlue}>{formatRupiah(item.allocatedAmount)}</Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Sisa Setelah</Text>
                  <Text style={styles.amountDark}>{formatRupiah(item.sisaSetelah)}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 11, fontWeight: '800', color: '#1e293b', letterSpacing: 0.4 },
  countBadge: { backgroundColor: '#dbeafe', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 9, fontWeight: '800', color: '#1e40af' },
  hint: { fontSize: 10, color: '#64748b', marginTop: 6, lineHeight: 14 },
  card: { borderRadius: 12, borderWidth: 1, padding: 10 },
  cardDefault: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
  cardActive: { backgroundColor: '#eff6ff', borderColor: '#93c5fd' },
  cardUnchecked: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', opacity: 0.6 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  checkboxTouch: { marginTop: 1 },
  rowInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  indexBadge: { backgroundColor: '#f1f5f9', borderRadius: 4, paddingHorizontal: 4 },
  indexBadgeText: { fontSize: 9, fontWeight: '700', color: '#475569', fontFamily: 'monospace' },
  noPenjualan: { fontSize: 12, fontWeight: '800', color: '#0f172a', fontFamily: 'monospace', flexShrink: 1 },
  metaText: { fontSize: 9.5, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3 },
  statusBadgeText: { fontSize: 8.5, fontWeight: '800' },
  statusLunas: { backgroundColor: '#d1fae5' },
  statusSebagian: { backgroundColor: '#fef3c7' },
  statusNone: { backgroundColor: '#f1f5f9' },
  amountGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 8,
  },
  amountCol: { flex: 1 },
  amountLabel: { fontSize: 8, color: '#94a3b8' },
  amountRed: { fontSize: 10, fontWeight: '800', color: '#dc2626', fontFamily: 'monospace', marginTop: 1 },
  amountBlue: { fontSize: 10, fontWeight: '800', color: '#1d4ed8', fontFamily: 'monospace', marginTop: 1 },
  amountDark: { fontSize: 10, fontWeight: '800', color: '#1e293b', fontFamily: 'monospace', marginTop: 1 },
});