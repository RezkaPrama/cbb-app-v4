import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
  FlatList,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useFocusEffect, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import moment from 'moment-timezone';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";
import { storeDataLara, getDataLara } from "../../utils/asyncStorage";
import { MaterialCommunityIcons, Feather as FeatherIcon } from '@expo/vector-icons';
import HeaderStyle1 from "../../components/Header/HeaderStyle1";

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = 'https://citrabarubusana.org';

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
interface Customer {
  id: number;
  idcust: string;
  nama: string;
  alamat: string;
  telepon: string;
  kode_rayon: string;
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

const NEW_CUSTOMER_OFFER_VALUE = 'Penawaran Pelanggan Baru';

// ── Reusable icon input ────────────────────────────────────────
interface IconInputProps {
  iconName: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
}

const IconInput: React.FC<IconInputProps> = ({
  iconName, placeholder, value, onChangeText,
  keyboardType = 'default', multiline = false, numberOfLines = 1, editable = true,
}) => (
  <View style={[iStyles.wrapper, multiline && iStyles.wrapperMultiline, !editable && iStyles.wrapperDisabled]}>
    <View style={iStyles.iconBox}>
      <MaterialCommunityIcons name={iconName as any} size={18} color="#94a3b8" />
    </View>
    <View style={iStyles.divider} />
    <TextInput
      style={[iStyles.input, multiline && iStyles.inputMultiline, !editable && iStyles.inputDisabled]}
      placeholder={placeholder}
      placeholderTextColor="#cbd5e1"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : 'center'}
      editable={editable}
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
  wrapperDisabled: {
    backgroundColor: '#f8fafc',
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
  inputDisabled: {
    color: '#64748b',
  } as TextStyle,
});

// ── Main component ─────────────────────────────────────────────
const Checkin: React.FC<CheckinProps> = ({ navigation, route }) => {
  const [nameStore, setNameStore] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [locationSubscriber, setLocationSubscriber] = useState<Location.LocationSubscription | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // ── Foto checkin ──────────────────────────────────────────────
  const [fotoCheckinUri, setFotoCheckinUri] = useState<string | null>(null);

  // ── Customer search state ────────────────────────────────────
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState<boolean>(false);
  const [customerDropdownVisible, setCustomerDropdownVisible] = useState<boolean>(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visitCount = route.params?.visitCount ?? 1;

  const isNewCustomerOffer = purpose === NEW_CUSTOMER_OFFER_VALUE;

  const getPickerOptions = (): PickerOption[] => {
    const base: PickerOption[] = [
      { label: "Penawaran Pelanggan Baru", value: NEW_CUSTOMER_OFFER_VALUE },
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

  // ── Customer search ───────────────────────────────────────────
  const fetchCustomers = useCallback(async (search: string) => {
    setCustomerLoading(true);
    setCustomerError(null);

    try {
      const authToken = await getDataLara<string>('tokenUser');

      if (!authToken) {
        setCustomerError('Token tidak ditemukan, silakan login ulang.');
        setCustomerLoading(false);
        return;
      }

      const params = new URLSearchParams({ search: search.trim(), limit: '20' });
      const url = `${BASE_URL}/api/customers?${params}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (res.status === 401) {
        setCustomerError('Sesi habis, silakan login ulang.');
        setCustomerLoading(false);
        return;
      }

      const json = await res.json();

      if (json.success) {
        const list: Customer[] = json.data ?? [];
        setCustomers(list);
        setCustomerDropdownVisible(list.length > 0);
      } else {
        setCustomerError(json.message ?? 'Gagal memuat pelanggan.');
        setCustomers([]);
        setCustomerDropdownVisible(false);
      }
    } catch (err: any) {
      setCustomerError('Gagal koneksi: ' + (err.message ?? 'unknown error'));
      setCustomers([]);
      setCustomerDropdownVisible(false);
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  const onCustomerSearchChange = (text: string) => {
    setCustomerSearch(text);
    setSelectedCustomer(null);
    setCustomerError(null);
    setNameStore('');

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    if (text.trim().length >= 2) {
      searchDebounceRef.current = setTimeout(() => {
        fetchCustomers(text.trim());
      }, 400);
    } else {
      setCustomers([]);
      setCustomerDropdownVisible(false);
    }
  };

  const onSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.nama);
    setNameStore(customer.nama);
    setCustomers([]);
    setCustomerDropdownVisible(false);
    setCustomerError(null);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // Reset pelanggan / nama toko ketika ganti tujuan kunjungan
  const onPurposeChange = (val: string) => {
    setPurpose(val);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomers([]);
    setCustomerDropdownVisible(false);
    setCustomerError(null);
    setNameStore('');
  };

  // ── Camera: foto checkin ─────────────────────────────────────
  const pickFotoCheckin = async () => {
    const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (camStatus !== 'granted') {
      Toast.show({ type: 'error', text1: 'Izin Ditolak', text2: 'Aplikasi memerlukan izin kamera.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setFotoCheckinUri(result.assets[0].uri);
    }
  };

  const handleAbsen = async (): Promise<void> => {
    setIsLoading(true);
    const jakartaTime = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');

    if (!currentPosition?.latitude || !currentPosition?.longitude)
      return (setIsLoading(false), Toast.show({ type: 'error', text1: 'Error', text2: 'Koordinat GPS tidak valid!' }));
    if (!purpose)
      return (setIsLoading(false), Toast.show({ type: 'error', text1: 'Error', text2: 'Tujuan kunjungan harus dipilih!' }));
    if (!isNewCustomerOffer && !selectedCustomer)
      return (setIsLoading(false), Toast.show({ type: 'error', text1: 'Error', text2: 'Pelanggan harus dipilih!' }));
    if (!nameStore.trim())
      return (setIsLoading(false), Toast.show({ type: 'error', text1: 'Error', text2: 'Nama toko harus diisi!' }));
    if (!fotoCheckinUri)
      return (setIsLoading(false), Toast.show({ type: 'error', text1: 'Error', text2: 'Foto check-in toko wajib diambil!' }));
    if (!userDetails?.id)
      return (setIsLoading(false), Toast.show({ type: 'error', text1: 'Error', text2: 'User ID tidak ditemukan!' }));

    try {
      const formData = new FormData();
      formData.append('latitude', currentPosition.latitude.toString());
      formData.append('longitude', currentPosition.longitude.toString());
      formData.append('timestamp_checkin', jakartaTime);
      formData.append('name_store', nameStore);
      formData.append('purpose', purpose);
      if (notes.trim()) formData.append('notes', notes.trim());

      if (!isNewCustomerOffer && selectedCustomer) {
        formData.append('id_contact', String(selectedCustomer.id));
        formData.append('address_store', selectedCustomer.alamat ?? '');
      }

      const uriParts = fotoCheckinUri.split('.');
      const extension = uriParts[uriParts.length - 1];
      formData.append('foto_checkin', {
        uri: fotoCheckinUri,
        name: `foto_checkin.${extension}`,
        type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
      } as any);

      const response = await fetch("https://citrabarubusana.org/api/store-visit/check-in", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
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

  const isFormValid =
    purpose !== '' &&
    nameStore.trim() !== '' &&
    !!fotoCheckinUri &&
    (isNewCustomerOffer || !!selectedCustomer);

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
          keyboardShouldPersistTaps="handled"
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

            {/* Tujuan Kunjungan — paling atas */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TUJUAN KUNJUNGAN <Text style={styles.required}>*</Text></Text>
              <View style={styles.pickerWrapper}>
                <View style={styles.pickerIconBox}>
                  <MaterialCommunityIcons name="tag-outline" size={18} color="#94a3b8" />
                </View>
                <View style={styles.pickerDivider} />
                <Picker
                  selectedValue={purpose}
                  onValueChange={(val: string) => onPurposeChange(val)}
                  style={styles.picker}
                >
                  <Picker.Item label="Pilih tujuan kunjungan..." value="" color="#cbd5e1" />
                  {getPickerOptions().map((opt) => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Pelanggan — hanya jika BUKAN penawaran pelanggan baru */}
            {purpose !== '' && !isNewCustomerOffer && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PELANGGAN <Text style={styles.required}>*</Text></Text>

                {selectedCustomer ? (
                  <View style={styles.customerChip}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customerChipName}>{selectedCustomer.nama}</Text>
                      <Text style={styles.customerChipMeta}>
                        {selectedCustomer.idcust} · {selectedCustomer.alamat}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedCustomer(null);
                        setCustomerSearch('');
                        setNameStore('');
                      }}
                      style={styles.customerChipRemove}
                      activeOpacity={0.7}
                    >
                      <FeatherIcon name="x" size={14} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.searchInputWrap}>
                      <FeatherIcon name="search" size={15} color="#94a3b8" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Cari nama / kode pelanggan..."
                        placeholderTextColor="#94a3b8"
                        value={customerSearch}
                        onChangeText={onCustomerSearchChange}
                        autoCorrect={false}
                        autoCapitalize="none"
                      />
                      {customerLoading && (
                        <ActivityIndicator size="small" color="#1e3a8a" />
                      )}
                    </View>

                    {customerError && (
                      <View style={styles.errorWrap}>
                        <FeatherIcon name="wifi-off" size={13} color="#dc2626" />
                        <Text style={styles.errorText}>{customerError}</Text>
                      </View>
                    )}

                    {customerDropdownVisible && customers.length > 0 && (
                      <View style={styles.dropdown}>
                        <FlatList
                          data={customers}
                          keyExtractor={(item) => String(item.id)}
                          scrollEnabled={false}
                          keyboardShouldPersistTaps="handled"
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              onPress={() => onSelectCustomer(item)}
                              style={styles.dropdownItem}
                              activeOpacity={0.7}
                            >
                              <View style={styles.dropdownItemIcon}>
                                <FeatherIcon name="user" size={12} color="#1e3a8a" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.dropdownItemName}>{item.nama}</Text>
                                <Text style={styles.dropdownItemMeta}>
                                  {item.idcust} · {item.alamat}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          )}
                          ItemSeparatorComponent={() => <View style={styles.dropdownSep} />}
                        />
                      </View>
                    )}

                    {!customerLoading && !customerError && customerSearch.trim().length >= 2 && customers.length === 0 && (
                      <View style={styles.notFoundWrap}>
                        <FeatherIcon name="alert-circle" size={13} color="#94a3b8" />
                        <Text style={styles.notFoundText}>Pelanggan tidak ditemukan</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Nama Toko */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NAMA TOKO <Text style={styles.required}>*</Text></Text>
              <IconInput
                iconName="store-outline"
                placeholder={isNewCustomerOffer ? "Masukkan nama toko baru" : "Otomatis dari pelanggan terpilih"}
                value={nameStore}
                onChangeText={setNameStore}
                editable={isNewCustomerOffer}
              />
              {!isNewCustomerOffer && (
                <Text style={styles.fieldHint}>
                  <FeatherIcon name="lock" size={10} color="#94a3b8" /> Terisi otomatis dari pelanggan yang dipilih
                </Text>
              )}
            </View>

            {/* Detail Kunjungan / Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DETAIL KUNJUNGAN</Text>
              <IconInput
                iconName="text-box-outline"
                placeholder="Tambahkan catatan / detail kunjungan (opsional)"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Foto Checkin */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FOTO CHECK-IN TOKO <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                onPress={pickFotoCheckin}
                activeOpacity={0.85}
                style={[styles.photoPicker, fotoCheckinUri && styles.photoPickerFilled]}
              >
                {fotoCheckinUri ? (
                  <>
                    <Image source={{ uri: fotoCheckinUri }} style={styles.photoPreview} />
                    <TouchableOpacity
                      onPress={() => setFotoCheckinUri(null)}
                      style={styles.removePhotoBtn}
                      activeOpacity={0.8}
                    >
                      <FeatherIcon name="trash-2" size={13} color="#fff" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.photoPickerInner}>
                    <View style={styles.cameraIconCircle}>
                      <FeatherIcon name="camera" size={22} color="#1e3a8a" />
                    </View>
                    <Text style={styles.photoPickerText}>Ambil Foto Depan Toko</Text>
                    <Text style={styles.photoPickerSub}>Ketuk untuk membuka kamera</Text>
                  </View>
                )}
              </TouchableOpacity>
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
              <Text style={styles.incompleteHintText}>
                Lengkapi tujuan kunjungan{!isNewCustomerOffer ? ', pelanggan' : ''}, nama toko, dan foto check-in
              </Text>
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
  fieldHint: { fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: '500' } as TextStyle,
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

  /* Customer search */
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
  } as ViewStyle,
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', fontWeight: '500' } as TextStyle,

  errorWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 4,
  } as ViewStyle,
  errorText: { fontSize: 12, color: '#dc2626', fontWeight: '600' } as TextStyle,

  dropdown: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, marginTop: 4, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  } as ViewStyle,
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 11, gap: 10,
  } as ViewStyle,
  dropdownItemIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center',
  } as ViewStyle,
  dropdownItemName: { fontSize: 13, fontWeight: '700', color: '#1e293b' } as TextStyle,
  dropdownItemMeta: { fontSize: 10, color: '#94a3b8', marginTop: 2 } as TextStyle,
  dropdownSep: { height: 0.5, backgroundColor: '#f1f5f9', marginLeft: 52 } as ViewStyle,

  notFoundWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 4,
  } as ViewStyle,
  notFoundText: { fontSize: 12, color: '#94a3b8' } as TextStyle,

  customerChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 12, padding: 12, gap: 10,
  } as ViewStyle,
  customerChipName: { fontSize: 13, fontWeight: '700', color: '#1e40af' } as TextStyle,
  customerChipMeta: { fontSize: 10, color: '#3b82f6', marginTop: 2 } as TextStyle,
  customerChipRemove: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center',
  } as ViewStyle,

  /* User info */
  userInfoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4,
  } as ViewStyle,
  userInfoText: { fontSize: 13, color: '#475569', fontWeight: '600', flex: 1 } as TextStyle,
  positionChip: { backgroundColor: '#dbeafe', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 } as ViewStyle,
  positionChipText: { fontSize: 10, fontWeight: '700', color: '#1e3a8a' } as TextStyle,

  /* Foto checkin */
  photoPicker: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#94a3b8',
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 130,
  } as ViewStyle,
  photoPickerFilled: {
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
  } as ViewStyle,
  photoPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    resizeMode: 'contain',
  } as any,
  photoPickerInner: { alignItems: 'center', gap: 6 } as ViewStyle,
  cameraIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  } as ViewStyle,
  photoPickerText: { fontSize: 13, fontWeight: '700', color: '#334155' } as TextStyle,
  photoPickerSub: { fontSize: 11, color: '#94a3b8' } as TextStyle,
  removePhotoBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#ef4444', width: 28, height: 28,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  } as ViewStyle,

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

  incompleteHint: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 16 } as ViewStyle,
  incompleteHintText: { fontSize: 12, color: '#94a3b8', fontWeight: '500', textAlign: 'center', flexShrink: 1 } as TextStyle,
});

export default Checkin;