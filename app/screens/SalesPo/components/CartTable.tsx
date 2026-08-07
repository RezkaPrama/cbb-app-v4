import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRupiah } from '../../Piutang/utils/formatRupiah';
import { CartItem } from '../SalesOrderFormScreen';

interface Props {
  items: CartItem[];
  onUpdateQty: (id_product: number, delta: number) => void;
  onRemove: (id_product: number) => void;
  flashProductId?: number | null;
}

export default function CartTable({ items, onUpdateQty, onRemove, flashProductId }: Props) {
  const totalQtyPack = items.reduce((acc, i) => acc + i.qty, 0);
  const totalBruto = items.reduce((acc, i) => acc + i.subtotal, 0);

  return (
    <View style={styles.wrap}>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada artikel ditambahkan</Text>
      ) : (
        items.map((item) => (
          <CartRow
            key={item.id_product}
            item={item}
            onUpdateQty={onUpdateQty}
            onRemove={onRemove}
            flash={flashProductId === item.id_product}
          />
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

interface CartRowProps {
  item: CartItem;
  onUpdateQty: (id_product: number, delta: number) => void;
  onRemove: (id_product: number) => void;
  flash: boolean;
}

// Baris terpisah biar tiap artikel punya animasi sendiri-sendiri:
// - Masuk (fade + scale) sekali saat pertama kali muncul di keranjang
// - Kilat hijau sekilas (flash) tiap kali artikel yang sama dipilih ulang / qty berubah
//
// PENTING: dipisah jadi 2 lapis Animated.View. opacity/scale pakai useNativeDriver:true,
// backgroundColor HARUS useNativeDriver:false (warna tidak didukung native driver).
// Kalau digabung di satu Animated.View yang sama, RN akan error:
// "Attempting to run JS driven animation on animated node that has been moved to native".
function CartRow({ item, onUpdateQty, onRemove, flash }: CartRowProps) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;

  // Animasi masuk (native driver) — lapis luar
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  // Kilat hijau (JS driver, karena backgroundColor) — lapis dalam
  useEffect(() => {
    if (!flash) return;
    highlightAnim.setValue(1);
    Animated.timing(highlightAnim, {
      toValue: 0,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [flash]);

  const backgroundColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', '#d1fae5'],
  });

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
      <Animated.View style={[styles.row, { backgroundColor }]}>
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
      </Animated.View>
    </Animated.View>
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