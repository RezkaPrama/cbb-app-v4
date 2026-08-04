import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomerSearchResult } from '../../../service/apiService';

interface Props {
  query: string;
  onChangeQuery: (v: string) => void;
  loading: boolean;
  results: CustomerSearchResult[];
  onSelectCustomer: (c: CustomerSearchResult) => void;
}

export default function CustomerSearchBar({ query, onChangeQuery, loading, results, onSelectCustomer }: Props) {
  return (
    <View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama atau kode pelanggan..."
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={onChangeQuery}
        />
        {loading && <ActivityIndicator size="small" color="#043DAE" />}
      </View>

      {results.length > 0 && (
        <View style={styles.resultsBox}>
          {results.map((c) => (
            <TouchableOpacity key={c.idcust} style={styles.resultRow} onPress={() => onSelectCustomer(c)}>
              <Text style={styles.resultCode}>{c.idcust}</Text>
              <Text style={styles.resultName} numberOfLines={1}>{c.nama}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 10,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 12, fontWeight: '600', color: '#1e293b' },
  resultsBox: {
    marginTop: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    overflow: 'hidden', backgroundColor: '#fff', maxHeight: 220,
  },
  resultRow: {
    paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#f1f5f9',
    flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  resultCode: { fontSize: 9.5, fontWeight: '800', color: '#043DAE', fontFamily: 'monospace' },
  resultName: { fontSize: 11.5, fontWeight: '700', color: '#1e293b', flexShrink: 1 },
});