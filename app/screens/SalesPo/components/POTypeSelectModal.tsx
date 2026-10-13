import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type POType = 'REGULER' | 'DEADSTOCK' | 'GROSIR';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: POType) => void;
}

const OPTIONS: { type: POType; title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  {
    type: 'REGULER',
    title: 'PO Reguler',
    subtitle: 'Artikel reguler, harga sesuai master produk',
    icon: 'pricetag',
    color: '#043DAE',
  },
  {
    type: 'DEADSTOCK',
    title: 'PO Deadstock',
    subtitle: 'Khusus artikel deadstock, harga sesuai master produk',
    icon: 'archive',
    color: '#b45309',
  },
  {
    type: 'GROSIR',
    title: 'PO Grosir',
    subtitle: 'Reguler & deadstock, harga custom sesuai perjanjian',
    icon: 'pricetags',
    color: '#7c3aed',
  },
];

export default function POTypeSelectModal({ visible, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Buat PO Baru</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Pilih jenis PO yang akan dibuat</Text>

          <View style={{ gap: 10, marginTop: 12 }}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.type}
                style={styles.optionRow}
                onPress={() => onSelect(opt.type)}
                activeOpacity={0.75}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${opt.color}1A` }]}>
                  <Ionicons name={opt.icon} size={18} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{opt.title}</Text>
                  <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 14.5, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 10.5, color: '#64748b', marginTop: 3 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 12,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 12.5, fontWeight: '800', color: '#0f172a' },
  optionSubtitle: { fontSize: 9.5, color: '#64748b', marginTop: 2 },
});