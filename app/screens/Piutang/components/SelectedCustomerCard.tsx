import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRupiah } from '../utils/formatRupiah';
import type { CustomerPiutangSearch } from '../../../service/apiService';

interface Props {
  customer: CustomerPiutangSearch;
  totalSisaPiutang: number;
  jumlahFaktur: number;
  onChangeCustomer: () => void;
}

export default function SelectedCustomerCard({ customer, totalSisaPiutang, jumlahFaktur, onChangeCustomer }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{customer.idcust}</Text>
            </View>
          </View>
          <Text style={styles.name} numberOfLines={2}>{customer.nama}</Text>
          {!!customer.alamat && <Text style={styles.address} numberOfLines={1}>{customer.alamat}</Text>}
        </View>

        <View style={styles.right}>
          <Text style={styles.sisaLabel}>Sisa Piutang</Text>
          <Text style={styles.sisaValue}>{formatRupiah(totalSisaPiutang)}</Text>
          <Text style={styles.fakturCount}>{jumlahFaktur} Faktur</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.changeBtn} onPress={onChangeCustomer}>
        <Ionicons name="swap-horizontal" size={13} color="#043DAE" />
        <Text style={styles.changeBtnText}>Ganti Pelanggan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badgeRow: { flexDirection: 'row', marginBottom: 3 },
  codeBadge: {
    backgroundColor: '#043DAE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  codeBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', fontFamily: 'monospace' },
  name: { fontWeight: '800', fontSize: 13, color: '#0f172a' },
  address: { fontSize: 10, color: '#64748b', marginTop: 2 },
  right: { alignItems: 'flex-end', marginLeft: 8 },
  sisaLabel: { fontSize: 9, fontWeight: '700', color: '#64748b' },
  sisaValue: { fontSize: 13, fontWeight: '800', color: '#dc2626', fontFamily: 'monospace' },
  fakturCount: { fontSize: 9, fontWeight: '700', color: '#043DAE', marginTop: 1 },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  changeBtnText: { color: '#043DAE', fontSize: 10, fontWeight: '700' },
});