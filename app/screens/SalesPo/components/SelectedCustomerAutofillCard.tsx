import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CustomerAutofillResult } from '../../../service/apiService';

interface Props {
  customer: CustomerAutofillResult;
  onChangeCustomer: () => void;
}

function ReadonlyField({ label, value }: { label: string; value?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        <Text style={styles.fieldValue} numberOfLines={1}>{value || '-'}</Text>
      </View>
    </View>
  );
}

export default function SelectedCustomerAutofillCard({ customer, onChangeCustomer }: Props) {
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.custCode}>{customer.idcust}</Text>
          <Text style={styles.custName} numberOfLines={1}>{customer.nama}</Text>
        </View>
        <Text style={styles.changeLink} onPress={onChangeCustomer}>Ganti</Text>
      </View>

      <ReadonlyField label="Alamat Pelanggan" value={customer.alamat} />

      <View style={styles.row}>
        <ReadonlyField label="Kelurahan" value={customer.kelurahan} />
        <ReadonlyField label="Kecamatan" value={customer.kecamatan} />
      </View>

      <ReadonlyField label="Provinsi" value={customer.provinsi} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  custCode: { fontSize: 9.5, fontWeight: '800', color: '#043DAE', fontFamily: 'monospace' },
  custName: { fontSize: 13, fontWeight: '900', color: '#0f172a', marginTop: 2 },
  changeLink: { fontSize: 10.5, fontWeight: '800', color: '#2563eb' },
  row: { flexDirection: 'row', gap: 8 },
  fieldLabel: { fontSize: 8.5, fontWeight: '700', color: '#64748b', marginBottom: 2 },
  fieldBox: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7 },
  fieldValue: { fontSize: 10.5, fontWeight: '700', color: '#334155' },
});