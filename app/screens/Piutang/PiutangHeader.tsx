import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  subtitle?: string;
  onBackPress: () => void;
  rightBadge?: string;
}

export default function PiutangHeader({ title, subtitle, onBackPress, rightBadge }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
      </View>

      {!!rightBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{rightBadge}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 7,
    borderRadius: 10,
  },
  title: { color: '#fff', fontWeight: '800', fontSize: 14 },
  subtitle: { color: '#bfdbfe', fontSize: 9.5, fontFamily: 'monospace', marginTop: 1 },
  badge: {
    backgroundColor: '#34d399',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 8,
  },
  badgeText: { color: '#022c22', fontSize: 8.5, fontWeight: '900', textTransform: 'uppercase' },
});