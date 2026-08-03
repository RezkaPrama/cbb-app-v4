import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets  } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { fetchMyPayments, setSearch, setStatusFilter, StatusFilter } from '../../features/piutang/piutangSlice';
import { formatRupiah } from './utils/formatRupiah';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import type { MyPaymentItem } from '../../service/apiService';
// ^ sesuaikan path apiService dengan lokasi asli di project Anda
import { useAppDispatch, useAppSelector } from '../../redux/Store/store-hooks';
// ^ path ini berlaku kalau struktur folder: screens/Piutang/PiutangListScreen.tsx dan redux/Store/store-hooks.ts
import PiutangHeader from './PiutangHeader';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTER_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'ALL', label: 'Semua Status' },
  { id: 'BELUM POSTING', label: '⏳ Belum Posting' },
  { id: 'Verified', label: '✓ Verified' },
];

interface Props {
  navigation: StackNavigationProp<any>;
}

export default function PiutangListScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const {
    items, loading, loadingMore, refreshing, error,
    search, statusFilter, currentPage, lastPage, total,
  } = useAppSelector((s) => s.piutang);

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(setSearch(debouncedSearch));
  }, [debouncedSearch]);

  // Refetch setiap kali search/filter berubah, atau screen kembali fokus (setelah submit form)
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMyPayments({ page: 1 }));
    }, [search, statusFilter])
  );

  const onRefresh = () => dispatch(fetchMyPayments({ page: 1, isRefresh: true }));

  const onLoadMore = () => {
    if (!loadingMore && currentPage < lastPage) {
      dispatch(fetchMyPayments({ page: currentPage + 1, isLoadMore: true }));
    }
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const totalCollected = items.reduce((acc, cur) => acc + cur.total, 0);

  const renderItem = ({ item }: { item: MyPaymentItem }) => {
    const isExpanded = expandedId === item.no_bayar;
    const isVerified = item.status_posting === 'Verified' || item.status_posting === 'Posted';

    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item.no_bayar)} activeOpacity={0.7}>
          <View style={styles.cardHeaderTop}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowInline}>
                <View style={styles.refBadge}>
                  <Text style={styles.refBadgeText}>{item.no_bayar}</Text>
                </View>
              </View>
              <Text style={styles.customerName} numberOfLines={1}>{item.nama_customer}</Text>
              <Text style={styles.metaText}>
                {item.idcust} • {item.tgl_bayar} ({item.jenis_pembayaran})
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.statusBadge, isVerified ? styles.statusVerified : styles.statusPending]}>
                <Text style={[styles.statusBadgeText, isVerified ? styles.statusVerifiedText : styles.statusPendingText]}>
                  {item.status_posting}
                </Text>
              </View>
              <Text style={styles.amountText}>{formatRupiah(item.total)}</Text>
            </View>
          </View>

          <View style={styles.cardFooterRow}>
            <Text style={styles.footerText}>Alokasi: {item.jumlah_faktur} Faktur</Text>
            <View style={styles.rowInline}>
              <Text style={styles.footerLink}>{isExpanded ? 'Sembunyikan Detail' : 'Lihat Detail Faktur'}</Text>
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} color="#2563eb" />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandBox}>
            {!!item.keterangan && (
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>💬 Ket: "{item.keterangan}"</Text>
              </View>
            )}
            <Text style={styles.rincianTitle}>RINCIAN POTONG FAKTUR:</Text>
            {item.allocations.map((alloc, idx) => (
              <View key={idx} style={styles.allocRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.allocFaktur}>{alloc.no_faktur}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.allocAmount}>{formatRupiah(alloc.jumlah_bayar)}</Text>
                  <View style={[styles.miniBadge, alloc.status_faktur === 'LUNAS' ? styles.statusVerified : styles.statusPending]}>
                    <Text style={styles.miniBadgeText}>{alloc.status_faktur}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {/* Header + Summary (SafeAreaView top: status bar ikut kecat biru) */}
      <SafeAreaView edges={['top']} style={styles.headerBlue}>
        <PiutangHeader
          title="Pembayaran Piutang"
          subtitle="Riwayat Collection Sales Mobile"
          onBackPress={() => navigation.goBack()}
          rightBadge="Mobile API"
        />

        <View style={styles.summaryHeader}>
          <View style={styles.rowBetween}>
            <Text style={styles.summarySubText}>Total Ter-input (Sales):</Text>
            <Text style={styles.summarySubTextBold}>{total} Transaksi</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.summaryLabel}>Total Nominal Collection</Text>
            <Text style={styles.summaryValue}>{formatRupiah(totalCollected)}</Text>
          </View>

          <View style={styles.filterRow}>
            {FILTER_TABS.map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => dispatch(setStatusFilter(tab.id))}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari Ref, Toko, atau Kode Pelanggan..."
          placeholderTextColor="#94a3b8"
          value={searchInput}
          onChangeText={setSearchInput}
        />
      </View>

      {/* List */}
      {loading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#043DAE" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.no_bayar}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, paddingBottom: 90, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#043DAE']} />}
          onEndReachedThreshold={0.4}
          onEndReached={onLoadMore}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} color="#043DAE" /> : null}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="wallet-outline" size={32} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Belum Ada Input Pembayaran</Text>
              <Text style={styles.emptySubtitle}>Ketuk tombol (+) di bawah untuk menambah input pembayaran piutang.</Text>
            </View>
          }
        />
      )}

      {/* FAB — posisi absolute di dalam SafeAreaView(bottom) otomatis aman dari nav bar */}
      
      <TouchableOpacity
        style={[styles.fab, { bottom: 16 + insets.bottom }]}
        onPress={() => navigation.navigate('PiutangFormScreen')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.fabText}>Tambah Pembayaran</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f9fd' },
  headerBlue: { backgroundColor: '#043DAE' },
  summaryHeader: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 6,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summarySubText: { fontSize: 10, color: '#bfdbfe', fontFamily: 'monospace' },
  summarySubTextBold: { fontSize: 10, color: '#fff', fontWeight: '700', fontFamily: 'monospace' },
  summaryLabel: { fontSize: 12, color: '#dbeafe', fontWeight: '600' },
  summaryValue: { fontSize: 16, color: '#6ee7b7', fontWeight: '900', fontFamily: 'monospace' },
  filterRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  filterPill: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  filterPillActive: { backgroundColor: '#fff' },
  filterPillText: { fontSize: 9.5, fontWeight: '800', color: '#dbeafe' },
  filterPillTextActive: { color: '#043DAE' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 14, marginBottom: 0,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 10,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 12, fontWeight: '600', color: '#1e293b' },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  cardHeader: { padding: 12, gap: 6 },
  cardHeaderTop: { flexDirection: 'row', justifyContent: 'space-between' },
  rowInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  refBadge: { backgroundColor: '#dbeafe', borderRadius: 4, paddingHorizontal: 5, alignSelf: 'flex-start' },
  refBadgeText: { fontSize: 9, fontWeight: '800', color: '#043DAE', fontFamily: 'monospace' },
  customerName: { fontSize: 12, fontWeight: '800', color: '#0f172a', marginTop: 3 },
  metaText: { fontSize: 9.5, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4 },
  statusVerified: { backgroundColor: '#d1fae5' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusBadgeText: { fontSize: 8.5, fontWeight: '800' },
  statusVerifiedText: { color: '#065f46' },
  statusPendingText: { color: '#92400e' },
  amountText: { fontSize: 12, fontWeight: '800', color: '#059669', fontFamily: 'monospace' },
  cardFooterRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  footerText: { fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' },
  footerLink: { fontSize: 9, fontWeight: '700', color: '#2563eb' },
  expandBox: { backgroundColor: '#f8fafc', padding: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 8 },
  noteBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 8 },
  noteText: { fontSize: 9.5, color: '#475569', fontStyle: 'italic' },
  rincianTitle: { fontSize: 9, fontWeight: '800', color: '#334155', letterSpacing: 0.4 },
  allocRow: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  allocFaktur: { fontSize: 11, fontWeight: '800', color: '#1e293b', fontFamily: 'monospace' },
  allocAmount: { fontSize: 10, fontWeight: '800', color: '#1d4ed8', fontFamily: 'monospace' },
  miniBadge: { borderRadius: 6, paddingHorizontal: 5, marginTop: 2 },
  miniBadgeText: { fontSize: 8, fontWeight: '800' },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 6, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  emptySubtitle: { fontSize: 10, color: '#94a3b8', textAlign: 'center' },
  fab: {
    position: 'absolute', right: 16, bottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#043DAE', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 13,
    elevation: 6, shadowColor: '#043DAE', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});