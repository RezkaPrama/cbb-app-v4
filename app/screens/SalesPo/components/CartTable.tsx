import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRupiah } from '../../Piutang/utils/formatRupiah';
import { CartItem } from '../SalesOrderFormScreen';

interface Props {
  items: CartItem[];
  onUpdateQty: (id_product: number, delta: number) => void;
  onRemove: (id_product: number) => void;
}

export default function CartTable({ items, onUpdateQty, onRemove }: Props) {
  const totalQtyPack = items.reduce((acc, i) => acc + i.qty, 0);
  const totalBruto = items.reduce((acc, i) => acc + i.subtotal, 0);

  return (
    <View style={styles.wrap}>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada artikel ditambahkan</Text>
      ) : (
        items.map((item) => (
          <View key={item.id_product} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
              <Text style={styles.itemMeta}>
                {item.barcode} • {formatRupiah(item.price_pack)}
                {item.available_pcs !== undefined && (
                  <Text style={styles.stockHint}>  (Tersedia {Math.floor(item.available_pcs / (item.quantity || 1))} pack)</Text>
                )}
              </Text>
            </View>

            <View style={styles.qtyControl}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => onUpdateQty(item.id_product, -1)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => onUpdateQty(item.id_product, 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtotal}>{formatRupiah(item.subtotal)}</Text>

            <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(item.id_product)}>
              <Ionicons name="trash" size={13} color="#fff" />
            </TouchableOpacity>
          </View>
        ))
      )}

      {items.length > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total: {totalQtyPack} Pack</Text>
          <Text style={styles.totalValue}>{formatRupiah(totalBruto)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 11, paddingVertical: 20 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  itemName: { fontSize: 11.5, fontWeight: '800', color: '#0f172a' },
  itemMeta: { fontSize: 9, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' },
  stockHint: { color: '#059669' },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 8, overflow: 'hidden', backgroundColor: '#f8fafc',
  },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#e2e8f0' },
  qtyBtnText: { fontWeight: '900', fontSize: 13, color: '#1e293b' },
  qtyValue: { paddingHorizontal: 8, fontWeight: '800', fontSize: 12, color: '#0f172a', minWidth: 24, textAlign: 'center' },
  subtotal: { fontSize: 11, fontWeight: '900', color: '#4338ca', fontFamily: 'monospace', minWidth: 70, textAlign: 'right' },
  removeBtn: { backgroundColor: '#f43f5e', padding: 6, borderRadius: 8 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f1f5f9',
    paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  totalLabel: { fontSize: 11, fontWeight: '800', color: '#334155' },
  totalValue: { fontSize: 11, fontWeight: '900', color: '#312e81', fontFamily: 'monospace' },
});