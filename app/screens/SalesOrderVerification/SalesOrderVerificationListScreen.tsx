import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import {
  fetchVerificationList, fetchVerificationSummary, fetchVerificationTeam,
  approveOrder, cancelOrder, setSearch, setStatusFilter, SalesOrderStatusFilter,
} from '../../features/salesOrder/salesOrderVerificationSlice';
import apiService, { VerificationOrderItem, SalesOrderDetail } from '../../service/apiService';
// ^ sesuaikan path apiService dengan lokasi asli di project Anda
import { useAppDispatch, useAppSelector } from '../../redux/Store/store-hooks';
import { formatRupiah } from '../Piutang/utils/formatRupiah';
import { useDebouncedValue } from '../Piutang/hooks/useDebouncedValue';
import PiutangHeader from '../Piutang/PiutangHeader';
import CancelReasonModal from './components/CancelReasonModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTER_TABS: { id: SalesOrderStatusFilter; label: string }[] = [
  { id: 'PENDING', label: '⏳ Perlu Diverifikasi' },
  { id: 'VERIFIED_ASUP', label: '✓ Sudah ACC' },
  { id: 'CANCELLED', label: '✕ Dibatalkan' },
  { id: 'ALL', label: 'Semua' },
];

interface Props {
  navigation: StackNavigationProp<any>;
}

export default function SalesOrderVerificationListScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const {
    items, team, loading, loadingMore, refreshing, actionLoadingId,
    search, statusFilter, currentPage, lastPage, total,
  } = useAppSelector((s) => s.salesOrderVerification);

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailCache, setDetailCache] = useState<Record<number, SalesOrderDetail>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<VerificationOrderItem | null>(null);

  useEffect(() => {
    dispatch(setSearch(debouncedSearch));
  }, [debouncedSearch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchVerificationList({ page: 1 }));
      dispatch(fetchVerificationSummary());
      dispatch(fetchVerificationTeam());
    }, [search, statusFilter])
  );

  const onRefresh = () => {
    dispatch(fetchVerificationList({ page: 1, isRefresh: true }));
    dispatch(fetchVerificationSummary());
  };

  const onLoadMore = () => {
    if (!loadingMore && currentPage < lastPage) {
      dispatch(fetchVerificationList({ page: currentPage + 1, isLoadMore: true }));
    }
  };

  const toggleExpand = async (item: VerificationOrderItem) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);

    if (!detailCache[item.id]) {
      setDetailLoadingId(item.id);
      const res = await apiService.getVerificationDetail(item.id);
      setDetailLoadingId(null);
      if (res.success && res.data) {
        setDetailCache((prev) => ({ ...prev, [item.id]: res.data as SalesOrderDetail }));
      }
    }
  };

  const handleApprove = (item: VerificationOrderItem) => {
    dispatch(approveOrder(item.id));
  };

  const handleConfirmCancel = (reason: string) => {
    if (!cancelTarget) return;
    dispatch(cancelOrder({ id: cancelTarget.id, reason })).then(() => setCancelTarget(null));
  };

  // Buka layar edit produk. Setelah sukses, cache detail & badge total qty/nominal
  // di list di-refresh via onUpdated tanpa perlu fetch ulang dari server.
  const handleEditProducts = (item: VerificationOrderItem) => {
    navigation.navigate('SalesOrderVerificationEditScreen', {
      orderId: item.id,
      orderCode: item.code,
      onUpdated: (updatedDetail: SalesOrderDetail) => {
        setDetailCache((prev) => ({ ...prev, [item.id]: updatedDetail }));
        // Data ringkas di kartu list (netto_amount, total_qty_pack) juga perlu ikut
        // ter-update, jadi tarik ulang list dari server sekali supaya konsisten.
        dispatch(fetchVerificationList({ page: 1, isRefresh: true }));
      },
    });
  };

  const teamNames = team.map((m) => m.name).join(', ');

  const renderItem = ({ item }: { item: VerificationOrderItem }) => {
    const isExpanded = expandedId === item.id;
    const detail = detailCache[item.id];
    const isPending = item.status === 'PENDING';
    const isActing = actionLoadingId === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item)} activeOpacity={0.7}>
          <View style={styles.cardHeaderTop}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowInline}>
                <View style={styles.refBadge}>
                  <Text style={styles.refBadgeText}>{item.code}</Text>
                </View>
                <View style={styles.salesBadge}>
                  <Ionicons name="person" size={9} color="#7c3aed" />
                  <Text style={styles.salesBadgeText}>{item.sales_name}</Text>
                </View>
              </View>
              <Text style={styles.customerName} numberOfLines={1}>{item.cust_name}</Text>
              <Text style={styles.metaText}>
                {item.id_customer} • {item.date} ({item.j_trans})
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.statusBadge, statusBadgeStyle(item.status)]}>
                <Text style={[styles.statusBadgeText, statusTextStyle(item.status)]}>{item.status}</Text>
              </View>
              <Text style={styles.amountText}>{formatRupiah(Number(item.netto_amount) || 0)}</Text>
            </View>
          </View>

          <View style={styles.cardFooterRow}>
            <Text style={styles.footerText}>{item.total_qty_pack} Pack</Text>
            <View style={styles.rowInline}>
              <Text style={styles.footerLink}>{isExpanded ? 'Sembunyikan Detail' : 'Lihat Detail Artikel'}</Text>
              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} color="#2563eb" />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandBox}>
            {detailLoadingId === item.id && !detail ? (
              <ActivityIndicator color="#043DAE" style={{ marginVertical: 10 }} />
            ) : detail ? (
              <>
                {!!detail.note && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>💬 Catatan: "{detail.note}"</Text>
                  </View>
                )}
                <Text style={styles.rincianTitle}>RINCIAN ARTIKEL:</Text>
                {detail.details.map((d) => (
                  <View key={d.id} style={styles.allocRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.allocFaktur}>{d.product_name}</Text>
                      <Text style={styles.metaText}>{d.barcode} • {d.quantity_pack} pack</Text>
                    </View>
                    <Text style={styles.allocAmount}>{formatRupiah(Number(d.sub_total) || 0)}</Text>
                  </View>
                ))}

                {isPending && (
                  <>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleEditProducts(item)}
                      disabled={isActing}
                    >
                      <Ionicons name="create-outline" size={14} color="#043DAE" />
                      <Text style={styles.editBtnText}>Edit Produk</Text>
                    </TouchableOpacity>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => setCancelTarget(item)}
                        disabled={isActing}
                      >
                        <Ionicons name="close-circle-outline" size={14} color="#dc2626" />
                        <Text style={styles.rejectBtnText}>Batalkan</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprove(item)}
                        disabled={isActing}
                      >
                        {isActing ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={14} color="#fff" />
                            <Text style={styles.approveBtnText}>ACC PO Ini</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <SafeAreaView edges={['top']} style={styles.headerBlue}>
        <PiutangHeader
          title="Verifikasi Sales PO"
          subtitle="PO Tim Anda & Diri Sendiri"
          onBackPress={() => navigation.goBack()}
          rightBadge="ASUP"
        />

        <View style={styles.summaryHeader}>
          {!!teamNames && (
            <Text style={styles.teamText} numberOfLines={1}>👥 Tim: {teamNames}</Text>
          )}
          <View style={styles.rowBetween}>
            <Text style={styles.summarySubText}>Total PO Tim:</Text>
            <Text style={styles.summarySubTextBold}>{total} Order</Text>
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

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari No. PO, Toko, atau Kode Pelanggan..."
          placeholderTextColor="#94a3b8"
          value={searchInput}
          onChangeText={setSearchInput}
        />
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#043DAE" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 14, paddingBottom: 30, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#043DAE']} />}
          onEndReachedThreshold={0.4}
          onEndReached={onLoadMore}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 12 }} color="#043DAE" /> : null}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="checkmark-done-circle-outline" size={32} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>Tidak Ada PO di Kategori Ini</Text>
              <Text style={styles.emptySubtitle}>PO dari Anda & tim akan muncul di sini sesuai filter status.</Text>
            </View>
          }
        />
      )}

      <CancelReasonModal
        visible={!!cancelTarget}
        poCode={cancelTarget?.code || ''}
        submitting={actionLoadingId === cancelTarget?.id}
        onClose={() => setCancelTarget(null)}
        onSubmit={handleConfirmCancel}
      />
    </SafeAreaView>
  );
}

function statusBadgeStyle(status: string) {
  if (status === 'VERIFIED_ASUP' || status === 'PROCESSED') return styles.statusVerified;
  if (status === 'CANCELLED' || status === 'EXPIRED') return styles.statusRejected;
  return styles.statusPending;
}
function statusTextStyle(status: string) {
  if (status === 'VERIFIED_ASUP' || status === 'PROCESSED') return styles.statusVerifiedText;
  if (status === 'CANCELLED' || status === 'EXPIRED') return styles.statusRejectedText;
  return styles.statusPendingText;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f9fd' },
  headerBlue: { backgroundColor: '#043DAE' },
  summaryHeader: { paddingHorizontal: 14, paddingBottom: 14, gap: 6 },
  teamText: { fontSize: 9.5, color: '#c7d2fe', fontFamily: 'monospace' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summarySubText: { fontSize: 10, color: '#bfdbfe', fontFamily: 'monospace' },
  summarySubTextBold: { fontSize: 10, color: '#fff', fontWeight: '700', fontFamily: 'monospace' },
  filterRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
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
  rowInline: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  refBadge: { backgroundColor: '#dbeafe', borderRadius: 4, paddingHorizontal: 5, alignSelf: 'flex-start' },
  refBadgeText: { fontSize: 9, fontWeight: '800', color: '#043DAE', fontFamily: 'monospace' },
  salesBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#ede9fe', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
  },
  salesBadgeText: { fontSize: 9, fontWeight: '800', color: '#7c3aed' },
  customerName: { fontSize: 12, fontWeight: '800', color: '#0f172a', marginTop: 3 },
  metaText: { fontSize: 9.5, color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4 },
  statusVerified: { backgroundColor: '#d1fae5' },
  statusPending: { backgroundColor: '#fef3c7' },
  statusRejected: { backgroundColor: '#fee2e2' },
  statusBadgeText: { fontSize: 8.5, fontWeight: '800' },
  statusVerifiedText: { color: '#065f46' },
  statusPendingText: { color: '#92400e' },
  statusRejectedText: { color: '#991b1b' },
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
  allocFaktur: { fontSize: 11, fontWeight: '800', color: '#1e293b' },
  allocAmount: { fontSize: 10, fontWeight: '800', color: '#1d4ed8', fontFamily: 'monospace' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 1, borderColor: '#bfdbfe', backgroundColor: '#eff6ff',
    borderRadius: 10, paddingVertical: 9, marginTop: 4,
  },
  editBtnText: { color: '#043DAE', fontWeight: '800', fontSize: 10.5 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2',
    borderRadius: 10, paddingVertical: 9,
  },
  rejectBtnText: { color: '#dc2626', fontWeight: '800', fontSize: 10.5 },
  approveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#059669', borderRadius: 10, paddingVertical: 9,
  },
  approveBtnText: { color: '#fff', fontWeight: '800', fontSize: 10.5 },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 6, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  emptySubtitle: { fontSize: 10, color: '#94a3b8', textAlign: 'center' },
});