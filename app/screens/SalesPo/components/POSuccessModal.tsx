import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRupiah } from '../../Piutang/utils/formatRupiah';

interface Props {
  visible: boolean;
  code: string;
  custName: string;
  totalQtyPack: number;
  netto: number;
  onClose: () => void;
}

export default function POSuccessModal({ visible, code, custName, totalQtyPack, netto, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={30} color="#059669" />
          </View>

          <View style={{ alignItems: 'center', marginTop: 6 }}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Status: PENDING</Text>
            </View>
            <Text style={styles.title}>Purchase Order Berhasil Disimpan!</Text>
            <Text style={styles.subtitle}>No. PO: {code}</Text>
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.rowBetween}>
              <Text style={styles.summaryLabel}>Pelanggan:</Text>
              <Text style={styles.summaryValue}>{custName}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.summaryLabel}>Total Qty:</Text>
              <Text style={styles.summaryValue}>{totalQtyPack} Pack</Text>
            </View>
            <View style={[styles.rowBetween, styles.nettoRow]}>
              <Text style={styles.summaryLabel}>Total Netto:</Text>
              <Text style={styles.nettoValue}>{formatRupiah(netto)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Kembali Ke List PO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 22, padding: 20, width: '100%', maxWidth: 320, gap: 10 },
  iconWrap: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#d1fae5',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center',
  },
  statusBadge: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#92400e', fontFamily: 'monospace' },
  title: { fontSize: 14, fontWeight: '900', color: '#0f172a', marginTop: 8, textAlign: 'center' },
  subtitle: { fontSize: 10.5, color: '#64748b', marginTop: 3, fontFamily: 'monospace' },
  summaryBox: { backgroundColor: '#f8fafc', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 10.5, color: '#94a3b8', fontFamily: 'monospace' },
  summaryValue: { fontSize: 10.5, fontWeight: '800', color: '#1e293b', fontFamily: 'monospace' },
  nettoRow: { paddingTop: 6, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  nettoValue: { fontSize: 12, fontWeight: '900', color: '#4338ca', fontFamily: 'monospace' },
  closeBtn: { backgroundColor: '#043DAE', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});