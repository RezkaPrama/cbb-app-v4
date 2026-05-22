import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    StyleSheet,
    Modal,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import axios, { AxiosError } from 'axios';

import { GlobalStyleSheet } from '../../constants/GlobalStyleSheet';
import SearchBar from '../../components/Search/SearchBar';
import { COLORS, FONTS } from '../../../app/constants/theme';

import { getDataLara } from '../../utils/asyncStorage';
import BannerAbsenAdmin from '../../components/Banner/BannerAbsenAdmin';
import BannerAbsenSales from '../../components/Banner/BannerAbsenSales';
import BannerMapping from '../../components/Banner/BannerMapping';
import BannerScanRack from '../../components/Banner/BannerScanRack';
import BannerListPiutang from '../../components/Banner/BannerListPiutang';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/Store/authSlice';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserDetails {
    id: number;
    name: string;
    username: string;
    email: string;
    employee_name?: string;
    branch_name?: string;
    position_name?: string;
    profile_pic?: string;
    position?: { id: number; name: string };
    department?: { id: number; name: string };
    branch?: { id: number; name: string };
}

interface NotificationResponse {
    unread_count: number;
}

type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    Notifications: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeProps {
    navigation: HomeScreenNavigationProp;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE_URL = 'https://app.citrabarubusana.com/api';

// ─── Component ────────────────────────────────────────────────────────────────

const Home: React.FC<HomeProps> = ({ navigation }) => {
    const { colors } = useTheme();
    const [token, setToken] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();

    // ── Fetch unread notification count ──────────────────────────────────────
    const loadUnreadCount = useCallback(
        async (currentToken: string, currentUserDetails: UserDetails) => {
            if (!currentToken || !currentUserDetails?.branch_name || !currentUserDetails?.position_name) return;
            try {
                const response = await axios.get<NotificationResponse>(
                    `${API_BASE_URL}/notifications/get_unread_count`,
                    {
                        params: {
                            branch_name: currentUserDetails.branch_name,
                            position_name: currentUserDetails.position_name,
                        },
                        headers: { Authorization: `Bearer ${currentToken}` },
                    }
                );
                setUnreadCount(response.data?.unread_count ?? 0);
            } catch (error) {
                console.error('Error fetching notifications:', (error as AxiosError).message);
                setUnreadCount(0);
            }
        },
        []
    );

    // ── Initial data load + focus listener ───────────────────────────────────
    useEffect(() => {
        const checkToken = async (): Promise<void> => {
            try {
                setIsLoading(true);
                const storedToken = await getDataLara<string>('tokenUser');
                const storedUserDetails = await getDataLara<UserDetails>('dataDetailUser');

                if (!storedToken) {
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                    return;
                }

                setToken(storedToken);
                setUserDetails(storedUserDetails);

                if (storedToken && storedUserDetails) {
                    await loadUnreadCount(storedToken, storedUserDetails);
                }
            } catch (error) {
                console.error('Error checking token:', error);
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } finally {
                setIsLoading(false);
            }
        };

        checkToken();

        const unsubscribe = navigation.addListener('focus', () => { checkToken(); });
        return unsubscribe;
    }, [navigation, loadUnreadCount]);

    // ── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('tokenUser');
            await AsyncStorage.removeItem('dataDetailUser');
            await AsyncStorage.removeItem('idAbsenCheckIn');
            dispatch(logout());
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // ── Loading state ─────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <View style={[styles.centerContainer, { backgroundColor: COLORS.background2 }]}>
                <ActivityIndicator size="large" color={COLORS.primary3} />
            </View>
        );
    }

    if (!token) return null;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SafeAreaProvider>
            <SafeAreaView
                style={[
                    styles.container,
                    { backgroundColor: COLORS.background2, marginTop: insets.bottom },
                ]}
            >

                {/* ── Welcome Header ─────────────────────────────────────────── */}
                <View style={styles.welcomeHeader}>
                    <View style={styles.welcomeTextContainer}>
                        <Text style={[FONTS.h4, { color: COLORS.title }]}>
                            Selamat Datang!
                        </Text>
                        {userDetails && (
                            <>
                                <Text style={[FONTS.font, { color: COLORS.title, lineHeight: 17 }]}>
                                    {userDetails.name}
                                </Text>
                                <Text style={[FONTS.fontXs, { color: COLORS.title, lineHeight: 17 }]}>
                                    {userDetails?.position?.name ?? '-'}
                                </Text>
                            </>
                        )}
                    </View>

                    {/* Grid / Logout Button */}
                    <TouchableOpacity
                        onPress={() => setIsLogoutModalVisible(true)}
                        style={[styles.gridButton, { borderColor: COLORS.borderColor }]}
                    >
                        {/* 2×2 dot grid matching template */}
                        <View style={styles.gridDots}>
                            <View style={[styles.dot, { backgroundColor: COLORS.primary3 }]} />
                            <View style={[styles.dot, { backgroundColor: COLORS.text }]} />
                            <View style={[styles.dot, { backgroundColor: COLORS.text }]} />
                            <View style={[styles.dot, { backgroundColor: COLORS.primary3 }]} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── Logout Confirmation Modal ───────────────────────────────── */}
                <Modal
                    animationType="fade"
                    transparent
                    visible={isLogoutModalVisible}
                    onRequestClose={() => setIsLogoutModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Konfirmasi Logout</Text>
                            <Text style={styles.modalMessage}>
                                Apakah Anda yakin ingin keluar dari aplikasi?
                            </Text>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setIsLogoutModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Batal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.logoutButton]}
                                    onPress={async () => {
                                        setIsLogoutModalVisible(false);
                                        await handleLogout();
                                    }}
                                >
                                    <Text style={styles.logoutButtonText}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* ── Scrollable Content ─────────────────────────────────────── */}
                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* Search Bar */}
                    <View style={[GlobalStyleSheet.container as any, { paddingTop: 8 }]}>
                        <SearchBar />
                    </View>

                    {/* 1. Mapping Toko — oranye pastel */}
                    <BannerMapping />

                    {/* 2. Absen Sales — biru gelap + dot grid */}
                    <BannerAbsenSales />

                    {/* 3. Manajemen Rak CBB — navy, badge "Modul Baru v5", dua tombol */}
                    <View style={styles.bannerRakWrapper}>
                        <BannerScanRack />
                    </View>

                    {/* 4. Section Label: Informasi Absensi */}
                    <View style={[GlobalStyleSheet.container as any, { paddingBottom: 0 }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[FONTS.h4, { color: COLORS.title }]}>
                                Informasi Absensi
                            </Text>
                            <TouchableOpacity>
                                <Text style={[FONTS.font, { color: COLORS.primary3 }]}>
                                    Lihat Semua
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 5. Absen Admin card */}
                    <BannerAbsenAdmin />

                    {/* 6. List Piutang card */}
                    {/* <BannerListPiutang /> */}

                    {/* Bottom Spacing — extra ruang di atas tab bar */}
                    <View style={styles.bottomSpacing} />
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Welcome Header ──────────────────────────────────────────────────────
    welcomeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
        paddingBottom: 12,
        marginTop: -20,
    },
    welcomeTextContainer: {
        flex: 1,
    },

    // Grid button (2×2 dot icon, triggers logout modal)
    gridButton: {
        height: 48,
        width: 48,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    gridDots: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 18,
        height: 18,
        gap: 4,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 2,
    },

    // ── Section Label ───────────────────────────────────────────────────────
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 6,
    },

    // ── BannerScanRack wrapper ──────────────────────────────────────────────
    bannerRakWrapper: {
        marginBottom: 4,
    },

    // ── Spacing ─────────────────────────────────────────────────────────────
    bottomSpacing: {
        marginBottom: 80,
    },

    // ── Logout Modal ────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
        color: '#333',
    },
    modalMessage: {
        fontSize: 16,
        marginBottom: 24,
        textAlign: 'center',
        color: '#666',
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#dc3545',
    },
    logoutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Home;