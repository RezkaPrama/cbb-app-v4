import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CustomerPiutangSearch } from '../../../service/apiService';
// ^ sesuaikan path import type dengan lokasi apiService.ts di project Anda

interface Props {
  query: string;
  onChangeQuery: (v: string) => void;
  loading: boolean;
  results: CustomerPiutangSearch[];
  onSelectCustomer: (c: CustomerPiutangSearch) => void;
}

export default function CustomerSearchBar({ query, onChangeQuery, loading, results, onSelectCustomer }: Props) {
  const showDropdown = query.trim().length >= 2;

  return (
    <View>
      <View style={styles.inputWrap}>
        <Ionicons name="search" size={16} color="#94a3b8" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Cari kode / nama pelanggan..."
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={onChangeQuery}
          autoCapitalize="characters"
        />
        {loading && <ActivityIndicator size="small" color="#043DAE" style={{ marginRight: 8 }} />}
        {!!query && !loading && (
          <TouchableOpacity onPress={() => onChangeQuery('')} style={{ paddingHorizontal: 6 }}>
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && (
        <View style={styles.dropdown}>
          {results.length === 0 && !loading ? (
            <Text style={styles.emptyText}>Pelanggan tidak ditemukan / tidak ada sisa piutang</Text>
          ) : (
            // Hasil dibatasi backend (max 20), jadi cukup .map() biasa —
            // TIDAK pakai FlatList di sini supaya tidak nested di dalam ScrollView milik screen.
            <ScrollView
              style={{ maxHeight: 220 }}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {results.map((item, idx) => (
                <TouchableOpacity
                  key={item.idcust}
                  style={[styles.resultRow, idx > 0 && styles.separator]}
                  onPress={() => onSelectCustomer(item)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName} numberOfLines={1}>{item.nama}</Text>
                    <Text style={styles.resultCode}>{item.idcust}{item.kecamatan ? ` • ${item.kecamatan}` : ''}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  inputIcon: { marginRight: 6 },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  emptyText: {
    padding: 12,
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  resultName: { fontWeight: '700', fontSize: 12, color: '#1e293b' },
  resultCode: { fontFamily: 'monospace', fontSize: 10, color: '#94a3b8', marginTop: 2 },
  separator: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
});