import React, { useEffect, useState, useCallback } from "react";
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Alert,
    ViewStyle,
    TextStyle,
    TouchableOpacity,
    Image,
    ImageStyle,
} from "react-native";
import MapView, { Marker, Circle, Region } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "expo-camera";
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS } from "../../../app/constants/theme";
import { getDataLara } from "../../utils/asyncStorage";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ButtonLight from "../../components/Button/ButtonLight";
import apiService from "../../service/apiService";

// Types
interface Position {
    latitude: number;
    longitude: number;
}

interface BranchOffice {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    lat?: number;
    lng?: number;
    long?: number;
    branch_name?: string;
    branch_address?: string;
}

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
}

interface AttendanceStatusResponse {
    success: boolean;
    message?: string;
    data?: {
        has_checked_in: boolean;
        has_checked_out: boolean;
        attendance?: AttendanceData;
    };
}

interface BranchResponse {
    success: boolean;
    message?: string;
    data?: BranchOffice;
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
    AbsenAdmin: undefined;
    Login: undefined;
};

type AbsenAdminNavigationProp = StackNavigationProp<RootStackParamList, 'AbsenAdmin'>;

interface AbsenAdminProps {
    navigation: AbsenAdminNavigationProp;
}

const AbsenAdmin: React.FC<AbsenAdminProps> = ({ navigation }) => {
    const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
    const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
    const [userName, setUserName] = useState<string>("Admin");
    const [locationSubscriber, setLocationSubscriber] = useState<Location.LocationSubscription | null>(null);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [branchOffice, setBranchOffice] = useState<BranchOffice | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasCheckedIn, setHasCheckedIn] = useState<boolean>(false);
    const [hasCheckedOut, setHasCheckedOut] = useState<boolean>(false);
    const [checkinTime, setCheckinTime] = useState<string | null>(null);
    const [isInRadius, setIsInRadius] = useState<boolean>(false);
    const [distance, setDistance] = useState<number | null>(null);
    const [mapReady, setMapReady] = useState<boolean>(false);
    const [locationRetryCount, setLocationRetryCount] = useState<number>(0);
    const [token, setToken] = useState<string>("");

    // State untuk kamera
    const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [capturedCheckoutPhoto, setCapturedCheckoutPhoto] = useState<string | null>(null); // BARU: untuk foto checkout

    const { colors } = useTheme();

    const ALLOWED_RADIUS = 10;

    // Request camera permission
    const requestCameraPermission = async (): Promise<boolean> => {
        try {
            const { status } = await Camera.requestCameraPermissionsAsync();
            const isGranted = status === "granted";
            setCameraPermission(isGranted);

            if (!isGranted) {
                Alert.alert(
                    'Izin Kamera Diperlukan',
                    'Aplikasi memerlukan izin akses kamera untuk foto selfie saat check-in/check-out.',
                    [{ text: 'OK' }]
                );
            }

            return isGranted;
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Gagal meminta izin kamera'
            });
            return false;
        }
    };

    // MODIFIKASI: Open camera dengan parameter untuk membedakan checkin/checkout
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

    // MODIFIKASI: Remove photo dengan parameter
    const removePhoto = (isCheckout: boolean = false): void => {
        Alert.alert(
            'Hapus Foto',
            'Apakah Anda yakin ingin menghapus foto ini?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus',
                    style: 'destructive',
                    onPress: () => {
                        if (isCheckout) {
                            setCapturedCheckoutPhoto(null);
                        } else {
                            setCapturedPhoto(null);
                        }
                        Toast.show({
                            type: 'info',
                            text1: 'Foto Dihapus',
                            text2: 'Foto selfie telah dihapus'
                        });
                    }
                }
            ]
        );
    };

    // Fetch token and user details on mount
    useEffect(() => {
        const fetchData = async (): Promise<void> => {
            try {
                const storedToken = await getDataLara<string>("tokenUser");
                const storedUserDetails = await getDataLara<UserDetails>("dataDetailUser");

                if (storedToken && storedUserDetails) {
                    setUserDetails(storedUserDetails);
                    setToken(storedToken);
                    setUserName(storedUserDetails.name || "Admin");
                } else {
                    console.warn('No token or user details found in storage');
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Data user tidak ditemukan'
                    });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Gagal memuat data user'
                });
            }
        };
        fetchData();
    }, []);

    // Haversine formula
    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number => {
        const R = 6371e3;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    // Request location permission
    const requestLocationPermission = async (): Promise<boolean> => {
        try {
            const locationServiceEnabled = await Location.hasServicesEnabledAsync();
            if (!locationServiceEnabled) {
                console.warn('Location service is disabled');
                Alert.alert(
                    'Layanan Lokasi Nonaktif',
                    'Aktifkan layanan lokasi di pengaturan perangkat Anda untuk menggunakan fitur absensi.',
                    [{ text: 'OK' }]
                );
                return false;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            const isGranted = status === "granted";
            setLocationPermission(isGranted);

            if (!isGranted) {
                Alert.alert(
                    'Izin Lokasi Diperlukan',
                    'Aplikasi memerlukan izin akses lokasi untuk fitur absensi.',
                    [{ text: 'OK' }]
                );
            }

            return isGranted;
        } catch (error) {
            console.error('Error requesting location permission:', error);
            return false;
        }
    };

    const startLocationUpdates = async (permissionGranted: boolean): Promise<void> => {
        if (!permissionGranted) {
            return;
        }

        try {
            try {
                const lastKnown = await Location.getLastKnownPositionAsync({
                    maxAge: 600000,
                    requiredAccuracy: 100,
                });

                if (lastKnown) {
                    setCurrentPosition({
                        latitude: lastKnown.coords.latitude,
                        longitude: lastKnown.coords.longitude,
                    });
                }
            } catch (lastKnownError) {
                console.log('No last known position available');
            }

            try {
                const location = await Promise.race([
                    Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    }),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Location timeout')), 20000)
                    )
                ]) as Location.LocationObject;

                setCurrentPosition({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                });

            } catch (currentPosError) {
                console.log('getCurrentPosition failed');
            }

            const subscriber = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 10000,
                    distanceInterval: 10,
                },
                (newLocation: Location.LocationObject) => {
                    setCurrentPosition({
                        latitude: newLocation.coords.latitude,
                        longitude: newLocation.coords.longitude,
                    });
                }
            );

            setLocationSubscriber(subscriber);

        } catch (error) {
            console.error('Error in startLocationUpdates:', error);
        }
    };

    const retryLocationFetch = async (): Promise<void> => {
        if (locationRetryCount >= 3) {
            Toast.show({
                type: 'error',
                text1: 'GPS Tidak Tersedia',
                text2: 'Silakan pindah ke tempat terbuka dan restart aplikasi',
            });
            return;
        }

        setLocationRetryCount(prev => prev + 1);
        const permissionGranted = await requestLocationPermission();
        if (permissionGranted) {
            await startLocationUpdates(permissionGranted);
        }
    };

    const stopLocationUpdates = (): void => {
        if (locationSubscriber) {
            locationSubscriber.remove();
            setLocationSubscriber(null);
        }
    };

    const fetchBranchAndStatus = async (branchId: number): Promise<void> => {
        if (!branchId || !userDetails?.id || isLoading) {
            return;
        }

        try {
            setIsLoading(true);

            const branchResponse = await apiService.getBranchById(branchId);

            if (branchResponse?.success && branchResponse.data) {
                const branchData = branchResponse.data;
                const lat = branchData.latitude || branchData.lat;
                const lng = branchData.longitude || branchData.lng || branchData.long;

                if (!lat || !lng) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Koordinat kantor tidak valid'
                    });
                    setIsLoading(false);
                    return;
                }

                const normalizedBranch: BranchOffice = {
                    ...branchData,
                    latitude: parseFloat(String(lat)),
                    longitude: parseFloat(String(lng)),
                    name: branchData.name || branchData.branch_name || 'Kantor',
                    address: branchData.address || branchData.branch_address || '-',
                };

                setBranchOffice(normalizedBranch);
            }

            if (!token) {
                navigation.navigate('Login');
                return;
            }

            const response = await fetch('https://citrabarubusana.org/api/attendance/today', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userDetails.id
                })
            });

            const statusResponse: AttendanceStatusResponse = await response.json();

            if (statusResponse?.success && statusResponse.data) {
                const { has_checked_in, has_checked_out, attendance } = statusResponse.data;

                setHasCheckedIn(has_checked_in === true);
                setHasCheckedOut(has_checked_out === true);
                setCheckinTime(attendance?.check_in_time || null);
            }

        } catch (error) {
            console.error('Error in fetchBranchAndStatus:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;

            const setupLocation = async (): Promise<void> => {
                const permissionGranted = await requestLocationPermission();
                if (permissionGranted && isMounted) {
                    await startLocationUpdates(permissionGranted);
                }
            };

            setupLocation();

            return () => {
                isMounted = false;
                stopLocationUpdates();
            };
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            if (userDetails?.branch?.id) {
                fetchBranchAndStatus(userDetails.branch.id);
            } else if (userDetails?.branch_id) {
                fetchBranchAndStatus(userDetails.branch_id);
            }
        }, [userDetails, token])
    );

    useEffect(() => {
        if (currentPosition && branchOffice) {
            const dist = calculateDistance(
                currentPosition.latitude,
                currentPosition.longitude,
                branchOffice.latitude,
                branchOffice.longitude
            );

            setDistance(dist);
            setIsInRadius(dist <= ALLOWED_RADIUS);
        }
    }, [currentPosition, branchOffice]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    // Handle check-in dengan foto
    const handleCheckin = async (): Promise<void> => {
        if (!isInRadius) {
            Alert.alert(
                'Diluar Radius',
                `Anda berada ${Math.round(distance || 0)}m dari kantor. Anda harus berada dalam radius ${ALLOWED_RADIUS}m.`,
                [{ text: 'OK' }]
            );
            return;
        }

        if (!capturedPhoto) {
            Alert.alert(
                'Foto Selfie Diperlukan',
                'Silakan ambil foto selfie terlebih dahulu sebelum check-in.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (!currentPosition || !token) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Data tidak lengkap'
            });
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('latitude', currentPosition.latitude.toString());
            formData.append('longitude', currentPosition.longitude.toString());
            formData.append('address', branchOffice?.address || 'Kantor Pusat');

            const photoUri = capturedPhoto;
            const filename = photoUri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('photo', {
                uri: photoUri,
                name: filename,
                type: type,
            } as any);

            const response = await fetch("https://citrabarubusana.org/api/attendance/check-in", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
                body: formData
            });

            const responseData: CheckInOutResponse = await response.json();

            if (response.ok && responseData.success) {
                setHasCheckedIn(true);
                setCheckinTime(responseData.data?.attendance?.check_in_time || null);
                setCapturedPhoto(null);

                Toast.show({
                    type: 'success',
                    text1: 'Berhasil',
                    text2: responseData.message || 'Check-in berhasil'
                });
            } else {
                console.error("Error response:", responseData);
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
        } catch (error) {
            console.error("Error during check-in:", error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Periksa Koneksi Internet Anda.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // MODIFIKASI: Handle check-out dengan foto
    const handleCheckout = async (): Promise<void> => {
        if (!isInRadius) {
            Alert.alert(
                'Diluar Radius',
                `Anda berada ${Math.round(distance || 0)}m dari kantor. Anda harus berada dalam radius ${ALLOWED_RADIUS}m.`,
                [{ text: 'OK' }]
            );
            return;
        }

        // Validasi foto wajib untuk checkout
        if (!capturedCheckoutPhoto) {
            Alert.alert(
                'Foto Selfie Diperlukan',
                'Silakan ambil foto selfie terlebih dahulu sebelum check-out.',
                [{ text: 'OK' }]
            );
            return;
        }

        if (!currentPosition || !token) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Data tidak lengkap'
            });
            return;
        }

        setIsLoading(true);
        try {
            // Gunakan FormData untuk upload foto
            const formData = new FormData();
            formData.append('latitude', currentPosition.latitude.toString());
            formData.append('longitude', currentPosition.longitude.toString());
            formData.append('address', branchOffice?.address || 'Kantor Pusat');

            // Tambahkan foto ke FormData
            const photoUri = capturedCheckoutPhoto;
            const filename = photoUri.split('/').pop() || 'checkout_photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('photo', {
                uri: photoUri,
                name: filename,
                type: type,
            } as any);

            console.log("Check-out with photo");

            const response = await fetch("https://citrabarubusana.org/api/attendance/check-out", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
                body: formData
            });

            const responseData: CheckInOutResponse = await response.json();

            if (response.ok && responseData.success) {
                setHasCheckedIn(false);
                setHasCheckedOut(true);
                setCheckinTime(null);
                setCapturedCheckoutPhoto(null); // Reset foto checkout setelah berhasil

                Toast.show({
                    type: 'success',
                    text1: 'Berhasil',
                    text2: responseData.message || 'Check-out berhasil'
                });
            } else {
                console.error("Error response:", responseData);
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
        } catch (error) {
            console.error("Error during check-out:", error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Periksa Koneksi Internet Anda.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Loading screens
    if (!userDetails || locationPermission === null) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[FONTS.h3 as TextStyle, { color: COLORS.title, marginTop: 10 }]}>
                    {!userDetails ? 'Memuat data user...' : 'Meminta izin lokasi...'}
                </Text>
            </View>
        );
    }

    if (locationPermission === false) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={[FONTS.h3 as TextStyle, { color: COLORS.title, marginTop: 10, textAlign: 'center' }]}>
                    Izin Lokasi Diperlukan
                </Text>
                <Text style={[FONTS.fontSm as TextStyle, { color: COLORS.text, marginTop: 10, textAlign: 'center', paddingHorizontal: 30 }]}>
                    Silakan berikan izin akses lokasi di pengaturan aplikasi
                </Text>
            </View>
        );
    }

    if (!currentPosition || !branchOffice) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[FONTS.h3 as TextStyle, { color: COLORS.title, marginTop: 10 }]}>
                    {!currentPosition ? 'Mencari lokasi Anda...' : 'Memuat data kantor...'}
                </Text>
                {!currentPosition && (
                    <>
                        <Text style={[FONTS.fontXs as TextStyle, { color: COLORS.text, marginTop: 10, textAlign: 'center', paddingHorizontal: 30 }]}>
                            Pastikan GPS aktif dan Anda berada di tempat terbuka
                        </Text>
                        <View style={{ marginTop: 20, width: '80%' }}>
                            <ButtonLight
                                color={COLORS.primary}
                                title={'Coba Lagi'}
                                onPress={retryLocationFetch}
                            />
                        </View>
                    </>
                )}
            </View>
        );
    }

    const initialRegion: Region = {
        latitude: branchOffice?.latitude || -6.2088,
        longitude: branchOffice?.longitude || 106.8456,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
    };

    // Main render
    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <View style={styles.container}>
                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={COLORS.white} />
                        </View>
                    )}

                    <MapView
                        style={styles.map}
                        initialRegion={initialRegion}
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                        showsCompass={true}
                        mapType="standard"
                        onMapReady={() => setMapReady(true)}
                    >
                        {branchOffice && (
                            <Marker
                                coordinate={{
                                    latitude: branchOffice.latitude,
                                    longitude: branchOffice.longitude,
                                }}
                                title={branchOffice.name}
                                description="Lokasi Kantor"
                            >
                                <View style={styles.markerContainer}>
                                    <FeatherIcon name="home" size={24} color="#FF9800" />
                                    <View style={styles.markerLabel}>
                                        <Text style={styles.markerText}>{branchOffice.name}</Text>
                                    </View>
                                </View>
                            </Marker>
                        )}
                        {branchOffice && (
                            <Circle
                                center={{
                                    latitude: branchOffice.latitude,
                                    longitude: branchOffice.longitude,
                                }}
                                radius={ALLOWED_RADIUS}
                                strokeWidth={2}
                                strokeColor="rgba(196, 37, 180, 0.5)"
                                fillColor="rgba(252, 163, 230, 0.2)"
                            />
                        )}
                    </MapView>

                    <View style={styles.halfCard}>
                        <View style={styles.statusBadge}>
                            <FeatherIcon
                                name={isInRadius ? "check-circle" : "alert-circle"}
                                size={20}
                                color={isInRadius ? COLORS.success : COLORS.warning}
                            />
                            <Text style={[
                                styles.statusText,
                                { color: isInRadius ? COLORS.success : COLORS.warning }
                            ]}>
                                {isInRadius
                                    ? `Dalam Radius (${Math.round(distance || 0)}m)`
                                    : `Diluar Radius (${Math.round(distance || 0)}m)`
                                }
                            </Text>
                        </View>

                        {!hasCheckedIn ? (
                            <View style={styles.contentContainer}>
                                <View style={styles.headerContainer}>
                                    <Text style={[FONTS.h4 as TextStyle, { color: COLORS.title, marginTop: 10 }]}>
                                        Absen Check In
                                    </Text>
                                    <Text style={[FONTS.fontSm as TextStyle, { color: COLORS.text, marginTop: 5 }]}>
                                        {branchOffice.name}
                                    </Text>
                                </View>

                                <Text style={[FONTS.h2 as TextStyle, { color: COLORS.title, marginTop: 20 }]}>
                                    {currentTime.toLocaleTimeString('id-ID', {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    })}
                                </Text>

                                <Text style={[FONTS.fontSm as TextStyle, { color: COLORS.text }]}>
                                    {currentTime.toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Text>

                                {/* Section Foto Selfie untuk Check-In */}
                                <View style={styles.photoSection}>
                                    {capturedPhoto ? (
                                        <View style={styles.photoPreviewContainer}>
                                            <Image
                                                source={{ uri: capturedPhoto }}
                                                style={styles.photoPreview}
                                            />
                                            <TouchableOpacity
                                                style={styles.removePhotoButton}
                                                onPress={() => removePhoto(false)}
                                            >
                                                <FeatherIcon name="x" size={20} color={COLORS.white} />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.cameraButton}
                                            onPress={() => openCamera(false)}
                                        >
                                            <FeatherIcon name="camera" size={32} color={COLORS.primary} />
                                            <Text style={[FONTS.fontSm as TextStyle, { color: COLORS.primary, marginTop: 8 }]}>
                                                Ambil Foto Selfie
                                            </Text>
                                            <Text style={[FONTS.fontXs as TextStyle, { color: COLORS.text, marginTop: 4 }]}>
                                                (Wajib)
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <View style={{ marginTop: 20, width: '100%' }}>
                                    <ButtonLight
                                        color={isInRadius && capturedPhoto ? COLORS.success : COLORS.secondary}
                                        title={'Check In'}
                                        onPress={handleCheckin}
                                        disabled={!isInRadius || !capturedPhoto || isLoading}
                                    />
                                </View>

                                {!isInRadius && (
                                    <Text style={[FONTS.fontXs as TextStyle, { color: COLORS.danger, marginTop: 10, textAlign: 'center' }]}>
                                        Anda harus berada dalam radius {ALLOWED_RADIUS}m dari kantor
                                    </Text>
                                )}

                                {!capturedPhoto && isInRadius && (
                                    <Text style={[FONTS.fontXs as TextStyle, { color: COLORS.warning, marginTop: 10, textAlign: 'center' }]}>
                                        Ambil foto selfie terlebih dahulu
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <View style={styles.contentContainer}>
                                <View style={styles.headerContainer}>
                                    <Text style={[FONTS.h4 as TextStyle, { color: COLORS.title, marginTop: 10 }]}>
                                        {hasCheckedOut ? 'Sudah Check Out' : 'Sudah Check In'}
                                    </Text>
                                    <Text style={[FONTS.fontSm as TextStyle, { color: COLORS.text, marginTop: 5 }]}>
                                        {branchOffice.name}
                                    </Text>
                                </View>

                                {checkinTime && (
                                    <View style={styles.checkinInfo}>
                                        <FeatherIcon name="check-circle" size={24} color={COLORS.success} />
                                        <Text style={[FONTS.fontSm as TextStyle, { color: COLORS.success, marginLeft: 8 }]}>
                                            Check-in: {checkinTime}
                                        </Text>
                                    </View>
                                )}

                                <Text style={[FONTS.h2 as TextStyle, { color: COLORS.title, marginTop: 20 }]}>
                                    {currentTime.toLocaleTimeString('id-ID', {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    })}
                                </Text>

                                <Text style={[FONTS.fontSm as TextStyle, { color: COLORS.text }]}>
                                    {currentTime.toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Text>

                                {/* Section Foto Selfie untuk Check-Out */}
                                {!hasCheckedOut && (
                                    <View style={styles.photoSection}>
                                        {capturedCheckoutPhoto ? (
                                            <View style={styles.photoPreviewContainer}>
                                                <Image
                                                    source={{ uri: capturedCheckoutPhoto }}
                                                    style={styles.photoPreview}
                                                />
                                                <TouchableOpacity
                                                    style={styles.removePhotoButton}
                                                    onPress={() => removePhoto(true)}
                                                >
                                                    <FeatherIcon name="x" size={20} color={COLORS.white} />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.cameraButton}
                                                onPress={() => openCamera(true)}
                                            >
                                                <FeatherIcon name="camera" size={32} color={COLORS.danger} />
                                                <Text style={[FONTS.fontSm as TextStyle, { color: COLORS.danger, marginTop: 8 }]}>
                                                    Ambil Foto Selfie
                                                </Text>
                                                <Text style={[FONTS.fontXs as TextStyle, { color: COLORS.text, marginTop: 4 }]}>
                                                    (Wajib untuk Check-Out)
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {!hasCheckedOut && (
                                    <View style={{ marginTop: 20, width: '100%' }}>
                                        <ButtonLight
                                            color={isInRadius && capturedCheckoutPhoto ? COLORS.danger : COLORS.secondary}
                                            title={'Check Out'}
                                            onPress={handleCheckout}
                                            disabled={!isInRadius || !capturedCheckoutPhoto || isLoading}
                                        />
                                    </View>
                                )}

                                {hasCheckedOut && (
                                    <View style={styles.completedContainer}>
                                        <FeatherIcon name="check-circle" size={50} color={COLORS.success} />
                                        <Text style={[FONTS.h4 as TextStyle, { color: COLORS.success, marginTop: 10 }]}>
                                            Absensi Hari Ini Selesai
                                        </Text>
                                    </View>
                                )}

                                {!isInRadius && !hasCheckedOut && (
                                    <Text style={[FONTS.fontXs as TextStyle, { color: COLORS.danger, marginTop: 10, textAlign: 'center' }]}>
                                        Anda harus berada dalam radius {ALLOWED_RADIUS}m dari kantor
                                    </Text>
                                )}

                                {!capturedCheckoutPhoto && isInRadius && !hasCheckedOut && (
                                    <Text style={[FONTS.fontXs as TextStyle, { color: COLORS.warning, marginTop: 10, textAlign: 'center' }]}>
                                        Ambil foto selfie terlebih dahulu
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>
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
    map: {
        flex: 1,
        width: '100%',
    } as ViewStyle,
    halfCard: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
        minHeight: 280,
    } as ViewStyle,
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.darkBorder,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignSelf: 'center',
    } as ViewStyle,
    statusText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    } as TextStyle,
    contentContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    } as ViewStyle,
    headerContainer: {
        alignItems: 'center',
    } as ViewStyle,
    checkinInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
    } as ViewStyle,
    completedContainer: {
        alignItems: 'center',
        marginTop: 20,
        padding: 20,
    } as ViewStyle,
    markerContainer: {
        justifyContent: 'center',
    },
    markerLabel: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 4,
        marginTop: 2,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    } as ViewStyle,
    markerText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.title,
    } as TextStyle,
    // Style untuk kamera
    photoSection: {
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    } as ViewStyle,
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
});

export default AbsenAdmin;