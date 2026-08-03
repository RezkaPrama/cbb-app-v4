// TrackingHistoryScreen.tsx
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ScrollView,
    TextInput,
    Platform,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import LeafletMapView from '../Absen/LeafletMapView';
import { fetchVisitHistoryByDate, VisitHistoryItem } from '../../redux/Store/storeVisitApi';
import { getDataLara } from '../../utils/asyncStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOffsetDateString = (offsetDays: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
};

/**
 * Backend mengirim timestamp_checkin/timestamp_checkout sebagai string ISO
 * berakhiran "Z" (contoh: "2026-06-17T14:18:57.000000Z"), tapi nilai jam
 * tersebut SUDAH waktu Jakarta — bukan UTC asli. Ini karena saat
 * check-in/checkout, device mengirim waktu lewat
 * moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss') (lihat
 * handleAbsen di Checkin.tsx dan handleCheckout di Checkout.tsx), yaitu
 * string TANPA info zona waktu sama sekali, lalu Laravel (timezone app
 * kemungkinan masih default 'UTC') cuma menempelkan label "Z" tanpa
 * benar-benar mengonversi nilainya.
 *
 * Karena itu di sini SENGAJA tidak dipakai new Date()/toLocaleTimeString
 * atau moment().tz() untuk konversi — itu justru akan menggeser jamnya
 * (+7 jam lagi, dobel). Cukup ambil digit HH:mm dari string mentahnya.
 *
 * Kalau suatu saat backend benar-benar diperbaiki untuk mengirim UTC asli
 * (bukan mislabel), ganti isi fungsi ini jadi:
 *   return moment.utc(isoString).tz('Asia/Jakarta').format('HH:mm');
 */
const formatJakartaTime = (isoString: string | null | undefined): string => {
    if (!isoString) return '--';
    const match = isoString.match(/T(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : '--';
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrackingHistoryScreen() {
    const navigation = useNavigation();

    // ── Data user dari Redux (hanya untuk nama tampilan) ──────────────────────
    const fullName = useSelector((state: any) => state.auth.user?.name);

    // ── State lokal ───────────────────────────────────────────────────────────
    const [userId, setUserId] = useState<string | null>(null);
    const [trackingDate, setTrackingDate] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [phoneSelectedVisitId, setPhoneSelectedVisitId] = useState<number | null>(null);
    const [visits, setVisits] = useState<VisitHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper format Date → 'YYYY-MM-DD' untuk API
    const formatDateForApi = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    // Helper format Date → tampilan UI
    const formatDateDisplay = (date: Date): string => {
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    // ── Fade-in animation ─────────────────────────────────────────────────────
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, []);

    // ── Ambil userId dari AsyncStorage saat mount ─────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const detail = await getDataLara<any>('dataDetailUser');

                if (detail?.id) {
                    setUserId(String(detail.id));
                }
            } catch {
                // biarkan null, tampilkan '-'
            }
        })();
    }, []);

    // Tambahkan sementara untuk debug
    useEffect(() => {
        (async () => {
            // Cek via getDataLara (yang berhasil)
            const viaHelper = await getDataLara<string>('tokenUser');
            // console.log('via getDataLara:', viaHelper);

            // Cek raw AsyncStorage (yang dipakai apiService)
            const viaRaw = await AsyncStorage.getItem('tokenUser');
            // console.log('via AsyncStorage raw:', viaRaw);
            // console.log('raw type:', typeof viaRaw);
        })();
    }, []);

    // ── Fetch data dari API ───────────────────────────────────────────────────
    const loadVisits = useCallback(async (date: string, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const data = await fetchVisitHistoryByDate(date);
            console.log(data);

            setVisits(data);
        } catch (err: any) {
            setError(err.message || 'Gagal memuat data');
            setVisits([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Fetch saat tanggal berubah
    useEffect(() => {
        setPhoneSelectedVisitId(null);
        loadVisits(formatDateForApi(trackingDate));
    }, [trackingDate, loadVisits]);

    // ── Sort kunjungan (sudah difilter server, tinggal sort client) ───────────
    const phoneVisits = useMemo(() => {
        const apiDate = formatDateForApi(trackingDate); // '2026-06-17'
        return [...visits]
            .filter((v) => {
                // date dari API: "2026-06-17T00:00:00.000000Z"
                // ambil hanya bagian tanggalnya
                const visitDate = v.date?.split('T')[0];
                return visitDate === apiDate;
            })
            .sort((a, b) => {
                // timestamp_checkin: "2026-06-17T14:18:57.000000Z" atau null
                const ta = a.timestamp_checkin ?? '';
                const tb = b.timestamp_checkin ?? '';
                return ta.localeCompare(tb);
            });
    }, [visits, trackingDate]);

    const totalStops = phoneVisits.length;
    const checkoutCount = phoneVisits.filter((v) => v.timestamp_checkout).length;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>

            {/* ── Header ───────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        activeOpacity={0.7}
                    >
                        <FeatherIcon name="chevron-left" size={16} color="#64748b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Histori GPS Tracking</Text>
                </View>
                <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>Grup Sales</Text>
                </View>
            </View>

            {/* ── Scrollable Content ────────────────────────────────────────── */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadVisits(formatDateForApi(trackingDate), true)}
                        tintColor="#2563eb"
                    />
                }
            >
                {/* User Info Card */}
                <View style={styles.userCard}>
                    <View style={styles.userCardWatermark}>
                        <FeatherIcon name="map" size={80} color="#fff" />
                    </View>
                    <View style={styles.userCardInner}>
                        <View style={styles.pulseRow}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.userIdText}>
                                Salesman ID: {userId ?? '-'}
                            </Text>
                        </View>
                        <Text style={styles.fullName}>{fullName ?? '-'}</Text>
                        {/* Ganti TextInput tanggal dengan ini */}
                        <Text style={styles.filterLabel}>Filter Tanggal:</Text>
                        <TouchableOpacity
                            style={styles.dateBtn}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.8}
                        >
                            <FeatherIcon name="calendar" size={12} color="#38bdf8" />
                            <Text style={styles.dateBtnText}>
                                {formatDateDisplay(trackingDate)}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={trackingDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                                maximumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(Platform.OS === 'ios'); // iOS tetap terbuka
                                    if (event.type === 'set' && selectedDate) {
                                        setTrackingDate(selectedDate);
                                        setPhoneSelectedVisitId(null);
                                    }
                                }}
                            />
                        )}
                    </View>
                </View>

                {/* Section Header Map */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        Rute Map Leaflet ({loading ? '…' : totalStops})
                    </Text>
                    <Text style={styles.checkoutCount}>
                        {loading ? '-/-' : `${checkoutCount}/${totalStops} Checkout`}
                    </Text>
                </View>

                {/* Leaflet Map (via WebView) */}
                <View style={styles.mapContainer}>
                    <LeafletMapView
                        locations={phoneVisits}
                        selectedLocationId={phoneSelectedVisitId}
                        onSelectLocation={(id) => setPhoneSelectedVisitId(id)}
                        theme="light"
                    />
                </View>

                {/* Loading / Error / Visit List */}
                {loading ? (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="small" color="#2563eb" />
                        <Text style={[styles.emptySubtitle, { marginTop: 8 }]}>
                            Memuat data kunjungan…
                        </Text>
                    </View>
                ) : error ? (
                    <View style={styles.emptyState}>
                        <FeatherIcon name="alert-circle" size={32} color="#fca5a5" style={{ marginBottom: 8 }} />
                        <Text style={[styles.emptyTitle, { color: '#ef4444' }]}>Gagal Memuat</Text>
                        <Text style={styles.emptySubtitle}>{error}</Text>
                        <TouchableOpacity
                            onPress={() => loadVisits(formatDateForApi(trackingDate))}
                            style={styles.retryBtn}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retryText}>Coba Lagi</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.visitList}>
                        {phoneVisits.length === 0 ? (
                            <View style={styles.emptyState}>
                                <FeatherIcon
                                    name="map"
                                    size={32}
                                    color="#cbd5e1"
                                    style={{ marginBottom: 8 }}
                                />
                                <Text style={styles.emptyTitle}>Hari Tanpa Kunjungan</Text>
                                <Text style={styles.emptySubtitle}>
                                    Data GPS/check-in kosong untuk tanggal ini.
                                </Text>
                            </View>
                        ) : (
                            phoneVisits.map((v, i) => {
                                const isSelected = phoneSelectedVisitId === v.id;
                                return (
                                    <TouchableOpacity
                                        key={v.id}
                                        onPress={() => setPhoneSelectedVisitId(v.id)}
                                        activeOpacity={0.8}
                                        style={[
                                            styles.visitCard,
                                            isSelected && styles.visitCardSelected,
                                        ]}
                                    >
                                        <View style={styles.visitRow}>
                                            <View style={styles.visitIndex}>
                                                <Text style={styles.visitIndexText}>{i + 1}</Text>
                                            </View>

                                            <View style={styles.visitInfo}>
                                                <View style={styles.visitTopRow}>
                                                    <Text
                                                        style={styles.visitStoreName}
                                                        numberOfLines={1}
                                                    >
                                                        {v.name_store}
                                                    </Text>
                                                    <Text style={styles.visitTime}>
                                                        {formatJakartaTime(v.timestamp_checkin)}
                                                    </Text>
                                                </View>

                                                <Text style={styles.visitAddress} numberOfLines={1}>
                                                    {v.address_store}
                                                </Text>

                                                <View style={styles.visitFooter}>
                                                    <View
                                                        style={[
                                                            styles.statusBadge,
                                                            v.timestamp_checkout
                                                                ? styles.statusClosed
                                                                : styles.statusActive,
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.statusText,
                                                                v.timestamp_checkout
                                                                    ? styles.statusTextClosed
                                                                    : styles.statusTextActive,
                                                            ]}
                                                        >
                                                            {v.timestamp_checkout ? 'Closed' : 'Active'}
                                                        </Text>
                                                    </View>

                                                    {v.timestamp_checkout && (
                                                        <Text style={styles.visitCheckoutTime}>
                                                            Checkout {formatJakartaTime(v.timestamp_checkout)}
                                                        </Text>
                                                    )}

                                                    {v.result ? (
                                                        <Text style={styles.visitResult} numberOfLines={1}>
                                                            Result: "{v.result}"
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                )}
            </ScrollView>
        </Animated.View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // (semua styles sama persis dengan versi sebelumnya)
    wrapper: { flex: 1, backgroundColor: '#fbfbfd' },
    header: { backgroundColor: '#5872a8', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    backBtn: { backgroundColor: '#f8fafc', padding: 6, borderRadius: 8 },
    headerTitle: { fontWeight: '800', fontSize: 14, color: '#0f172a' },
    headerBadge: { backgroundColor: '#dbeafe', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
    headerBadgeText: { color: '#1d4ed8', fontSize: 10, fontWeight: '800' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, gap: 12, paddingBottom: 24 },
    userCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 14, overflow: 'hidden', position: 'relative' },
    userCardWatermark: { position: 'absolute', right: -10, bottom: -10, opacity: 0.1 },
    userCardInner: { zIndex: 1 },
    pulseRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34d399' },
    userIdText: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    fullName: { fontWeight: '800', fontSize: 14, color: '#fff', marginBottom: 4 },
    filterLabel: { fontSize: 10, color: '#64748b', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 6 },
    dateInput: { backgroundColor: '#020617', color: '#f1f5f9', fontSize: 12, fontWeight: '700', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#334155', textTransform: 'uppercase' },
    checkoutCount: { fontSize: 9, fontWeight: '700', color: '#64748b' },
    mapContainer: { height: 170, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#0f172a' },
    visitList: { gap: 8 },
    emptyState: { paddingVertical: 32, alignItems: 'center' },
    emptyTitle: { fontWeight: '700', fontSize: 12, color: '#94a3b8', marginBottom: 4 },
    emptySubtitle: { fontSize: 10, color: '#cbd5e1', textAlign: 'center' },
    retryBtn: { marginTop: 12, backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe' },
    retryText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
    visitCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 12, padding: 12 },
    visitCardSelected: { backgroundColor: '#eff6ff', borderColor: '#60a5fa' },
    visitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    visitIndex: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    visitIndexText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    visitInfo: { flex: 1 },
    visitTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    visitStoreName: { fontWeight: '700', fontSize: 12, color: '#1e293b', flex: 1, marginRight: 6 },
    visitTime: { fontSize: 9, color: '#94a3b8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    visitAddress: { fontSize: 9, color: '#94a3b8', marginBottom: 6 },
    visitFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
    statusClosed: { backgroundColor: '#d1fae5' },
    statusActive: { backgroundColor: '#fef3c7' },
    statusText: { fontSize: 8, fontWeight: '800' },
    statusTextClosed: { color: '#065f46' },
    statusTextActive: { color: '#92400e' },
    visitCheckoutTime: { fontSize: 9, color: '#64748b', fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    visitResult: { fontSize: 9, color: '#64748b', fontStyle: 'italic', flex: 1 },
    dateBtn: {
        backgroundColor: '#020617',
        borderWidth: 1,
        borderColor: '#1e293b',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateBtnText: {
        color: '#f1f5f9',
        fontSize: 12,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        flex: 1,
    },
});