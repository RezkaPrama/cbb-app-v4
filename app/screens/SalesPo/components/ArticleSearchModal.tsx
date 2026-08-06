import React, { useEffect, useState } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity, FlatList,
    ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDebouncedValue } from '../../Piutang/hooks/useDebouncedValue';
import { formatRupiah } from '../../Piutang/utils/formatRupiah';
import apiService, { ArticleSearchResult } from '../../../service/apiService';

export interface PickedArticle {
    id_product: number;
    barcode: string | null;
    product_name: string;
    quantity: number;       // isi/pack
    price_pack: number;
    hpp_pcs: number;
    available_pcs: number;  // stok tersedia dalam PCS (fisik - reserved) saat dipilih
}

interface Props {
    visible: boolean;
    onClose: () => void;
    onPick: (article: PickedArticle) => void;
}

export default function ArticleSearchModal({ visible, onClose, onPick }: Props) {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebouncedValue(query, 300);
    const [results, setResults] = useState<ArticleSearchResult[]>([]);
    const [stockMap, setStockMap] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible) {
            setQuery('');
            setResults([]);
            setStockMap({});
        }
    }, [visible]);

    useEffect(() => {
        const q = debouncedQuery.trim();
        if (q.length < 3) {
            setResults([]);
            setStockMap({});
            return;
        }

        let cancelled = false;
        setLoading(true);

        apiService.searchArticles(q).then(async (res) => {
            if (cancelled) return;
            const products = (res.success && (res as any).products) || [];
            setResults(products);
            setLoading(false);

            // Ambil available_pcs (fisik - reserved) untuk tiap produk hasil pencarian —
            // ini yang manggil GET /sales-po/reserved/{productId} (method checkStock di
            // controller). Baru jalan di sini, setelah hasil pencarian artikel muncul,
            // bukan saat form pertama kali dibuka.
            const stockEntries = await Promise.all(
                products.map(async (p: ArticleSearchResult) => {
                    const stockRes = await apiService.checkStock(p.id);
                    const availablePcs = (stockRes.success && (stockRes as any).available_pcs) ?? 0;
                    return [p.id, availablePcs] as const;
                })
            );
            if (!cancelled) {
                setStockMap(Object.fromEntries(stockEntries));
            }
        });

        return () => { cancelled = true; };
    }, [debouncedQuery]);

    const handlePick = (item: ArticleSearchResult) => {
        const availablePcs = stockMap[item.id] ?? 0;
        if (availablePcs <= 0) return; // habis, tidak bisa dipilih

        const priceSell = parseFloat(String(item.price_sell).replace(/[^\d.-]/g, '')) || 0;

        onPick({
            id_product: item.id,
            barcode: item.barcode,
            product_name: item.name,
            quantity: item.quantity,
            price_pack: priceSell,
            hpp_pcs: 0, // TODO: isi dari field hpp produk kalau search-for-send sudah menyertakannya
            available_pcs: availablePcs,
        });
        onClose();
    };

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="search" size={16} color="#fff" />
                            <Text style={styles.headerTitle}>Cari Artikel</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Ketik nama artikel untuk mencari..."
                            placeholderTextColor="#94a3b8"
                            value={query}
                            onChangeText={setQuery}
                            autoFocus
                        />
                    </View>
                    <Text style={styles.hintText}>Minimal 3 karakter untuk mencari</Text>

                    {loading ? (
                        <ActivityIndicator color="#0091ff" style={{ marginVertical: 30 }} />
                    ) : (
                        <FlatList
                            data={results}
                            keyExtractor={(item) => String(item.id)}
                            style={{ maxHeight: 380 }}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>Ketikan nama artikel untuk mencari...</Text>
                            }
                            renderItem={({ item }) => {
                                const availablePcs = stockMap[item.id];
                                const isHabis = availablePcs !== undefined && availablePcs <= 0;
                                const availableDz = availablePcs !== undefined ? Math.floor(availablePcs / 24) : null;

                                return (
                                    <TouchableOpacity
                                        style={[styles.itemRow, isHabis && { opacity: 0.5 }]}
                                        onPress={() => handlePick(item)}
                                        disabled={isHabis}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.rowInline}>
                                                <View style={styles.barcodeBadge}>
                                                    <Text style={styles.barcodeBadgeText}>{item.barcode || '-'}</Text>
                                                </View>
                                                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                            </View>
                                            <Text style={styles.itemMeta}>🏷 {item.quantity} pcs/pack</Text>
                                        </View>

                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.itemPrice}>{formatRupiah(parseFloat(String(item.price_sell)) || 0)}</Text>
                                            {availableDz === null ? (
                                                <ActivityIndicator size="small" color="#94a3b8" />
                                            ) : isHabis ? (
                                                <View style={styles.stockBadgeHabis}>
                                                    <Text style={styles.stockBadgeText}>Habis</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.stockBadgeAda}>
                                                    <Text style={styles.stockBadgeText}>Stock: {availableDz} DZ</Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 14 },
    sheet: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', maxHeight: '85%' },
    header: {
        backgroundColor: '#0091ff', paddingHorizontal: 14, paddingVertical: 12,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
    closeBtn: { padding: 4 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', margin: 12, marginBottom: 4,
        backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 10,
    },
    searchInput: { flex: 1, paddingVertical: 9, fontSize: 12, fontWeight: '600', color: '#1e293b' },
    hintText: { fontSize: 9.5, color: '#94a3b8', marginLeft: 14, marginBottom: 6 },
    emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 11, paddingVertical: 30 },
    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    rowInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    barcodeBadge: { backgroundColor: '#e2e8f0', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
    barcodeBadgeText: { fontSize: 9, fontWeight: '700', color: '#475569', fontFamily: 'monospace' },
    itemName: { fontSize: 12, fontWeight: '800', color: '#0f172a', flexShrink: 1 },
    itemMeta: { fontSize: 9.5, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' },
    itemPrice: { fontSize: 12, fontWeight: '800', color: '#0091ff', fontFamily: 'monospace' },
    stockBadgeAda: { backgroundColor: '#f59e0b', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 },
    stockBadgeHabis: { backgroundColor: '#f43f5e', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 },
    stockBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', fontFamily: 'monospace' },
});