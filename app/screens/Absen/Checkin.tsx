import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useFocusEffect, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import moment from 'moment-timezone';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";
import { storeDataLara, getDataLara } from "../../utils/asyncStorage";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderStyle1 from "../../components/Header/HeaderStyle1";

// Types
interface Position { latitude: number; longitude: number; }
interface UserPosition { id: number; name: string; }
interface UserDetails { id: number; name: string; position: UserPosition; }
interface PickerOption { label: string; value: string; }
interface CheckInResponse {
  data?: { id: number };
  message?: string;
  errors?: Record<string, string[] | string>;
}

type RootStackParamList = {
  Checkin: { visitCount: number };
  AbsenMasuk: undefined;
  AbsenSales: undefined;
  Main: undefined;
};

type CheckinNavigationProp = StackNavigationProp<RootStackParamList, 'Checkin'>;
type CheckinRouteProp = RouteProp<RootStackParamList, 'Checkin'>;

interface CheckinProps {
  navigation: CheckinNavigationProp;
  route: CheckinRouteProp;
}

// ── Reusable icon input ────────────────────────────────────────
interface IconInputProps {
  iconName: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  numberOfLines?: number;
}

const IconInput: React.FC<IconInputProps> = ({
  iconName, placeholder, value, onChangeText,
  keyboardType = 'default', multiline = false, numberOfLines = 1,
}) => (
  <View style={[iStyles.wrapper, multiline && iStyles.wrapperMultiline]}>
    <View style={iStyles.iconBox}>
      <MaterialCommunityIcons name={iconName as any} size={18} color="#94a3b8" />
    </View>
    <View style={iStyles.divider} />
    <TextInput
      style={[iStyles.input, multiline && iStyles.inputMultiline]}
      placeholder={placeholder}
      placeholderTextColor="#cbd5e1"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);

const iStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  } as ViewStyle,
  wrapperMultiline: {
    alignItems: 'flex-start',
  } as ViewStyle,
  iconBox: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  } as ViewStyle,
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: '#f1f5f9',
  } as ViewStyle,
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  } as TextStyle,
  inputMultiline: {
    paddingTop: 14,
    minHeight: 90,
  } as TextStyle,
});

// ── Main component ─────────────────────────────────────────────
const Checkin: React.FC<CheckinProps> = ({ navigation, route }) => {
  const [nameStore, setNameStore] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [locationSubscriber, setLocationSubscriber] = useState<Location.LocationSubscription | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const visitCount = route.params?.visitCount ?? 1;

  const getPickerOptions = (): PickerOption[] => {
    const base: PickerOption[] = [
      { label: "Penawaran", value: "Penawaran" },
      { label: "Tagihan", value: "Tagihan" },
      { label: "SO", value: "SO" },
      { label: "Pasang Rak", value: "Pasang Rak" },
      { label: "Konfirmasi PO", value: "Konfimarsi PO" },
      { label: "Tarik Rak", value: "Tarik Rak" },
      { label: "Pengenolan", value: "Pengenolan" },
      { label: "Service Display & Maintenance", value: "Service Display & Maintanance" },
      { label: "Cek Kiriman", value: "Cek Kiriman" },
      { label: "Ambil Retur", value: "Ambil Retur" },
    ];
    const extra: PickerOption[] = [
      { label: "Mapping", value: "Mapping" },
      { label: "CDM", value: "CDM" },
      { label: "Adm Kantor", value: "Adm Kantor" },
    ];
    const pos = userDetails?.position?.name;
    return (pos === 'ASUP' || pos === 'RSM') ? [...base, ...extra] : base;
  };

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const storedToken = await getDataLara<string>("tokenUser");
        const storedUserDetails = await getDataLara<UserDetails>("dataDetailUser");
        if (storedToken && storedUserDetails) {
          setUserDetails(storedUserDetails);
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
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
      console.error('Error starting location');
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
      return () => { mounted = false; stopLocationUpdates(); };
    }, [])
  );

  const handleAbsen = async (): Promise<void> => {
    setIsLoading(true);
    const jakartaTime = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');

    if (!currentPosition?.latitude || !currentPosition?.longitude)
      return (setIsLoading(false), Toast.show({ type: 'error', text1: 'Error', text2: 'Koordinat GPS tidak valid!' }));
    if (!nameStore.trim())
      return (setIsLoading(false), Toast.show({ type: 'error', text1: 'Error', text2: 'Nama toko harus diisi!' }));
    if (!purpose)
      return (setIsLoading(false), Toast.show({ type: 'error', text1: 'Error', text2: 'Tujuan kunjungan harus dipilih!' }));
    if (!userDetails?.id)
      return (setIsLoading(false), Toast.show({ type: 'error', text1: 'Error', text2: 'User ID tidak ditemukan!' }));

    try {
      const formBody = new URLSearchParams({
        latitude: currentPosition.latitude.toString(),
        longitude: currentPosition.longitude.toString(),
        timestamp_checkin: jakartaTime,
        salesman_id: userDetails.id.toString(),
        name_store: nameStore,
        purpose,
      }).toString();

      const response = await fetch("https://citrabarubusana.org/api/store-visit/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": `Bearer ${token}` },
        body: formBody,
      });

      const responseData: CheckInResponse = await response.json();

      if (response.ok) {
        if (responseData.data?.id) await storeDataLara("storeVisitId", responseData.data.id.toString());
        Toast.show({ type: 'success', text1: 'Sukses', text2: 'Absen Check In Toko berhasil!' });
        navigation.navigate('Main');
      } else {
        let msg = 'Absen gagal';
        if (responseData.message) msg += ': ' + responseData.message;
        if (responseData.errors) {
          const first = Object.values(responseData.errors)[0];
          msg += ': ' + (Array.isArray(first) ? first[0] : first);
        }
        Toast.show({ type: 'error', text1: 'Error', text2: msg });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Periksa Koneksi Internet Anda.' });
    } finally {
      setIsLoading(false);
    }
  };

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

  const isFormValid = nameStore.trim() !== '' && purpose !== '';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}

        <HeaderStyle1 title={'Absen Checkin Toko'} rightIcon={'chat'} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO CARD ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>CHECK-IN TOKO</Text>
                <Text style={styles.heroTime}>
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </Text>
                <Text style={styles.heroDate}>
                  {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="store-outline" size={28} color="#ffffff" />
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroBottom}>
              {/* Visit badge */}
              <View style={styles.visitBadge}>
                <Text style={styles.visitBadgeNum}>{visitCount}</Text>
                <Text style={styles.visitBadgeText}>Kunjungan{'\n'}hari ini</Text>
              </View>

              {/* GPS pill */}
              <View style={styles.gpsPill}>
                <MaterialCommunityIcons name="crosshairs-gps" size={12} color="#22c55e" />
                <Text style={styles.gpsPillText}>
                  {currentPosition.latitude.toFixed(5)},{'\n'}{currentPosition.longitude.toFixed(5)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── FORM CARD ── */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="store-edit-outline" size={18} color="#1e3a8a" />
              <Text style={styles.cardTitle}>Detail Kunjungan</Text>
            </View>

            {/* Nama Toko */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NAMA TOKO <Text style={styles.required}>*</Text></Text>
              <IconInput
                iconName="store-outline"
                placeholder="Masukkan nama toko"
                value={nameStore}
                onChangeText={setNameStore}
              />
            </View>

            {/* Tujuan Kunjungan — Picker dengan icon */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TUJUAN KUNJUNGAN <Text style={styles.required}>*</Text></Text>
              <View style={styles.pickerWrapper}>
                <View style={styles.pickerIconBox}>
                  <MaterialCommunityIcons name="tag-outline" size={18} color="#94a3b8" />
                </View>
                <View style={styles.pickerDivider} />
                <Picker
                  selectedValue={purpose}
                  onValueChange={(val: string) => setPurpose(val)}
                  style={styles.picker}
                >
                  <Picker.Item label="Pilih tujuan kunjungan..." value="" color="#cbd5e1" />
                  {getPickerOptions().map((opt) => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* User info */}
            {userDetails && (
              <View style={styles.userInfoRow}>
                <MaterialCommunityIcons name="account-circle-outline" size={15} color="#64748b" />
                <Text style={styles.userInfoText}>{userDetails.name}</Text>
                {userDetails.position && (
                  <View style={styles.positionChip}>
                    <Text style={styles.positionChipText}>{userDetails.position.name}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── FINGERPRINT ── */}
          {isFormValid ? (
            <View style={styles.fingerprintSection}>
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
            <View style={styles.incompleteHint}>
              <MaterialCommunityIcons name="information-outline" size={15} color="#cbd5e1" />
              <Text style={styles.incompleteHintText}>Lengkapi nama toko dan tujuan kunjungan</Text>
            </View>
          )}
        </ScrollView>
        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' } as ViewStyle,
  scrollContent: { padding: 16, paddingBottom: 48, gap: 14 } as ViewStyle,
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', gap: 12 } as ViewStyle,
  centerText: { fontSize: 14, color: '#64748b', fontWeight: '500' } as TextStyle,
  loadingOverlay: {
    position: 'absolute', zIndex: 10, height: '100%', width: '100%',
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)',
  } as ViewStyle,

  /* Hero */
  heroCard: { backgroundColor: '#1e3a8a', borderRadius: 22, padding: 22 } as ViewStyle,
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 } as ViewStyle,
  heroLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, marginBottom: 4 } as TextStyle,
  heroTime: { fontSize: 40, fontWeight: '800', color: '#ffffff', letterSpacing: -1 } as TextStyle,
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3, fontWeight: '500' } as TextStyle,
  heroIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  } as ViewStyle,
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 16 } as ViewStyle,
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as ViewStyle,
  visitBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  } as ViewStyle,
  visitBadgeNum: { fontSize: 28, fontWeight: '800', color: '#ffffff' } as TextStyle,
  visitBadgeText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', lineHeight: 16 } as TextStyle,
  gpsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
  } as ViewStyle,
  gpsPillText: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace', lineHeight: 15 } as TextStyle,

  /* Form card */
  formCard: {
    backgroundColor: '#ffffff', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 14, marginBottom: 18,
  } as ViewStyle,
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' } as TextStyle,

  fieldGroup: { marginBottom: 14 } as ViewStyle,
  fieldLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 7 } as TextStyle,
  required: { color: '#ef4444', fontWeight: '800' } as TextStyle,

  /* Picker — sama struktur dengan IconInput */
  pickerWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    backgroundColor: '#ffffff', overflow: 'hidden',
  } as ViewStyle,
  pickerIconBox: { width: 46, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 } as ViewStyle,
  pickerDivider: { width: 1, height: 30, backgroundColor: '#f1f5f9' } as ViewStyle,
  picker: { flex: 1, height: 52 } as ViewStyle,

  /* User info */
  userInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4,
  } as ViewStyle,
  userInfoText: { fontSize: 13, color: '#475569', fontWeight: '600', flex: 1 } as TextStyle,
  positionChip: { backgroundColor: '#dbeafe', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 } as ViewStyle,
  positionChipText: { fontSize: 10, fontWeight: '700', color: '#1e3a8a' } as TextStyle,

  /* Fingerprint */
  fingerprintSection: { alignItems: 'center', paddingVertical: 8 } as ViewStyle,
  fingerprintBtn: { alignItems: 'center' } as ViewStyle,
  fingerprintRing: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#eff6ff', borderWidth: 2, borderColor: '#bfdbfe',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1e3a8a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 14, elevation: 6,
  } as ViewStyle,
  fingerprintInner: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  fingerprintLabel: { marginTop: 14, fontSize: 14, fontWeight: '800', color: '#1e3a8a' } as TextStyle,
  fingerprintSub: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '500' } as TextStyle,

  incompleteHint: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 8 } as ViewStyle,
  incompleteHintText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' } as TextStyle,
});

export default Checkin;