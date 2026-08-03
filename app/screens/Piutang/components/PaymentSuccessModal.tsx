import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRupiah } from '../utils/formatRupiah';

interface Props {
  visible: boolean;
  noBayar: string;
  namaCustomer: string;
  jenisPembayaran: string;
  jumlahBayar: number;
  onClose: () => void;
}

export default function PaymentSuccessModal({ visible, noBayar, namaCustomer, jenisPembayaran, jumlahBayar, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={36} color="#059669" />
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Status: Belum Posting</Text>
          </View>

          <Text style={styles.title}>Pembayaran Berhasil Disimpan!</Text>
          <Text style={styles.refText}>No. Ref: {noBayar}</Text>

          <View style={styles.detailBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pelanggan:</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{namaCustomer}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Metode:</Text>
              <Text style={styles.detailValue}>{jenisPembayaran}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nominal:</Text>
              <Text style={styles.detailValueGreen}>{formatRupiah(jumlahBayar)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Lihat di List Pembayaran</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusBadge: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 9.5, fontWeight: '800', color: '#92400e' },
  title: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 6, textAlign: 'center' },
  refText: { fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' },
  detailBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
    gap: 6,
    marginTop: 8,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 10, color: '#94a3b8' },
  detailValue: { fontSize: 10, fontWeight: '700', color: '#1e293b', maxWidth: '65%', textAlign: 'right' },
  detailValueGreen: { fontSize: 10, fontWeight: '800', color: '#059669' },
  closeBtn: {
    backgroundColor: '#043DAE',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  closeBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});