import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { getDataLara } from "../../utils/asyncStorage";
import HeaderStyle from "../../components/Header/HeaderStyle";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import axios, { AxiosError } from 'axios';

// Types
interface Position {
  latitude: number;
  longitude: number;
}

interface UserDetails {
  id: number;
  name: string;
  username?: string;
  email?: string;
}

interface CheckStatusResponse {
  visit_count: number;
  has_incomplete_visit: boolean;
  current_visit_id: number | null;
  name_store: string | null;
}

type RootStackParamList = {
  Checkout: { idAbsen: number; nameStore: string; visitCount: number };
  Checkin: { visitCount: number };
  AbsenSales: undefined;
};

type AbsenSalesNavigationProp = StackNavigationProp<RootStackParamList, 'AbsenSales'>;

interface AbsenSalesProps {
  navigation: AbsenSalesNavigationProp;
}

const AbsenSales: React.FC<AbsenSalesProps> = ({ navigation }) => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const [locationSubscriber, setLocationSubscriber] = useState<Location.LocationSubscription | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [token, setToken] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [idAbsen, setIdAbsen] = useState<number | null>(null);
  const [nameStore, setNameStore] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldShowCheckout, setShouldShowCheckout] = useState<boolean>(false);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const storedToken = await getDataLara<string>("tokenUser");
        const storedUserDetails = await getDataLara<UserDetails>("dataDetailUser");
        if (storedToken && storedUserDetails) {
          setToken(storedToken);
          setUserDetails(storedUserDetails);
          setUserName(storedUserDetails.name || "User");
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchStatus = async (): Promise<void> => {
        try {
          const storedToken = await getDataLara<string>("tokenUser");
          const storedUserDetails = await getDataLara<UserDetails>("dataDetailUser");
          if (!storedToken || !storedUserDetails) return;

          setToken(storedToken);
          setUserDetails(storedUserDetails);
          setUserName(storedUserDetails.name || "User");

          const response = await axios.get<CheckStatusResponse>(
            'https://citrabarubusana.org/api/store-visit/check-status',
            {
              params: { salesman_id: storedUserDetails.id },
              headers: { Authorization: `Bearer ${storedToken}` },
            }
          );

          const { visit_count, has_incomplete_visit, current_visit_id, name_store } = response.data;
          setVisitCount(visit_count + 1);

          if (has_incomplete_visit) {
            setShouldShowCheckout(true);
            setIdAbsen(current_visit_id);
            setNameStore(name_store);
          } else {
            setShouldShowCheckout(false);
            setIdAbsen(null);
            setNameStore(null);
          }
          setIsDataLoaded(true);
        } catch (error) {
          const axiosError = error as AxiosError<{ message?: string }>;
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: axiosError.response?.data?.message || 'Failed to fetch status',
          });
        }
      };
      fetchStatus();
    }, [])
  );

  const handleCheckout = async (): Promise<void> => {
    if (isDataLoaded && idAbsen) {
      navigation.navigate('Checkout', {
        idAbsen,
        nameStore: nameStore || '',
        visitCount: visitCount - 1,
      });
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Data belum dimuat atau tidak ada kunjungan aktif' });
    }
  };

  const handleAbsen = async (): Promise<void> => {
    navigation.navigate('Checkin', { visitCount });
  };

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Toast.show({ type: 'error', text1: 'GPS Nonaktif', text2: 'Aktifkan layanan lokasi di pengaturan' });
        return false;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setLocationPermission(granted);
      if (!granted) Toast.show({ type: 'error', text1: 'Izin Ditolak', text2: 'Izin lokasi diperlukan' });
      return granted;
    } catch {
      return false;
    }
  };

  const startLocationUpdates = async (granted: boolean): Promise<void> => {
    if (!granted) return;
    try {
      const loc = await Location.getCurrentPositionAsync({});
      setCurrentPosition({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 900000, distanceInterval: 10 },
        (l) => setCurrentPosition({ latitude: l.coords.latitude, longitude: l.coords.longitude })
      );
      setLocationSubscriber(sub);
    } catch {
      Toast.show({ type: 'error', text1: 'GPS Error', text2: 'Gagal mendapatkan lokasi' });
    }
  };

  const stopLocationUpdates = (): void => {
    locationSubscriber?.remove();
    setLocationSubscriber(null);
  };

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const setup = async () => {
        const granted = await requestLocationPermission();
        if (granted && mounted) await startLocationUpdates(granted);
      };
      setup();
      return () => {
        mounted = false;
        stopLocationUpdates();
      };
    }, [])
  );

  // ── Loading states ──────────────────────────────────────────
  if (locationPermission === null) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.centerText}>Meminta izin lokasi...</Text>
      </View>
    );
  }
  if (!locationPermission) {
    return (
      <View style={styles.centerScreen}>
        <MaterialCommunityIcons name="map-marker-off" size={52} color="#ef4444" />
        <Text style={styles.centerText}>Izin lokasi tidak diberikan</Text>
      </View>
    );
  }
  if (!currentPosition) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.centerText}>Mengambil lokasi GPS...</Text>
      </View>
    );
  }

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const formattedDate = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}

        <HeaderStyle title={'Absen Checkin Toko'} rightIcon={'chat'} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO CARD ─────────────────────────────── */}
          <View style={[styles.heroCard, shouldShowCheckout && styles.heroCardDanger]}>
            {/* Top row: greeting + avatar */}
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroGreeting}>Selamat datang,</Text>
                <Text style={styles.heroName}>{userName}</Text>
              </View>
              <View style={[styles.avatarCircle, shouldShowCheckout && styles.avatarCircleDanger]}>
                <MaterialCommunityIcons
                  name={shouldShowCheckout ? 'store-alert-outline' : 'account-tie'}
                  size={28}
                  color={shouldShowCheckout ? '#b91c1c' : '#1e3a8a'}
                />
              </View>
            </View>

            {/* Divider */}
            <View style={styles.heroDivider} />

            {/* Time */}
            <Text style={styles.heroTime}>{formattedTime}</Text>
            <Text style={styles.heroDate}>{formattedDate}</Text>

            {/* GPS pill */}
            <View style={styles.gpsPill}>
              <MaterialCommunityIcons name="crosshairs-gps" size={12} color="#22c55e" />
              <Text style={styles.gpsPillText}>
                {currentPosition.latitude.toFixed(5)}, {currentPosition.longitude.toFixed(5)}
              </Text>
            </View>
          </View>

          {/* ── STATUS CARD ───────────────────────────── */}
          {!shouldShowCheckout ? (
            /* CHECK IN */
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="store-check-outline" size={20} color="#1e3a8a" />
                <Text style={styles.cardTitle}>Check-In Toko Mitra</Text>
              </View>

              {/* Visit number badge */}
              <View style={styles.visitBadgeRow}>
                <View style={styles.visitBadge}>
                  <Text style={styles.visitBadgeNumber}>{visitCount}</Text>
                </View>
                <View>
                  <Text style={styles.visitBadgeLabel}>Kunjungan hari ini</Text>
                  <Text style={styles.visitBadgeSub}>Tap tombol di bawah untuk mulai</Text>
                </View>
              </View>

              {/* Info row */}
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="information-outline" size={14} color="#64748b" />
                <Text style={styles.infoText}>
                  Pastikan GPS aktif dan Anda berada di lokasi toko sebelum check-in
                </Text>
              </View>

              {/* Fingerprint button */}
              <TouchableOpacity style={styles.fingerprintBtn} onPress={handleAbsen} activeOpacity={0.8}>
                <View style={styles.fingerprintRing}>
                  <View style={styles.fingerprintInner}>
                    <MaterialCommunityIcons name="fingerprint" size={48} color="#1e3a8a" />
                  </View>
                </View>
                <Text style={styles.fingerprintLabel}>Check In Sekarang</Text>
                <Text style={styles.fingerprintSub}>Tap untuk konfirmasi kehadiran</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* CHECK OUT */
            <View style={[styles.card, styles.cardDanger]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="store-alert-outline" size={20} color="#b91c1c" />
                <Text style={[styles.cardTitle, { color: '#b91c1c' }]}>Checkout Diperlukan</Text>
              </View>

              {/* Active store info */}
              {nameStore && (
                <View style={styles.activeStoreBox}>
                  <Text style={styles.activeStoreLabel}>TOKO AKTIF</Text>
                  <View style={styles.activeStoreRow}>
                    <MaterialCommunityIcons name="store" size={18} color="#1e3a8a" />
                    <Text style={styles.activeStoreName} numberOfLines={1}>{nameStore}</Text>
                  </View>
                </View>
              )}

              {/* Warning info */}
              <View style={[styles.infoRow, styles.infoRowDanger]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#b91c1c" />
                <Text style={[styles.infoText, { color: '#b91c1c' }]}>
                  Selesaikan kunjungan toko sebelumnya sebelum memulai kunjungan baru
                </Text>
              </View>

              {/* Fingerprint button – danger */}
              <TouchableOpacity style={[styles.fingerprintBtn, styles.fingerprintBtnDanger]} onPress={handleCheckout} activeOpacity={0.8}>
                <View style={[styles.fingerprintRing, styles.fingerprintRingDanger]}>
                  <View style={[styles.fingerprintInner, styles.fingerprintInnerDanger]}>
                    <MaterialCommunityIcons name="fingerprint" size={48} color="#b91c1c" />
                  </View>
                </View>
                <Text style={[styles.fingerprintLabel, { color: '#b91c1c' }]}>Check Out Toko</Text>
                <Text style={styles.fingerprintSub}>Tap untuk selesaikan kunjungan</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── QUICK STATS ───────────────────────────── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="store-outline" size={22} color="#1e3a8a" />
              <Text style={styles.statNumber}>{visitCount > 0 ? visitCount - 1 : 0}</Text>
              <Text style={styles.statLabel}>Selesai</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: shouldShowCheckout ? '#fef2f2' : '#f0fdf4' }]}>
              <MaterialCommunityIcons
                name={shouldShowCheckout ? 'timer-sand' : 'check-circle-outline'}
                size={22}
                color={shouldShowCheckout ? '#b91c1c' : '#15803d'}
              />
              <Text style={[styles.statNumber, { color: shouldShowCheckout ? '#b91c1c' : '#15803d' }]}>
                {shouldShowCheckout ? '1' : '0'}
              </Text>
              <Text style={styles.statLabel}>{shouldShowCheckout ? 'Pending' : 'Aktif'}</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="map-marker-radius-outline" size={22} color="#1e3a8a" />
              <Text style={styles.statNumber}>{visitCount}</Text>
              <Text style={styles.statLabel}>Target</Text>
            </View>
          </View>
        </ScrollView>
        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  } as ViewStyle,
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  } as ViewStyle,
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    gap: 12,
  } as ViewStyle,
  centerText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  } as TextStyle,
  loadingOverlay: {
    position: 'absolute',
    zIndex: 10,
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  } as ViewStyle,

  /* ── Hero card ── */
  heroCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 22,
    padding: 22,
  } as ViewStyle,
  heroCardDanger: {
    backgroundColor: '#7f1d1d',
  } as ViewStyle,
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  } as ViewStyle,
  heroGreeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  } as TextStyle,
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  } as TextStyle,
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarCircleDanger: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  } as ViewStyle,
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 16,
  } as ViewStyle,
  heroTime: {
    fontSize: 44,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1.5,
  } as TextStyle,
  heroDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 3,
    fontWeight: '500',
  } as TextStyle,
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 14,
    alignSelf: 'flex-start',
  } as ViewStyle,
  gpsPillText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'monospace',
  } as TextStyle,

  /* ── Card ── */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  } as ViewStyle,
  cardDanger: {
    borderColor: '#fecaca',
    backgroundColor: '#fffbfb',
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: 14,
    marginBottom: 18,
  } as ViewStyle,
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e3a8a',
  } as TextStyle,

  /* Visit badge */
  visitBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
  } as ViewStyle,
  visitBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  visitBadgeNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e3a8a',
  } as TextStyle,
  visitBadgeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  } as TextStyle,
  visitBadgeSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  } as TextStyle,

  /* Info row */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  } as ViewStyle,
  infoRowDanger: {
    backgroundColor: '#fef2f2',
  } as ViewStyle,
  infoText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  } as TextStyle,

  /* Active store box */
  activeStoreBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  } as ViewStyle,
  activeStoreLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 6,
  } as TextStyle,
  activeStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  } as ViewStyle,
  activeStoreName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e3a8a',
    flex: 1,
  } as TextStyle,

  /* Fingerprint button */
  fingerprintBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  } as ViewStyle,
  fingerprintBtnDanger: {} as ViewStyle,
  fingerprintRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  } as ViewStyle,
  fingerprintRingDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    shadowColor: '#b91c1c',
  } as ViewStyle,
  fingerprintInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  fingerprintInnerDanger: {
    backgroundColor: '#fee2e2',
  } as ViewStyle,
  fingerprintLabel: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '800',
    color: '#1e3a8a',
    letterSpacing: 0.2,
  } as TextStyle,
  fingerprintSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  } as TextStyle,

  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  } as ViewStyle,
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e3a8a',
  } as TextStyle,
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
});

export default AbsenSales;