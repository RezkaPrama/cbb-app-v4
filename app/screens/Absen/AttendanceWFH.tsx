import React, { useState, useEffect, useCallback, JSX } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    ActivityIndicator,
    Modal,
    RefreshControl,
    ViewStyle,
    TextStyle,
    ImageStyle,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS } from '../../constants/theme';
import { getDataLara } from '../../utils/asyncStorage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ButtonLight from '../../components/Button/ButtonLight';

// Types
type WorkMode = 'WFH' | 'WFO';

interface UserBranch {
    id: number;
    name?: string;
}

interface UserPosition {
    id: number;
    name?: string;
}

interface UserDepartment {
    id: number;
    name?: string;
}

interface UserDetails {
    id: number;
    name: string;
    username?: string;
    email?: string;
    branch_id?: number;
    branch?: UserBranch;
    position?: UserPosition;
    department?: UserDepartment;
}

interface AttendanceData {
    check_in_time?: string;
    check_out_time?: string;
    status?: string;
    work_mode?: string;
}

interface AttendanceStatusResponse {
    success: boolean;
    message?: string;
    data?: {
        has_checked_in: boolean;
        has_checked_out: boolean;
        can_check_in: boolean;
        can_check_out: boolean;
        attendance?: AttendanceData;
    };
}

interface CheckInOutResponse {
    success: boolean;
    message?: string;
    data?: {
        attendance?: AttendanceData;
    };
    errors?: Record<string, string | string[]>;
}

type RootStackParamList = {
    AttendanceWFH: undefined;
    Login: undefined;
};

type AttendanceWFHNavigationProp = StackNavigationProp<RootStackParamList, 'AttendanceWFH'>;

interface AttendanceWFHProps {
    navigation: AttendanceWFHNavigationProp;
}

const AttendanceWFH: React.FC<AttendanceWFHProps> = ({ navigation }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [status, setStatus] = useState<AttendanceStatusResponse['data'] | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [selectedCheckoutPhoto, setSelectedCheckoutPhoto] = useState<string | null>(null);
    const [workMode, setWorkMode] = useState<WorkMode>('WFH');
    const [notes, setNotes] = useState<string>('');
    const [showModeModal, setShowModeModal] = useState<boolean>(false);
    const [currentAction, setCurrentAction] = useState<'check-in' | 'check-out' | null>(null);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [token, setToken] = useState<string>('');
    const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

    const { colors } = useTheme();

    // Fetch token and user details on mount
    useEffect(() => {
        const fetchData = async (): Promise<void> => {
            try {
                const storedToken = await getDataLara<string>('tokenUser');
                const storedUserDetails = await getDataLara<UserDetails>('dataDetailUser');

                if (storedToken && storedUserDetails) {
                    setUserDetails(storedUserDetails);
                    setToken(storedToken);
                } else {
                    console.warn('No token or user details found in storage');
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Data user tidak ditemukan',
                    });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Gagal memuat data user',
                });
            }
        };
        fetchData();
    }, []);

    // Request camera permission
    const requestCameraPermission = async (): Promise<boolean> => {
        try {
            const { status } = await Camera.requestCameraPermissionsAsync();
            const isGranted = status === 'granted';
            setCameraPermission(isGranted);

            if (!isGranted) {
                Alert.alert(
                    'Izin Kamera Diperlukan',
                    'Aplikasi memerlukan izin akses kamera untuk foto selfie saat absensi.',
                    [{ text: 'OK' }]
                );
            }

            return isGranted;
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Gagal meminta izin kamera',
            });
            return false;
        }
    };

    // Open camera
    const openCamera = async (isCheckout: boolean = false): Promise<void> => {
        try {
            const hasPermission = cameraPermission || (await requestCameraPermission());

            if (!hasPermission) {
                Alert.alert('Izin Kamera Ditolak', 'Aplikasi memerlukan izin kamera.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
                cameraType: ImagePicker.CameraType.front, // ✅ Gunakan dari ImagePicker namespace
                exif: false,
            });

            if (result.canceled) {
                return;
            }

            if (result.assets && result.assets.length > 0) {
                const photoUri = result.assets[0].uri;

                if (isCheckout) {
                    setSelectedCheckoutPhoto(photoUri);
                } else {
                    setSelectedPhoto(photoUri);
                }

                Toast.show({
                    type: 'success',
                    text1: 'Foto Berhasil',
                    text2: `Foto selfie ${isCheckout ? 'check-out' : 'check-in'} berhasil diambil`,
                });
            }
        } catch (error: any) {
            console.error('Error opening camera:', error);

            let errorMessage = 'Gagal membuka kamera';

            if (error.message?.includes('permission')) {
                errorMessage = 'Izin kamera ditolak';
            } else if (error.message?.includes('not available')) {
                errorMessage = 'Kamera tidak tersedia';
            }

            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: errorMessage,
            });
        }
    };

    // Remove photo
    const removePhoto = (isCheckout: boolean = false): void => {
        Alert.alert('Hapus Foto', 'Apakah Anda yakin ingin menghapus foto ini?', [
            { text: 'Batal', style: 'cancel' },
            {
                text: 'Hapus',
                style: 'destructive',
                onPress: () => {
                    if (isCheckout) {
                        setSelectedCheckoutPhoto(null);
                    } else {
                        setSelectedPhoto(null);
                    }
                    Toast.show({
                        type: 'info',
                        text1: 'Foto Dihapus',
                        text2: 'Foto selfie telah dihapus',
                    });
                },
            },
        ]);
    };

    // Load status absensi hari ini
    const loadTodayStatus = async (): Promise<void> => {
        if (!token || !userDetails?.id) {
            return;
        }

        try {
            setRefreshing(true);

            const response = await fetch('https://citrabarubusana.org/api/attendance/today', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userDetails.id,
                }),
            });

            const data: AttendanceStatusResponse = await response.json();

            if (data.success && data.data) {
                setStatus(data.data);
            }
        } catch (error) {
            console.error('Error loading status:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Gagal memuat status absensi',
            });
        } finally {
            setRefreshing(false);
        }
    };

    // Load status when component focused
    useFocusEffect(
        useCallback(() => {
            if (token && userDetails?.id) {
                loadTodayStatus();
            }
        }, [token, userDetails])
    );

    // Update current time every second
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    // Handle check in - langsung kirim tanpa modal
    // Handle check in - langsung kirim tanpa modal
    const handleCheckIn = async (): Promise<void> => {
        if (!selectedPhoto) {
            Alert.alert('Perhatian', 'Silakan ambil foto selfie terlebih dahulu');
            return;
        }

        if (!token) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Token tidak ditemukan',
            });
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();

            // Append photo
            const filename = selectedPhoto.split('/').pop() || `checkin_${Date.now()}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('photo', {
                uri: selectedPhoto,
                name: filename,
                type: type,
            } as any);

            // Append data - gunakan default WFH untuk check-in
            formData.append('work_mode', 'WFH');
            formData.append('notes', notes || 'Absen WFH - Check-in');

            // PENTING: Kirim null atau kosongkan untuk WFH (tidak perlu koordinat)
            // Jangan kirim string '0', biarkan kosong atau kirim null
            formData.append('address', 'WFH - Tidak Memerlukan Lokasi');

            const response = await fetch('https://citrabarubusana.org/api/attendance/check-in', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const responseData: CheckInOutResponse = await response.json();

            console.log('Check-in response:', responseData); // Untuk debugging

            if (response.ok && responseData.success) {
                setSelectedPhoto(null);
                setNotes('');

                Toast.show({
                    type: 'success',
                    text1: 'Berhasil',
                    text2: responseData.message || 'Check-in berhasil',
                });

                // Reload status
                await loadTodayStatus();
            } else {
                let errorMessage = 'Check-in gagal';

                if (responseData.message) {
                    errorMessage += ': ' + responseData.message;
                }

                if (responseData.errors) {
                    const errorKeys = Object.keys(responseData.errors);
                    if (errorKeys.length > 0) {
                        const firstError = responseData.errors[errorKeys[0]];
                        errorMessage += ': ' + (Array.isArray(firstError) ? firstError[0] : firstError);
                    }
                }

                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: errorMessage,
                });
            }
        } catch (error: any) {
            console.error('Error check-in:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Periksa koneksi internet Anda',
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle check out
    const handleCheckOut = (): void => {
        if (!selectedCheckoutPhoto) {
            Alert.alert('Perhatian', 'Silakan ambil foto selfie terlebih dahulu');
            return;
        }
        setCurrentAction('check-out');
        setShowModeModal(true);
    };

    // Proses absensi checkout (dengan modal pilih WFH/WFO)
    const processCheckout = async (): Promise<void> => {
        if (!selectedCheckoutPhoto || !token) {
            return;
        }

        try {
            setLoading(true);
            setShowModeModal(false);

            const formData = new FormData();

            // Append photo
            const filename = selectedCheckoutPhoto.split('/').pop() || `checkout_${Date.now()}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('photo', {
                uri: selectedCheckoutPhoto,
                name: filename,
                type: type,
            } as any);

            // Append work mode dan notes
            formData.append('work_mode', workMode);
            formData.append('notes', notes || `Absen ${workMode} - Check-out`);

            // Untuk WFH, kirim koordinat dummy (0,0) karena tidak validasi lokasi
            formData.append('latitude', '0');
            formData.append('longitude', '0');
            formData.append('address', `${workMode} - Tidak Memerlukan Lokasi`);

            const response = await fetch('https://citrabarubusana.org/api/attendance/check-out', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const responseData: CheckInOutResponse = await response.json();

            if (response.ok && responseData.success) {
                setSelectedCheckoutPhoto(null);
                setNotes('');

                Toast.show({
                    type: 'success',
                    text1: 'Berhasil',
                    text2: responseData.message || 'Check-out berhasil',
                });

                // Reload status
                await loadTodayStatus();
            } else {
                let errorMessage = 'Check-out gagal';

                if (responseData.message) {
                    errorMessage += ': ' + responseData.message;
                }

                if (responseData.errors) {
                    const errorKeys = Object.keys(responseData.errors);
                    if (errorKeys.length > 0) {
                        const firstError = responseData.errors[errorKeys[0]];
                        errorMessage += ': ' + (Array.isArray(firstError) ? firstError[0] : firstError);
                    }
                }

                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: errorMessage,
                });
            }
        } catch (error: any) {
            console.error('Error checkout:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Periksa koneksi internet Anda',
            });
        } finally {
            setLoading(false);
            setCurrentAction(null);
        }
    };

    // Render mode selection modal
    const renderModeModal = (): JSX.Element => (
        <Modal
            visible={showModeModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowModeModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Pilih Mode Kerja</Text>

                    <TouchableOpacity
                        style={[styles.modeButton, workMode === 'WFH' && styles.modeButtonActive]}
                        onPress={() => setWorkMode('WFH')}
                    >
                        <FeatherIcon name="home" size={24} color={workMode === 'WFH' ? '#fff' : COLORS.primary} />
                        <Text
                            style={[styles.modeButtonText, workMode === 'WFH' && styles.modeButtonTextActive]}
                        >
                            Work From Home
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.modeButton, workMode === 'WFO' && styles.modeButtonActive]}
                        onPress={() => setWorkMode('WFO')}
                    >
                        <FeatherIcon
                            name="briefcase"
                            size={24}
                            color={workMode === 'WFO' ? '#fff' : COLORS.primary}
                        />
                        <Text
                            style={[styles.modeButtonText, workMode === 'WFO' && styles.modeButtonTextActive]}
                        >
                            Work From Office
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => {
                                setShowModeModal(false);
                                setCurrentAction(null);
                            }}
                        >
                            <Text style={styles.modalCancelText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalConfirmButton} onPress={processCheckout}>
                            <Text style={styles.modalConfirmText}>Lanjutkan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (cameraPermission === false) {
        return (
            <View style={styles.loadingContainer}>
                <FeatherIcon name="camera-off" size={50} color={COLORS.danger} />
                <Text
                    style={[
                        FONTS.h3 as TextStyle,
                        { color: COLORS.title, marginTop: 10, textAlign: 'center' },
                    ]}
                >
                    Izin Kamera Diperlukan
                </Text>
                <Text
                    style={[
                        FONTS.fontSm as TextStyle,
                        { color: COLORS.text, marginTop: 10, textAlign: 'center', paddingHorizontal: 30 },
                    ]}
                >
                    Silakan berikan izin akses kamera di pengaturan aplikasi
                </Text>
                <View style={{ marginTop: 20, width: '80%' }}>
                    <ButtonLight
                        color={COLORS.primary}
                        title={'Minta Izin Lagi'}
                        onPress={requestCameraPermission}
                    />
                </View>
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={loadTodayStatus} />
                    }
                >
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={COLORS.white} />
                        </View>
                    )}

                    {/* Header */}
                    <View style={styles.header}>
                        <FeatherIcon name="calendar" size={32} color={COLORS.primary} />
                        <Text style={[FONTS.h3 as TextStyle, styles.headerTitle]}>Absensi WFH</Text>
                        <Text style={[FONTS.fontSm as TextStyle, styles.headerSubtitle]}>
                            {currentTime.toLocaleDateString('id-ID', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </Text>
                    </View>

                    {/* Status Card */}
                    {status && (
                        <View style={styles.statusCard}>
                            <View style={styles.statusRow}>
                                <View style={styles.statusItem}>
                                    <FeatherIcon
                                        name={status.has_checked_in ? 'check-circle' : 'clock'}
                                        size={24}
                                        color={status.has_checked_in ? COLORS.success : '#999'}
                                    />
                                    <Text style={[FONTS.fontXs as TextStyle, styles.statusLabel]}>Check In</Text>
                                    <Text style={[FONTS.fontMd as TextStyle, styles.statusTime]}>
                                        {status.attendance?.check_in_time || '-'}
                                    </Text>
                                </View>
                                <View style={styles.statusDivider} />
                                <View style={styles.statusItem}>
                                    <FeatherIcon
                                        name={status.has_checked_out ? 'check-circle' : 'clock'}
                                        size={24}
                                        color={status.has_checked_out ? COLORS.success : '#999'}
                                    />
                                    <Text style={[FONTS.fontXs as TextStyle, styles.statusLabel]}>Check Out</Text>
                                    <Text style={[FONTS.fontMd as TextStyle, styles.statusTime]}>
                                        {status.attendance?.check_out_time || '-'}
                                    </Text>
                                </View>
                            </View>
                            {status.attendance?.work_mode && (
                                <View style={styles.workModeInfo}>
                                    <FeatherIcon
                                        name={status.attendance.work_mode === 'WFH' ? 'home' : 'briefcase'}
                                        size={16}
                                        color={COLORS.primary}
                                    />
                                    <Text style={[FONTS.fontSm as TextStyle, styles.workModeText]}>
                                        {status.attendance.work_mode === 'WFH'
                                            ? 'Work From Home'
                                            : 'Work From Office'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Clock Display */}
                    <View style={styles.clockCard}>
                        <Text style={[FONTS.h1 as TextStyle, styles.clockTime]}>
                            {currentTime.toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false,
                            })}
                        </Text>
                    </View>

                    {/* Photo Section for Check-In */}
                    {status?.can_check_in && (
                        <View style={styles.photoSection}>
                            <Text style={[FONTS.fontMd as TextStyle, styles.sectionTitle]}>
                                Foto Selfie Check-In
                            </Text>
                            {selectedPhoto ? (
                                <View style={styles.photoPreviewContainer}>
                                    <Image source={{ uri: selectedPhoto }} style={styles.photoPreview} />
                                    <TouchableOpacity
                                        style={styles.removePhotoButton}
                                        onPress={() => removePhoto(false)}
                                    >
                                        <FeatherIcon name="x" size={20} color={COLORS.white} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.cameraButton} onPress={() => openCamera(false)}>
                                    <FeatherIcon name="camera" size={32} color={COLORS.primary} />
                                    <Text style={[FONTS.fontSm as TextStyle, styles.cameraButtonText]}>
                                        Ambil Foto Selfie
                                    </Text>
                                    <Text style={[FONTS.fontXs as TextStyle, styles.cameraButtonSubtext]}>
                                        (Wajib)
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Photo Section for Check-Out */}
                    {status?.can_check_out && (
                        <View style={styles.photoSection}>
                            <Text style={[FONTS.fontMd as TextStyle, styles.sectionTitle]}>
                                Foto Selfie Check-Out
                            </Text>
                            {selectedCheckoutPhoto ? (
                                <View style={styles.photoPreviewContainer}>
                                    <Image source={{ uri: selectedCheckoutPhoto }} style={styles.photoPreview} />
                                    <TouchableOpacity
                                        style={styles.removePhotoButton}
                                        onPress={() => removePhoto(true)}
                                    >
                                        <FeatherIcon name="x" size={20} color={COLORS.white} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.cameraButton} onPress={() => openCamera(true)}>
                                    <FeatherIcon name="camera" size={32} color={COLORS.danger} />
                                    <Text style={[FONTS.fontSm as TextStyle, styles.cameraButtonTextDanger]}>
                                        Ambil Foto Selfie
                                    </Text>
                                    <Text style={[FONTS.fontXs as TextStyle, styles.cameraButtonSubtext]}>
                                        (Wajib untuk Check-Out)
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionSection}>
                        {status?.can_check_in && (
                            <ButtonLight
                                color={selectedPhoto ? COLORS.success : COLORS.secondary}
                                title={'Check In'}
                                onPress={handleCheckIn}
                                disabled={!selectedPhoto || loading}
                            />
                        )}

                        {status?.can_check_out && (
                            <ButtonLight
                                color={selectedCheckoutPhoto ? COLORS.danger : COLORS.secondary}
                                title={'Check Out'}
                                onPress={handleCheckOut}
                                disabled={!selectedCheckoutPhoto || loading}
                            />
                        )}

                        {!status?.can_check_in && !status?.can_check_out && (
                            <View style={styles.completeCard}>
                                <FeatherIcon name="check-circle" size={48} color={COLORS.success} />
                                <Text style={[FONTS.h4 as TextStyle, styles.completeText]}>
                                    Absensi hari ini sudah lengkap
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Info Section */}
                    <View style={styles.infoCard}>
                        <FeatherIcon name="info" size={20} color={COLORS.primary} />
                        <Text style={[FONTS.fontXs as TextStyle, styles.infoText]}>
                            Absensi WFH tidak memerlukan validasi lokasi. Cukup ambil foto selfie dan pilih
                            mode kerja Anda.
                        </Text>
                    </View>
                </ScrollView>

                {renderModeModal()}
                <Toast />
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.backgroundColor,
    } as ViewStyle,
    contentContainer: {
        paddingBottom: 30,
    } as ViewStyle,
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundColor,
        paddingHorizontal: 20,
    } as ViewStyle,
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    } as ViewStyle,
    header: {
        backgroundColor: COLORS.white,
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    } as ViewStyle,
    headerTitle: {
        color: COLORS.title,
        marginTop: 10,
    } as TextStyle,
    headerSubtitle: {
        color: COLORS.text,
        marginTop: 5,
    } as TextStyle,
    statusCard: {
        backgroundColor: COLORS.white,
        margin: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    } as ViewStyle,
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    } as ViewStyle,
    statusItem: {
        alignItems: 'center',
        flex: 1,
    } as ViewStyle,
    statusDivider: {
        width: 1,
        backgroundColor: '#e0e0e0',
    } as ViewStyle,
    statusLabel: {
        color: '#666',
        marginTop: 8,
    } as TextStyle,
    statusTime: {
        fontWeight: 'bold',
        color: COLORS.title,
        marginTop: 4,
    } as TextStyle,
    workModeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    } as ViewStyle,
    workModeText: {
        color: COLORS.primary,
        marginLeft: 8,
        fontWeight: '600',
    } as TextStyle,
    clockCard: {
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    } as ViewStyle,
    clockTime: {
        color: COLORS.primary,
        fontWeight: 'bold',
    } as TextStyle,
    photoSection: {
        margin: 16,
    } as ViewStyle,
    sectionTitle: {
        fontWeight: '600',
        color: COLORS.title,
        marginBottom: 12,
    } as TextStyle,
    cameraButton: {
        width: '100%',
        height: 150,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 122, 255, 0.05)',
    } as ViewStyle,
    cameraButtonText: {
        marginTop: 12,
        color: COLORS.primary,
    } as TextStyle,
    cameraButtonTextDanger: {
        marginTop: 12,
        color: COLORS.danger,
    } as TextStyle,
    cameraButtonSubtext: {
        color: COLORS.text,
        marginTop: 4,
    } as TextStyle,
    photoPreviewContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    } as ViewStyle,
    photoPreview: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    } as ImageStyle,
    removePhotoButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: COLORS.danger,
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    } as ViewStyle,
    actionSection: {
        margin: 16,
    } as ViewStyle,
    completeCard: {
        backgroundColor: COLORS.white,
        padding: 32,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    } as ViewStyle,
    completeText: {
        color: COLORS.success,
        marginTop: 12,
        textAlign: 'center',
    } as TextStyle,
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'flex-start',
    } as ViewStyle,
    infoText: {
        flex: 1,
        color: '#1976D2',
        marginLeft: 12,
        lineHeight: 20,
    } as TextStyle,
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 24,
        width: '80%',
        maxWidth: 400,
    } as ViewStyle,
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.title,
        marginBottom: 20,
        textAlign: 'center',
    } as TextStyle,
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.primary,
        marginBottom: 12,
    } as ViewStyle,
    modeButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    } as ViewStyle,
    modeButtonText: {
        fontSize: 16,
        color: COLORS.primary,
        marginLeft: 12,
        fontWeight: '600',
    } as TextStyle,
    modeButtonTextActive: {
        color: COLORS.white,
    } as TextStyle,
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    } as ViewStyle,
    modalCancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
        alignItems: 'center',
    } as ViewStyle,
    modalCancelText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    } as TextStyle,
    modalConfirmButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        marginLeft: 8,
        alignItems: 'center',
    } as ViewStyle,
    modalConfirmText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AttendanceWFH;