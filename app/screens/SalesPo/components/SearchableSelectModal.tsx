import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDebouncedValue } from '../../Piutang/hooks/useDebouncedValue';
// ^ sesuaikan path hook dengan lokasi asli di project Anda

export interface SelectOption {
    value: string;
    label: string;
}

interface Props {
    visible: boolean;
    title: string;
    options?: SelectOption[];                              // mode filter lokal
    onSearch?: (query: string) => Promise<SelectOption[]>; // mode cari ke server
    onSelect: (option: SelectOption) => void;
    onClose: () => void;
    searchPlaceholder?: string;
}

export default function SearchableSelectModal({
    visible, title, options, onSearch, onSelect, onClose, searchPlaceholder = 'Cari...',
}: Props) {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebouncedValue(query, 350);
    const [serverResults, setServerResults] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible) { setQuery(''); setServerResults([]); }
    }, [visible]);

    useEffect(() => {
        if (!onSearch) return;
        const q = debouncedQuery.trim();
        if (q.length < 2) { setServerResults([]); return; }
        let cancelled = false;
        setLoading(true);
        onSearch(q).then((res) => {
            if (cancelled) return;
            setLoading(false);
            setServerResults(res);
        });
        return () => { cancelled = true; };
    }, [debouncedQuery, onSearch]);

    const filteredOptions = useMemo(() => {
        if (onSearch) return serverResults;
        if (!options) return [];
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
    }, [options, query, serverResults, onSearch]);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={20} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={searchPlaceholder}
                            placeholderTextColor="#94a3b8"
                            value={query}
                            onChangeText={setQuery}
                            autoFocus
                        />
                        {loading && <ActivityIndicator size="small" color="#043DAE" />}
                    </View>

                    <FlatList
                        data={filteredOptions}
                        keyExtractor={(item) => item.value}
                        style={{ maxHeight: 360 }}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() => { onSelect(item); onClose(); }}
                            >
                                <Text style={styles.itemText}>{item.label}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            !loading ? (
                                <Text style={styles.emptyText}>
                                    {onSearch && query.trim().length < 2
                                        ? 'Ketik minimal 2 huruf untuk mencari...'
                                        : 'Tidak ada hasil.'}
                                </Text>
                            ) : null
                        }
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    title: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', margin: 14, marginBottom: 6,
        backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 10,
    },
    searchInput: { flex: 1, paddingVertical: 9, fontSize: 12, fontWeight: '600', color: '#1e293b' },
    item: { paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
    itemText: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
    emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 11, paddingVertical: 24 },
});