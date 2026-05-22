import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// ─── Types ────────────────────────────────────────────────────────────────────

type RootStackParamList = {
    Home: undefined;
    ShelfScanner: undefined;
    ShelfForm: {
        scannedSerial?: string;
        scannedStore?: { pelanggan: string; namaToko: string };
        manualMode?: boolean;
    };
};

type ShelfFormNavigationProp = StackNavigationProp<RootStackParamList, 'ShelfForm'>;
type ShelfFormRouteProp = RouteProp<RootStackParamList, 'ShelfForm'>;

interface ShelfFormScreenProps {
    navigation: ShelfFormNavigationProp;
    route: ShelfFormRouteProp;
}

type KondisiRak = 'Sangat Baik' | 'Baik' | 'Perlu Perbaikan' | 'Rusak Berat' | '';

interface KondisiOption {
    value: KondisiRak;
    label: string;
    emoji: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KONDISI_OPTIONS: KondisiOption[] = [
    { value: 'Sangat Baik',      label: 'Sangat Baik',    emoji: '👍', color: '#059669', bgColor: '#d1fae5', borderColor: '#6ee7b7' },
    { value: 'Baik',             label: 'Baik OK',        emoji: '👌', color: '#0284c7', bgColor: '#e0f2fe', borderColor: '#7dd3fc' },
    { value: 'Perlu Perbaikan',  label: 'Perlu Perbaikan',emoji: '⚠️', color: '#d97706', bgColor: '#fef3c7', borderColor: '#fcd34d' },
    { value: 'Rusak Berat',      label: 'Rusak Berat',    emoji: '⚡', color: '#dc2626', bgColor: '#fee2e2', borderColor: '#fca5a5' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Rotating spinner — meniru Loader2 dari Lucide */
const SpinnerIcon: React.FC<{ size?: number; color?: string }> = ({
    size = 30,
    color = '#10b981',
}) => {
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const rotate = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={{ transform: [{ rotate }] }}>
            <FeatherIcon name="loader" size={size} color={color} />
        </Animated.View>
    );
};

/** CheckCircle success icon dengan scale-in animation */
const SuccessIcon: React.FC = () => {
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
        }).start();
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
    const [pelanggan, setPelanggan]           = useState(scannedStore?.pelanggan ?? '');
    const [namaToko, setNamaToko]             = useState(scannedStore?.namaToko ?? '');
    const [kondisiRak, setKondisiRak]         = useState<KondisiRak>('');
    const [serialNumber, setSerialNumber]     = useState(scannedSerial ?? '');
    const [fotoUri, setFotoUri]               = useState<string | null>(null);
    const [latitude, setLatitude]             = useState('');
    const [longitude, setLongitude]           = useState('');

    // ── UI state ──────────────────────────────────────────────────────────────
    const [loadingGPS, setLoadingGPS]                 = useState(false);
    const [kondisiPickerVisible, setKondisiPickerVisible] = useState(false);

    // Modal states
    const [modalType, setModalType]   = useState<'scanning' | 'success' | 'confirm_cancel' | null>(null);
    const modalOpacity = useRef(new Animated.Value(0)).current;
    const modalScale   = useRef(new Animated.Value(0.9)).current;

    // Pulse animation for scanning text
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (modalType === 'scanning') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 0.5, duration: 700, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [modalType]);

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const openModal = (type: typeof modalType) => {
        setModalType(type);
        modalOpacity.setValue(0);
        modalScale.setValue(0.88);
        Animated.parallel([
            Animated.timing(modalOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.spring(modalScale,   { toValue: 1, friction: 7, tension: 120, useNativeDriver: true }),
        ]).start();
    };

    const closeModal = (callback?: () => void) => {
        Animated.parallel([
            Animated.timing(modalOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(modalScale,   { toValue: 0.9, duration: 180, useNativeDriver: true }),
        ]).start(() => {
            setModalType(null);
            callback?.();
        });
    };

    // ── GPS ───────────────────────────────────────────────────────────────────
    const getGPSLocation = async () => {
        setLoadingGPS(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin posisi GPS untuk memetakan rak.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setLatitude(loc.coords.latitude.toString());
            setLongitude(loc.coords.longitude.toString());
        } catch (error: any) {
            Alert.alert('Gagal Mengambil Lokasi', error.message ?? 'Terjadi kesalahan.');
        } finally {
            setLoadingGPS(false);
        }
    };

    // ── Camera / Image ────────────────────────────────────────────────────────
    const pickImage = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin kamera untuk merekam kondisi fisik rak.');
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

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleUpdate = () => {
        if (!pelanggan || !namaToko || !kondisiRak || !serialNumber || !latitude || !longitude) {
            Alert.alert('Peringatan', 'Harap lengkapi seluruh field bertanda (*) sebelum menyimpan.');
            return;
        }

        // 1. Tampilkan scanning modal
        openModal('scanning');

        // 2. Simulasi API call 1.8 detik
        setTimeout(() => {
            closeModal(() => {
                // 3. Tampilkan success modal
                openModal('success');

                // 4. Auto close + navigate setelah 2 detik
                setTimeout(() => {
                    closeModal(() => navigation.navigate('Home'));
                }, 2200);
            });
        }, 1800);
    };

    // ── Cancel confirm ────────────────────────────────────────────────────────
    const handleCancel = () => openModal('confirm_cancel');

    // ── Kondisi selected style helper ─────────────────────────────────────────
    const selectedKondisi = KONDISI_OPTIONS.find(o => o.value === kondisiRak);

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
                    {/* Scanned Serial badge — muncul jika dari QR scanner */}
                    {scannedSerial ? (
                        <View style={styles.scannedBadge}>
                            <FeatherIcon name="check-circle" size={14} color="#059669" />
                            <Text style={styles.scannedBadgeText}>
                                QR Terdeteksi: <Text style={styles.scannedBadgeSerial}>{scannedSerial}</Text>
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

                    {/* ── Pelanggan ─────────────────────────────────────── */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>
                            Pelanggan <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nama pelanggan / perusahaan toko..."
                            placeholderTextColor="#94a3b8"
                            value={pelanggan}
                            onChangeText={setPelanggan}
                        />
                    </View>

                    {/* ── Nama Toko ─────────────────────────────────────── */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>
                            Nama Toko <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, !scannedStore && styles.inputMuted]}
                            placeholder="Identitas toko mitra..."
                            placeholderTextColor="#94a3b8"
                            value={namaToko}
                            onChangeText={setNamaToko}
                        />
                    </View>

                    {/* ── Row: Kondisi + Serial ─────────────────────────── */}
                    <View style={styles.rowFields}>
                        {/* Kondisi Rak — custom picker */}
                        <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.fieldLabel}>
                                Kondisi Rak <Text style={styles.required}>*</Text>
                            </Text>
                            <TouchableOpacity
                                onPress={() => setKondisiPickerVisible(true)}
                                activeOpacity={0.8}
                                style={[
                                    styles.pickerBtn,
                                    selectedKondisi && {
                                        borderColor: selectedKondisi.borderColor,
                                        backgroundColor: selectedKondisi.bgColor,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.pickerBtnText,
                                        selectedKondisi && { color: selectedKondisi.color, fontWeight: '700' },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {selectedKondisi
                                        ? `${selectedKondisi.emoji} ${selectedKondisi.label}`
                                        : 'Pilih Status...'}
                                </Text>
                                <FeatherIcon
                                    name="chevron-down"
                                    size={14}
                                    color={selectedKondisi?.color ?? '#94a3b8'}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Serial Number */}
                        <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.fieldLabel}>Serial Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 243EQ60HGX"
                                placeholderTextColor="#94a3b8"
                                value={serialNumber}
                                onChangeText={setSerialNumber}
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>

                    {/* ── Foto Rak ──────────────────────────────────────── */}
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
                                    {/* Remove button */}
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

                    {/* ── GPS Row ───────────────────────────────────────── */}
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
                    <TouchableOpacity
                        onPress={getGPSLocation}
                        disabled={loadingGPS}
                        activeOpacity={0.85}
                        style={[styles.gpsBtn, loadingGPS && styles.gpsBtnLoading]}
                    >
                        {loadingGPS ? (
                            <>
                                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.gpsBtnText}>Mendapatkan Sinyal GPS...</Text>
                            </>
                        ) : (
                            <>
                                <FeatherIcon name="map-pin" size={16} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.gpsBtnText}>📍 Klik Deteksi GPS Koordinat</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* GPS result preview */}
                    {latitude !== '' && longitude !== '' && (
                        <View style={styles.gpsResult}>
                            <FeatherIcon name="navigation" size={12} color="#059669" />
                            <Text style={styles.gpsResultText}>
                                {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Sticky Bottom Buttons ──────────────────────────────────── */}
            <View style={[styles.stickyButtons, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity onPress={handleCancel} activeOpacity={0.8} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpdate} activeOpacity={0.85} style={styles.updateBtn}>
                    <FeatherIcon name="save" size={15} color="#fff" style={{ marginRight: 7 }} />
                    <Text style={styles.updateBtnText}>Update 📄</Text>
                </TouchableOpacity>
            </View>

            {/* ── Kondisi Picker Modal ───────────────────────────────────── */}
            <Modal
                visible={kondisiPickerVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setKondisiPickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.pickerOverlay}
                    activeOpacity={1}
                    onPress={() => setKondisiPickerVisible(false)}
                >
                    <View style={styles.pickerSheet}>
                        <View style={styles.pickerHandle} />
                        <Text style={styles.pickerSheetTitle}>Pilih Kondisi Rak</Text>
                        {KONDISI_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                onPress={() => {
                                    setKondisiRak(opt.value);
                                    setKondisiPickerVisible(false);
                                }}
                                activeOpacity={0.8}
                                style={[
                                    styles.pickerOption,
                                    kondisiRak === opt.value && {
                                        backgroundColor: opt.bgColor,
                                        borderColor: opt.borderColor,
                                    },
                                ]}
                            >
                                <Text style={styles.pickerOptionEmoji}>{opt.emoji}</Text>
                                <Text style={[styles.pickerOptionText, { color: opt.color }]}>
                                    {opt.label}
                                </Text>
                                {kondisiRak === opt.value && (
                                    <FeatherIcon name="check" size={16} color={opt.color} style={{ marginLeft: 'auto' }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Custom Modals: Scanning / Success / Confirm Cancel ─────── */}
            <Modal visible={modalType !== null} transparent animationType="none">
                <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
                    <Animated.View
                        style={[styles.modalCard, { transform: [{ scale: modalScale }] }]}
                    >
                        {/* ── SCANNING modal ──────────────────────────── */}
                        {modalType === 'scanning' && (
                            <>
                                <View style={styles.scanningIconWrap}>
                                    <SpinnerIcon size={30} color="#10b981" />
                                </View>
                                <Animated.Text style={[styles.modalTitle, { opacity: pulseAnim }]}>
                                    Menyimpan Data Rak...
                                </Animated.Text>
                                <Text style={styles.modalSubtitle}>
                                    Menghubungkan Database CBB &amp; Mendecode Serial Elektronik
                                </Text>
                            </>
                        )}

                        {/* ── SUCCESS modal ───────────────────────────── */}
                        {modalType === 'success' && (
                            <>
                                <SuccessIcon />
                                <Text style={styles.modalTitle}>Data Berhasil Terupdate</Text>
                                <Text style={styles.modalSubtitle}>
                                    Data rak{serialNumber ? ` ${serialNumber}` : ''} dilaporkan di koordinat yang sesuai.
                                </Text>
                                {namaToko !== '' && (
                                    <View style={styles.successDetailChip}>
                                        <FeatherIcon name="map-pin" size={11} color="#059669" />
                                        <Text style={styles.successDetailText}>{namaToko}</Text>
                                    </View>
                                )}
                            </>
                        )}

                        {/* ── CONFIRM CANCEL modal ────────────────────── */}
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

const NAVY   = '#1045ab';
const NAVY2  = '#1952c8';
const GREEN  = '#00a65a';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f7f8fc',
    },

    // ── Header ───────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    backBtnText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: NAVY,
        letterSpacing: 0.2,
    },

    // ── Scroll ────────────────────────────────────────────────────────────────
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 14 },

    // Scanned badge
    scannedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: '#d1fae5',
        borderWidth: 0.5,
        borderColor: '#6ee7b7',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 16,
    },
    manualBadge: {
        backgroundColor: '#fef3c7',
        borderColor: '#fcd34d',
    },
    scannedBadgeText: {
        fontSize: 12,
        color: '#065f46',
        fontWeight: '600',
    },
    scannedBadgeSerial: {
        fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },

    // ── Field ─────────────────────────────────────────────────────────────────
    fieldGroup: { marginBottom: 14 },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    required: { color: '#ef4444', fontWeight: '900' },
    rowFields: { flexDirection: 'row' },

    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 13,
        color: '#1e293b',
        fontWeight: '600',
    },
    inputMuted: {
        backgroundColor: '#f1f5f9',
        color: '#64748b',
    },
    monoInput: {
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        fontSize: 12,
    },

    // Kondisi picker button
    pickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 11,
    },
    pickerBtnText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        flex: 1,
    },

    // ── Photo picker ──────────────────────────────────────────────────────────
    photoPicker: {
        height: 130,
        backgroundColor: '#f1f5f9',
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: '#94a3b8',
        borderRadius: 14,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPickerFilled: {
        borderStyle: 'solid',
        borderColor: '#cbd5e1',
    },
    photoPickerInner: { alignItems: 'center', gap: 6 },
    cameraIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    photoPickerText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    photoPickerSub: {
        fontSize: 11,
        color: '#94a3b8',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removePhotoBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#ef4444',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },

    // ── GPS ───────────────────────────────────────────────────────────────────
    gpsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: NAVY2,
        borderRadius: 14,
        paddingVertical: 13,
        marginBottom: 10,
        shadowColor: NAVY2,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    gpsBtnLoading: { opacity: 0.75 },
    gpsBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    gpsResult: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ecfdf5',
        borderWidth: 0.5,
        borderColor: '#a7f3d0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginBottom: 4,
    },
    gpsResultText: {
        fontSize: 11,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        color: '#065f46',
        fontWeight: '600',
    },

    // ── Sticky bottom buttons ─────────────────────────────────────────────────
    stickyButtons: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#fca5a5',
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#dc2626',
        fontSize: 13,
        fontWeight: '700',
    },
    updateBtn: {
        flex: 1.6,
        flexDirection: 'row',
        backgroundColor: GREEN,
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    updateBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '800',
    },

    // ── Kondisi picker sheet ──────────────────────────────────────────────────
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    pickerSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 36,
        paddingTop: 10,
    },
    pickerHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    pickerSheetTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 14,
        textAlign: 'center',
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 8,
        gap: 10,
    },
    pickerOptionEmoji: { fontSize: 18 },
    pickerOptionText: { fontSize: 13, fontWeight: '700' },

    // ── Custom Modals ─────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(7, 11, 25, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    modalCard: {
        backgroundColor: '#0f172a',
        borderRadius: 28,
        padding: 28,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1e293b',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 0.3,
        marginTop: 4,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 18,
    },

    // Scanning icon wrap
    scanningIconWrap: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },

    // Success icon wrap
    successIconWrap: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#ecfdf5',
        borderWidth: 3,
        borderColor: '#d1fae5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },

    successDetailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#ecfdf5',
        borderWidth: 0.5,
        borderColor: '#a7f3d0',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginTop: 12,
    },
    successDetailText: {
        fontSize: 11,
        color: '#065f46',
        fontWeight: '700',
    },

    // Warn icon wrap
    warnIconWrap: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#fef3c7',
        borderWidth: 2,
        borderColor: '#fde68a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },

    // Confirm cancel buttons
    confirmButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
        width: '100%',
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmBtnCancel: {
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
    },
    confirmBtnCancelText: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: '700',
    },
    confirmBtnDanger: {
        backgroundColor: '#ef4444',
    },
    confirmBtnDangerText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});

export default ShelfFormScreen;