import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Animated,
    Easing,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Alert,
    FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// ShelfFormScreen.tsx — import dari Routes, jangan definisi ulang
import type { RootStackParamList } from '../../../app/navigations/Route'; // sesuaikan path
import { getDataLara } from '../../utils/asyncStorage';


// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_URL = 'https://citrabarubusana.org';

// ─── Types ────────────────────────────────────────────────────────────────────

// Hapus definisi RootStackParamList lokal yang ada di ShelfFormScreen,
// lalu tipe navigation & route otomatis cocok

type ShelfFormNavigationProp = StackNavigationProp<RootStackParamList, 'ShelfForm'>;
type ShelfFormRouteProp = RouteProp<RootStackParamList, 'ShelfForm'>;

interface ShelfFormScreenProps {
    navigation: ShelfFormNavigationProp;
    route: ShelfFormRouteProp;
}

type StatusRak = 'Bagus' | 'Kurang Bagus' | 'Jelek' | 'Butuh Perbaikan' | '';
type FixingRak = 'Rak Baru' | 'Sudah Diperbaiki' | 'Perlu Perbaikan' | 'Tidak Perlu Perbaikan' | '';

interface StatusOption {
    value: StatusRak;
    label: string;
    emoji: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

interface FixingOption {
    value: FixingRak;
    label: string;
    emoji: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

interface Customer {
    id: number;
    idcust: string;
    nama: string;
    alamat: string;
    telepon: string;
    kode_rayon: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: StatusOption[] = [
    { value: 'Bagus', label: 'Bagus', emoji: '👍', color: '#059669', bgColor: '#d1fae5', borderColor: '#6ee7b7' },
    { value: 'Kurang Bagus', label: 'Kurang Bagus', emoji: '👌', color: '#0284c7', bgColor: '#e0f2fe', borderColor: '#7dd3fc' },
    { value: 'Jelek', label: 'Jelek', emoji: '⚠️', color: '#d97706', bgColor: '#fef3c7', borderColor: '#fcd34d' },
    { value: 'Butuh Perbaikan', label: 'Butuh Perbaikan', emoji: '🔧', color: '#dc2626', bgColor: '#fee2e2', borderColor: '#fca5a5' },
];

const FIXING_OPTIONS: FixingOption[] = [
    { value: 'Rak Baru', label: 'Rak Baru', emoji: '✨', color: '#059669', bgColor: '#d1fae5', borderColor: '#6ee7b7' },
    { value: 'Sudah Diperbaiki', label: 'Sudah Diperbaiki', emoji: '✅', color: '#0284c7', bgColor: '#e0f2fe', borderColor: '#7dd3fc' },
    { value: 'Perlu Perbaikan', label: 'Perlu Perbaikan', emoji: '🔨', color: '#d97706', bgColor: '#fef3c7', borderColor: '#fcd34d' },
    { value: 'Tidak Perlu Perbaikan', label: 'Tidak Perlu Perbaikan', emoji: '⛔', color: '#64748b', bgColor: '#f1f5f9', borderColor: '#cbd5e1' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SpinnerIcon: React.FC<{ size?: number; color?: string }> = ({
    size = 30,
    color = '#10b981',
}) => {
    const spinAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.timing(spinAnim, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
        ).start();
    }, []);
    const rotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return (
        <Animated.View style={{ transform: [{ rotate }] }}>
            <FeatherIcon name="loader" size={size} color={color} />
        </Animated.View>
    );
};

const SuccessIcon: React.FC = () => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    }, []);
    return (
        <Animated.View style={[styles.successIconWrap, { transform: [{ scale: scaleAnim }] }]}>
            <FeatherIcon name="check" size={28} color="#059669" strokeWidth={3} />
        </Animated.View>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ShelfFormScreen: React.FC<ShelfFormScreenProps> = ({ navigation, route }) => {
    const { scannedSerial, scannedStore, manualMode } = route.params ?? {};
    const insets = useSafeAreaInsets();

    // ── Form state ────────────────────────────────────────────────────────────
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState(scannedStore?.pelanggan ?? '');
    const [namaToko, setNamaToko] = useState(scannedStore?.namaToko ?? '');
    const [status, setStatus] = useState<StatusRak>('');
    const [fixing, setFixing] = useState<FixingRak>('');
    const [serialNumber, setSerialNumber] = useState(scannedSerial ?? '');
    const [fotoUri, setFotoUri] = useState<string | null>(null);
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const todayStr = new Date().toISOString().split('T')[0];
    const [dateTransfer, setDateTransfer] = useState(todayStr);

    // ── Customer search state ─────────────────────────────────────────────────
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [customerDropdownVisible, setCustomerDropdownVisible] = useState(false);
    const [customerError, setCustomerError] = useState<string | null>(null); // ✅ tambahan: tampilkan error
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [loadingGPS, setLoadingGPS] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [statusPickerVisible, setStatusPickerVisible] = useState(false);
    const [fixingPickerVisible, setFixingPickerVisible] = useState(false);

    type ModalType = 'scanning' | 'success' | 'confirm_cancel' | null;
    const [modalType, setModalType] = useState<ModalType>(null);
    const modalOpacity = useRef(new Animated.Value(0)).current;
    const modalScale = useRef(new Animated.Value(0.9)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // ── API: get auth token ───────────────────────────────────────────────────
    // ✅ SESUDAH — samakan key dengan yang dipakai di seluruh app
    const getToken = async (): Promise<string | null> => {
        try {
            const token = await getDataLara<string>('tokenUser');
            return token ?? null;
        } catch {
            return null;
        }
    };

    // ── API: fetch customers ──────────────────────────────────────────────────
    // ✅ FIX UTAMA: fungsi ini sekarang return boolean dan log error dengan jelas
    const fetchCustomers = useCallback(async (search: string) => {
        setCustomerLoading(true);
        setCustomerError(null);

        try {
            const token = await getToken();

            if (!token) {
                setCustomerError('Token tidak ditemukan, silakan login ulang.');
                setCustomerLoading(false);
                return;
            }

            const params = new URLSearchParams({ search: search.trim(), limit: '20' });
            const url = `${BASE_URL}/api/rack/customers?${params}`;

            console.log('[fetchCustomers] GET', url);
            console.log('[fetchCustomers] token:', token ? token.slice(0, 20) + '...' : 'null');

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('[fetchCustomers] HTTP status:', res.status);

            // ✅ Jika 401: token invalid / expired
            if (res.status === 401) {
                setCustomerError('Sesi habis, silakan login ulang.');
                return;
            }

            const json = await res.json();
            console.log('[fetchCustomers] response:', JSON.stringify(json).slice(0, 200));

            if (json.success) {
                const list: Customer[] = json.data ?? [];
                setCustomers(list);
                // ✅ FIX: selalu set dropdown visible jika ada data, sembunyikan jika kosong
                setCustomerDropdownVisible(list.length > 0);
                if (list.length === 0) {
                    setCustomerError(null); // bukan error, cukup tampilkan "tidak ditemukan"
                }
            } else {
                setCustomerError(json.message ?? 'Gagal memuat pelanggan.');
                setCustomers([]);
                setCustomerDropdownVisible(false);
            }
        } catch (err: any) {
            console.error('[fetchCustomers] error:', err);
            setCustomerError('Gagal koneksi: ' + (err.message ?? 'unknown error'));
            setCustomers([]);
            setCustomerDropdownVisible(false);
        } finally {
            setCustomerLoading(false);
        }
    }, []);

    // ✅ FIX: debounce dengan minimum 2 karakter, clear yang benar
    const onCustomerSearchChange = (text: string) => {
        setCustomerSearch(text);
        setSelectedCustomer(null);
        setCustomerError(null);

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

    // ── onSelectCustomer — auto-fill nama toko dari nama customer ──
    const onSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch(customer.nama);
        setCustomers([]);
        setCustomerDropdownVisible(false);
        setCustomerError(null);

        // ✅ Auto-fill nama toko jika belum diisi user
        if (!namaToko) {
            setNamaToko(customer.nama);
        }
    };

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
    }, []);

    // ── Pulse modal animation ─────────────────────────────────────────────────
    useEffect(() => {
        if (modalType === 'scanning') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.5, duration: 700, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [modalType]);

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const openModal = (type: ModalType) => {
        setModalType(type);
        modalOpacity.setValue(0);
        modalScale.setValue(0.88);
        Animated.parallel([
            Animated.timing(modalOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.spring(modalScale, { toValue: 1, friction: 7, tension: 120, useNativeDriver: true }),
        ]).start();
    };

    const closeModal = (callback?: () => void) => {
        Animated.parallel([
            Animated.timing(modalOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(modalScale, { toValue: 0.9, duration: 180, useNativeDriver: true }),
        ]).start(() => {
            setModalType(null);
            callback?.();
        });
    };

    // ── GPS ───────────────────────────────────────────────────────────────────
    // ── GPS — auto detect saat screen mount ──────────────────────
    useEffect(() => {
        getGPSLocation(); // ✅ otomatis deteksi saat buka screen
    }, []);

    const getGPSLocation = async () => {
        setLoadingGPS(true);
        try {
            const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
            if (locStatus !== 'granted') {
                Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin GPS.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setLatitude(loc.coords.latitude.toString());
            setLongitude(loc.coords.longitude.toString());
        } catch (error: any) {
            Alert.alert('Gagal Mengambil Lokasi', error.message ?? 'Terjadi kesalahan.');
        } finally {
            setLoadingGPS(false);
        }
    };

    // ── Camera ────────────────────────────────────────────────────────────────
    const pickImage = async () => {
        const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (camStatus !== 'granted') {
            Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin kamera.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) {
            setFotoUri(result.assets[0].uri);
        }
    };

    // ── Submit ke API ─────────────────────────────────────────────────────────
    const handleUpdate = async () => {
        if (!serialNumber) {
            Alert.alert('Peringatan', 'Serial number wajib diisi.'); return;
        }
        if (!status) {
            Alert.alert('Peringatan', 'Kondisi rak wajib dipilih.'); return;
        }
        if (!latitude || !longitude) {
            Alert.alert('Peringatan', 'Koordinat GPS wajib diisi. Klik tombol Deteksi GPS.'); return;
        }

        openModal('scanning');
        setSubmitting(true);

        try {
            const token = await getToken();

            const formData = new FormData();
            formData.append('serial_number', serialNumber);
            formData.append('latitude', latitude);
            formData.append('longitude', longitude);
            formData.append('status', status);

            if (namaToko) formData.append('store', namaToko);
            if (selectedCustomer) {
                formData.append('id_contact', String(selectedCustomer.id));
                formData.append('code_customer', selectedCustomer.idcust);
            }
            if (fixing) formData.append('fixing', fixing);
            if (dateTransfer) formData.append('date_transfer', dateTransfer);

            if (fotoUri) {
                const uriParts = fotoUri.split('.');
                const extension = uriParts[uriParts.length - 1];
                formData.append('photo_rack', {
                    uri: fotoUri,
                    name: `photo_rack.${extension}`,
                    type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
                } as any);
            }

            const res = await fetch(`${BASE_URL}/api/rack/update-kondisi`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const json = await res.json();

            closeModal(() => {
                if (res.ok && json.success) {
                    openModal('success');
                    setTimeout(() => {
                        closeModal(() => navigation.navigate('Main'));
                    }, 2200);
                } else {
                    const errMsg = json.message ?? 'Terjadi kesalahan pada server.';
                    const errDetail = json.errors
                        ? '\n' + Object.values(json.errors).flat().join('\n')
                        : '';
                    Alert.alert('Gagal Menyimpan', errMsg + errDetail);
                }
            });
        } catch (err: any) {
            closeModal(() => {
                Alert.alert('Error Koneksi', err.message ?? 'Tidak dapat terhubung ke server.');
            });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Cancel ────────────────────────────────────────────────────────────────
    const handleCancel = () => openModal('confirm_cancel');

    // ── Helpers ───────────────────────────────────────────────────────────────
    const selectedStatus = STATUS_OPTIONS.find(o => o.value === status);
    const selectedFixing = FIXING_OPTIONS.find(o => o.value === fixing);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* ── Header ─────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.backBtn} activeOpacity={0.7}>
                    <FeatherIcon name="chevron-left" size={18} color="#64748b" />
                    <Text style={styles.backBtnText}>Kembali</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Formulir Laporan Rak</Text>
                <View style={{ width: 72 }} />
            </View>

            {/* ── Form Body ───────────────────────────────────────────────── */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Badge scanned / manual ──────────────────────── */}
                    {scannedSerial ? (
                        <View style={styles.scannedBadge}>
                            <FeatherIcon name="check-circle" size={14} color="#059669" />
                            <Text style={styles.scannedBadgeText}>
                                QR Terdeteksi:{' '}
                                <Text style={styles.scannedBadgeSerial}>{scannedSerial}</Text>
                            </Text>
                        </View>
                    ) : (
                        <View style={[styles.scannedBadge, styles.manualBadge]}>
                            <FeatherIcon name="edit-3" size={14} color="#d97706" />
                            <Text style={[styles.scannedBadgeText, { color: '#92400e' }]}>
                                Mode Input Manual
                            </Text>
                        </View>
                    )}

                    {/* ── Serial Number ─────────────────────────────── */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>
                            Serial Number <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 243EQ60HGX"
                            placeholderTextColor="#94a3b8"
                            value={serialNumber}
                            onChangeText={setSerialNumber}
                            autoCapitalize="characters"
                            editable={!scannedSerial}
                        />
                        {scannedSerial ? (
                            <Text style={styles.fieldHint}>
                                <FeatherIcon name="lock" size={10} color="#94a3b8" /> Terisi otomatis dari QR
                            </Text>
                        ) : null}
                    </View>

                    {/* ── Pelanggan — Search + Dropdown ─────────────── */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Pelanggan</Text>

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
                                        <ActivityIndicator size="small" color="#1952c8" />
                                    )}
                                </View>

                                {/* ✅ Tampilkan error koneksi / auth */}
                                {customerError && (
                                    <View style={styles.errorWrap}>
                                        <FeatherIcon name="wifi-off" size={13} color="#dc2626" />
                                        <Text style={styles.errorText}>{customerError}</Text>
                                    </View>
                                )}

                                {/* Dropdown hasil pencarian */}
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
                                                        <FeatherIcon name="user" size={12} color="#1952c8" />
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

                                {/* Pesan tidak ditemukan */}
                                {!customerLoading && !customerError && customerSearch.trim().length >= 2 && customers.length === 0 && (
                                    <View style={styles.notFoundWrap}>
                                        <FeatherIcon name="alert-circle" size={13} color="#94a3b8" />
                                        <Text style={styles.notFoundText}>Pelanggan tidak ditemukan</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>

                    {/* ── Nama Toko (store) ──────────────────────────── */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Nama Toko</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Identitas toko mitra..."
                            placeholderTextColor="#94a3b8"
                            value={namaToko}
                            onChangeText={setNamaToko}
                        />
                    </View>

                    {/* ── Row: Status + Fixing ───────────────────────── */}
                    <View style={styles.rowFields}>
                        <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.fieldLabel}>
                                Kondisi Rak <Text style={styles.required}>*</Text>
                            </Text>
                            <TouchableOpacity
                                onPress={() => setStatusPickerVisible(true)}
                                activeOpacity={0.8}
                                style={[
                                    styles.pickerBtn,
                                    selectedStatus && {
                                        borderColor: selectedStatus.borderColor,
                                        backgroundColor: selectedStatus.bgColor,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.pickerBtnText,
                                        selectedStatus && { color: selectedStatus.color, fontWeight: '700' },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {selectedStatus
                                        ? `${selectedStatus.emoji} ${selectedStatus.label}`
                                        : 'Pilih Status...'}
                                </Text>
                                <FeatherIcon name="chevron-down" size={14} color={selectedStatus?.color ?? '#94a3b8'} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.fieldLabel}>Keterangan Fixing</Text>
                            <TouchableOpacity
                                onPress={() => setFixingPickerVisible(true)}
                                activeOpacity={0.8}
                                style={[
                                    styles.pickerBtn,
                                    selectedFixing && {
                                        borderColor: selectedFixing.borderColor,
                                        backgroundColor: selectedFixing.bgColor,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.pickerBtnText,
                                        selectedFixing && { color: selectedFixing.color, fontWeight: '700' },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {selectedFixing
                                        ? `${selectedFixing.emoji} ${selectedFixing.label}`
                                        : 'Pilih Fixing...'}
                                </Text>
                                <FeatherIcon name="chevron-down" size={14} color={selectedFixing?.color ?? '#94a3b8'} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Foto Rak ──────────────────────────────────── */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Foto Rak (Dokumentasi)</Text>
                        <TouchableOpacity
                            onPress={pickImage}
                            activeOpacity={0.85}
                            style={[styles.photoPicker, fotoUri && styles.photoPickerFilled]}
                        >
                            {fotoUri ? (
                                <>
                                    <Image source={{ uri: fotoUri }} style={styles.photoPreview} />
                                    <TouchableOpacity
                                        onPress={() => setFotoUri(null)}
                                        style={styles.removePhotoBtn}
                                        activeOpacity={0.8}
                                    >
                                        <FeatherIcon name="trash-2" size={13} color="#fff" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View style={styles.photoPickerInner}>
                                    <View style={styles.cameraIconCircle}>
                                        <FeatherIcon name="camera" size={22} color="#1952c8" />
                                    </View>
                                    <Text style={styles.photoPickerText}>Ambil Foto Kondisi Rak</Text>
                                    <Text style={styles.photoPickerSub}>Ketuk untuk membuka kamera</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* ── GPS Row ───────────────────────────────────── */}
                    <View style={styles.rowFields}>
                        <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.fieldLabel}>
                                Latitude <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, styles.monoInput]}
                                placeholder="Klik GPS..."
                                placeholderTextColor="#94a3b8"
                                value={latitude}
                                keyboardType="numeric"
                                onChangeText={setLatitude}
                            />
                        </View>
                        <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.fieldLabel}>
                                Longitude <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[styles.input, styles.monoInput]}
                                placeholder="Klik GPS..."
                                placeholderTextColor="#94a3b8"
                                value={longitude}
                                keyboardType="numeric"
                                onChangeText={setLongitude}
                            />
                        </View>
                    </View>

                    {/* GPS Button */}
                    {/* GPS Button — disabled, hanya sebagai refresh manual jika diperlukan */}
                    <TouchableOpacity
                        onPress={getGPSLocation}
                        disabled={true}          // ✅ selalu disabled
                        activeOpacity={1}
                        style={[styles.gpsBtn, styles.gpsBtnDisabled]}  // ✅ style disabled
                    >
                        {loadingGPS ? (
                            <>
                                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.gpsBtnText}>Mendapatkan Sinyal GPS...</Text>
                            </>
                        ) : (
                            <>
                                <FeatherIcon name="map-pin" size={16} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.gpsBtnText}>
                                    {latitude ? '📍 GPS Terdeteksi Otomatis' : '📍 Mendeteksi GPS...'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* GPS result preview */}
                    {latitude !== '' && longitude !== '' && (
                        <View style={styles.gpsResult}>
                            <FeatherIcon name="navigation" size={12} color="#059669" />
                            <Text style={styles.gpsResultText}>
                                {parseFloat(latitude).toFixed(6)},{' '}
                                {parseFloat(longitude).toFixed(6)}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Sticky Bottom Buttons ──────────────────────────────────── */}
            <View style={[styles.stickyButtons, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    onPress={handleCancel}
                    activeOpacity={0.8}
                    style={styles.cancelBtn}
                    disabled={submitting}
                >
                    <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleUpdate}
                    activeOpacity={0.85}
                    style={[styles.updateBtn, submitting && { opacity: 0.7 }]}
                    disabled={submitting}
                >
                    <FeatherIcon name="save" size={15} color="#fff" style={{ marginRight: 7 }} />
                    <Text style={styles.updateBtnText}>Update 📄</Text>
                </TouchableOpacity>
            </View>

            {/* ── Status (Kondisi) Picker Modal ─────────────────────────── */}
            <Modal
                visible={statusPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setStatusPickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.pickerOverlay}
                    activeOpacity={1}
                    onPress={() => setStatusPickerVisible(false)}
                >
                    <View style={styles.pickerSheet}>
                        <View style={styles.pickerHandle} />
                        <Text style={styles.pickerSheetTitle}>Pilih Kondisi Rak</Text>
                        {STATUS_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => { setStatus(opt.value); setStatusPickerVisible(false); }}
                                activeOpacity={0.8}
                                style={[
                                    styles.pickerOption,
                                    status === opt.value && {
                                        backgroundColor: opt.bgColor,
                                        borderColor: opt.borderColor,
                                    },
                                ]}
                            >
                                <Text style={styles.pickerOptionEmoji}>{opt.emoji}</Text>
                                <Text style={[styles.pickerOptionText, { color: opt.color }]}>
                                    {opt.label}
                                </Text>
                                {status === opt.value && (
                                    <FeatherIcon name="check" size={16} color={opt.color} style={{ marginLeft: 'auto' }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Fixing Picker Modal ────────────────────────────────────── */}
            <Modal
                visible={fixingPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setFixingPickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.pickerOverlay}
                    activeOpacity={1}
                    onPress={() => setFixingPickerVisible(false)}
                >
                    <View style={styles.pickerSheet}>
                        <View style={styles.pickerHandle} />
                        <Text style={styles.pickerSheetTitle}>Keterangan Fixing</Text>
                        {FIXING_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => { setFixing(opt.value); setFixingPickerVisible(false); }}
                                activeOpacity={0.8}
                                style={[
                                    styles.pickerOption,
                                    fixing === opt.value && {
                                        backgroundColor: opt.bgColor,
                                        borderColor: opt.borderColor,
                                    },
                                ]}
                            >
                                <Text style={styles.pickerOptionEmoji}>{opt.emoji}</Text>
                                <Text style={[styles.pickerOptionText, { color: opt.color }]}>
                                    {opt.label}
                                </Text>
                                {fixing === opt.value && (
                                    <FeatherIcon name="check" size={16} color={opt.color} style={{ marginLeft: 'auto' }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Modals: scanning / success / confirm_cancel ────────────── */}
            <Modal visible={modalType !== null} transparent animationType="none">
                <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
                    <Animated.View style={[styles.modalCard, { transform: [{ scale: modalScale }] }]}>

                        {modalType === 'scanning' && (
                            <>
                                <View style={styles.scanningIconWrap}>
                                    <SpinnerIcon size={30} color="#10b981" />
                                </View>
                                <Animated.Text style={[styles.modalTitle, { opacity: pulseAnim }]}>
                                    Menyimpan Data Rak...
                                </Animated.Text>
                                <Text style={styles.modalSubtitle}>
                                    Menghubungkan ke server dan menyimpan kondisi rak
                                </Text>
                            </>
                        )}

                        {modalType === 'success' && (
                            <>
                                <SuccessIcon />
                                <Text style={styles.modalTitle}>Data Berhasil Disimpan</Text>
                                <Text style={styles.modalSubtitle}>
                                    Kondisi rak{serialNumber ? ` ${serialNumber}` : ''} berhasil dilaporkan.
                                </Text>
                                {selectedCustomer && (
                                    <View style={styles.successDetailChip}>
                                        <FeatherIcon name="user" size={11} color="#059669" />
                                        <Text style={styles.successDetailText}>{selectedCustomer.nama}</Text>
                                    </View>
                                )}
                                {namaToko !== '' && (
                                    <View style={[styles.successDetailChip, { marginTop: 6 }]}>
                                        <FeatherIcon name="map-pin" size={11} color="#059669" />
                                        <Text style={styles.successDetailText}>{namaToko}</Text>
                                    </View>
                                )}
                            </>
                        )}

                        {modalType === 'confirm_cancel' && (
                            <>
                                <View style={styles.warnIconWrap}>
                                    <FeatherIcon name="alert-triangle" size={28} color="#d97706" />
                                </View>
                                <Text style={styles.modalTitle}>Batalkan Laporan?</Text>
                                <Text style={styles.modalSubtitle}>
                                    Isian form akan hilang dan laporan tidak tersimpan.
                                </Text>
                                <View style={styles.confirmButtons}>
                                    <TouchableOpacity
                                        onPress={() => closeModal()}
                                        activeOpacity={0.8}
                                        style={[styles.confirmBtn, styles.confirmBtnCancel]}
                                    >
                                        <Text style={styles.confirmBtnCancelText}>Lanjut Isi</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => closeModal(() => navigation.goBack())}
                                        activeOpacity={0.8}
                                        style={[styles.confirmBtn, styles.confirmBtnDanger]}
                                    >
                                        <Text style={styles.confirmBtnDangerText}>Ya, Batalkan</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </Animated.View>
                </Animated.View>
            </Modal>
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const NAVY = '#1045ab';
const NAVY2 = '#1952c8';
const GREEN = '#00a65a';

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f7f8fc' },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0',
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 4 },
    backBtnText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
    headerTitle: { fontSize: 14, fontWeight: '700', color: NAVY, letterSpacing: 0.2 },

    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 14 },

    scannedBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: '#d1fae5', borderWidth: 0.5, borderColor: '#6ee7b7',
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16,
    },
    manualBadge: { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
    scannedBadgeText: { fontSize: 12, color: '#065f46', fontWeight: '600' },
    scannedBadgeSerial: {
        fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },

    fieldGroup: { marginBottom: 14 },
    fieldLabel: {
        fontSize: 11, fontWeight: '700', color: '#475569',
        letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6,
    },
    fieldHint: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
    required: { color: '#ef4444', fontWeight: '900' },
    rowFields: { flexDirection: 'row' },

    input: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
        fontSize: 13, color: '#1e293b', fontWeight: '600',
    },
    monoInput: {
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        fontSize: 12,
    },

    searchInputWrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1',
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 13, color: '#1e293b', fontWeight: '600' },

    // ✅ Tambahan style untuk error
    errorWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 6, paddingHorizontal: 4,
    },
    errorText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },

    dropdown: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
        borderRadius: 12, marginTop: 4, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 11, gap: 10,
    },
    dropdownItemIcon: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center',
    },
    dropdownItemName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
    dropdownItemMeta: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
    dropdownSep: { height: 0.5, backgroundColor: '#f1f5f9', marginLeft: 52 },

    notFoundWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 8, paddingHorizontal: 4,
    },
    notFoundText: { fontSize: 12, color: '#94a3b8' },

    customerChip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
        borderRadius: 12, padding: 12, gap: 10,
    },
    customerChipName: { fontSize: 13, fontWeight: '700', color: '#1e40af' },
    customerChipMeta: { fontSize: 10, color: '#3b82f6', marginTop: 2 },
    customerChipRemove: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center',
    },

    pickerBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1',
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
    },
    pickerBtnText: { fontSize: 12, color: '#94a3b8', fontWeight: '600', flex: 1 },

    photoPicker: {
        height: 130, backgroundColor: '#f1f5f9',
        borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#94a3b8',
        borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
    },
    photoPickerFilled: { borderStyle: 'solid', borderColor: '#cbd5e1' },
    photoPickerInner: { alignItems: 'center', gap: 6 },
    cameraIconCircle: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
        justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    },
    photoPickerText: { fontSize: 13, fontWeight: '700', color: '#334155' },
    photoPickerSub: { fontSize: 11, color: '#94a3b8' },
    photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    removePhotoBtn: {
        position: 'absolute', top: 8, right: 8,
        backgroundColor: '#ef4444', width: 28, height: 28,
        borderRadius: 14, justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
    },

    gpsBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: NAVY2, borderRadius: 14, paddingVertical: 13, marginBottom: 10,
        shadowColor: NAVY2, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    gpsBtnLoading: { opacity: 0.75 },
    gpsBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    gpsResult: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#ecfdf5', borderWidth: 0.5, borderColor: '#a7f3d0',
        borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 4,
    },
    gpsResultText: {
        fontSize: 11, color: '#065f46', fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },

    stickyButtons: {
        flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12,
        backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#e2e8f0', gap: 10,
    },
    cancelBtn: {
        flex: 1, backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5',
        borderRadius: 14, paddingVertical: 13, alignItems: 'center',
    },
    cancelBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '700' },
    updateBtn: {
        flex: 1.6, flexDirection: 'row', backgroundColor: GREEN,
        borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
        shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    updateBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

    pickerOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
    },
    pickerSheet: {
        backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingBottom: 36, paddingTop: 10,
    },
    pickerHandle: {
        width: 40, height: 4, backgroundColor: '#e2e8f0',
        borderRadius: 2, alignSelf: 'center', marginBottom: 16,
    },
    pickerSheetTitle: {
        fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 14, textAlign: 'center',
    },
    pickerOption: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 13, paddingHorizontal: 14,
        borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8, gap: 10,
    },
    pickerOptionEmoji: { fontSize: 18 },
    pickerOptionText: { fontSize: 13, fontWeight: '700' },

    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(7, 11, 25, 0.75)',
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32,
    },
    modalCard: {
        backgroundColor: '#0f172a', borderRadius: 28, padding: 28,
        width: '100%', maxWidth: 320, alignItems: 'center',
        borderWidth: 1, borderColor: '#1e293b',
        shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
    },
    modalTitle: {
        fontSize: 16, fontWeight: '800', color: '#fff',
        textAlign: 'center', letterSpacing: 0.3, marginTop: 4, marginBottom: 8,
    },
    modalSubtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 18 },
    scanningIconWrap: {
        width: 68, height: 68, borderRadius: 34,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    },
    successIconWrap: {
        width: 68, height: 68, borderRadius: 34,
        backgroundColor: '#ecfdf5', borderWidth: 3, borderColor: '#d1fae5',
        justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    },
    successDetailChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#ecfdf5', borderWidth: 0.5, borderColor: '#a7f3d0',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginTop: 12,
    },
    successDetailText: { fontSize: 11, color: '#065f46', fontWeight: '700' },
    warnIconWrap: {
        width: 68, height: 68, borderRadius: 34,
        backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#fde68a',
        justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    },
    confirmButtons: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
    confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    confirmBtnCancel: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
    confirmBtnCancelText: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
    confirmBtnDanger: { backgroundColor: '#ef4444' },
    confirmBtnDangerText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    // Di StyleSheet.create — tambahkan setelah gpsBtnLoading
    gpsBtnDisabled: {
        opacity: 0.6,
        backgroundColor: '#64748b',  // abu-abu saat disabled
    },
});

export default ShelfFormScreen;