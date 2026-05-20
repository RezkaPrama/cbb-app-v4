import React, { useCallback, useEffect, useState } from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Image,
    StyleSheet,
} from 'react-native';
import { useTheme, DrawerActions, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import axios, { AxiosError } from 'axios';

import { GlobalStyleSheet } from '../../constants/GlobalStyleSheet';
import SearchBar from '../../components/Search/SearchBar';
import { COLORS, FONTS, IMAGES } from '../../../app/constants/theme';
// import BannerSlider from './components/BannerSlider';
// import Categories from './components/Categories';
// import BannerSlider3 from './components/BannerSlider3';
// import BannerSlider4 from './components/BannerSlider4';
// import BannerMapping from './components/BannerMapping';
// import BannerSliderPO from './components/BannerSliderPO';
// import BannerListPiutang from './components/BannerListPiutang';
// import BannerAbsenAdmin from './components/BannerAbsenAdmin';
import { getDataLara } from '../../utils/asyncStorage';
import BannerAbsenAdmin from '../../components/Banner/BannerAbsenAdmin';
import BannerAbsenSales from '../../components/Banner/BannerAbsenSales';
import BannerMapping from '../../components/Banner/BannerMapping';
import BannerScanRack from '../../components/Banner/BannerScanRack';

// Types
interface UserDetails {
    id: number;
    name: string;
    username: string;
    email: string;
    employee_name?: string;
    branch_name?: string;
    position_name?: string;
    profile_pic?: string;
    position?: {
        id: number;
        name: string;
    };
    department?: {
        id: number;
        name: string;
    };
    branch?: {
        id: number;
        name: string;
    };
}

interface NotificationResponse {
    unread_count: number;
}

type RootStackParamList = {
    SignIn: undefined;
    Home: undefined;
    Notifications: undefined;
    // Add other routes as needed
};

type DrawerParamList = {
    Home: undefined;
    // Add other drawer routes as needed
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeProps {
    navigation: HomeScreenNavigationProp;
}

const API_BASE_URL = 'https://app.citrabarubusana.com/api';

const Home: React.FC<HomeProps> = ({ navigation }) => {
    const { colors } = useTheme();
    const [token, setToken] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const insets = useSafeAreaInsets();

    // Load unread notification count
    const loadUnreadCount = useCallback(
        async (currentToken: string, currentUserDetails: UserDetails) => {
            if (
                !currentToken ||
                !currentUserDetails?.branch_name ||
                !currentUserDetails?.position_name
            ) {
                return;
            }

            try {
                const response = await axios.get<NotificationResponse>(
                    `${API_BASE_URL}/notifications/get_unread_count`,
                    {
                        params: {
                            branch_name: currentUserDetails.branch_name,
                            position_name: currentUserDetails.position_name,
                        },
                        headers: {
                            Authorization: `Bearer ${currentToken}`,
                        },
                    }
                );

                if (response.data) {
                    setUnreadCount(response.data.unread_count || 0);
                } else {
                    setUnreadCount(0);
                }
            } catch (error) {
                const axiosError = error as AxiosError;
                console.error('Error fetching notifications:', axiosError.message);
                setUnreadCount(0);
            }
        },
        []
    );

    // Initial data loading
    useEffect(() => {
        const checkToken = async (): Promise<void> => {
            try {
                setIsLoading(true);
                const storedToken = await getDataLara<string>('tokenUser');
                const storedUserDetails = await getDataLara<UserDetails>('dataDetailUser');

                if (!storedToken) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'SignIn' }],
                    });
                    return;
                }

                setToken(storedToken);
                setUserDetails(storedUserDetails);

                // Load unread count if we have both token and userDetails
                if (storedToken && storedUserDetails) {
                    await loadUnreadCount(storedToken, storedUserDetails);
                }
            } catch (error) {
                console.error('Error checking token:', error);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'SignIn' }],
                });
            } finally {
                setIsLoading(false);
            }
        };

        checkToken();

        const unsubscribe = navigation.addListener('focus', () => {
            checkToken();
        });

        return unsubscribe;
    }, [navigation, loadUnreadCount]);

    // Get profile picture URL
    const getProfilePicUrl = (): { uri: string } | number => {
        if (userDetails?.profile_pic) {
            return {
                uri: `https://app.citrabarubusana.com/uploads/profile_pics/${userDetails.profile_pic}`,
            };
        }
        return IMAGES.user;
    };

    // Loading state
    if (isLoading) {
        return (
            <View
                style={[
                    styles.centerContainer,
                    { backgroundColor: COLORS.background2 },
                ]}
            >
                <ActivityIndicator size="large" color={COLORS.primary3} />
            </View>
        );
    }

    // No token state
    if (!token) {
        return null;
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView
                style={[
                    styles.container,
                    {
                        backgroundColor: COLORS.background2,
                        marginTop: insets.bottom,
                    },
                ]}
            >

                {/* Welcome Header */}
                <View style={styles.welcomeHeader}>
                    <View style={styles.welcomeTextContainer}>
                        <Text style={[FONTS.h4, { color: COLORS.title }]}>
                            Selamat Datang!
                        </Text>
                        {userDetails && (
                            <>
                                <Text
                                    style={[
                                        FONTS.font,
                                        { color: COLORS.title, lineHeight: 17 },
                                    ]}
                                >
                                    {userDetails.name}
                                </Text>
                                <Text
                                    style={[
                                        FONTS.fontXs,
                                        { color: COLORS.title, lineHeight: 17 },
                                    ]}
                                >
                                    {userDetails?.position?.name || '-'}
                                </Text>
                            </>
                        )}
                    </View>

                    {/* Grid Menu Button */}
                    <TouchableOpacity
                        // onPress={handleOpenDrawer}
                        style={[
                            styles.gridButton,
                            { borderColor: COLORS.borderColor },
                        ]}
                    >
                        <FeatherIcon color={COLORS.title} size={22} name="grid" />
                    </TouchableOpacity>
                </View>

                {/* Scrollable Content */}
                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Search Bar */}
                    <View style={[GlobalStyleSheet.container as any, { paddingTop: 8 }]}>
                        <SearchBar />
                    </View>

                    {/* Banner Mapping */}
                    <BannerMapping />

                    {/* Main Banners */}
                    <BannerAbsenSales />
                    <BannerAbsenAdmin />
                    {/* <BannerSlider4 /> */}
                    {/* <BannerListPiutang /> */}
                    {/* <BannerSliderPO /> */}

                    {/* Agenda Kerja Section */}
                    {/* <View style={[GlobalStyleSheet.container as any, { paddingBottom: 0 }]}>
                        <View style={styles.sectionHeader}>
                            <Text style={[FONTS.h4, { color: COLORS.title }]}>
                                Agenda Kerja
                            </Text>
                            <TouchableOpacity>
                                <Text style={[FONTS.font, { color: COLORS.primary3 }]}>
                                    View all
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View> */}

                    {/* Categories */}
                    {/* <Categories /> */}

                    {/* Additional Banners */}
                    <View style={styles.bottomBanner}>
                        <BannerScanRack />
                    </View>

                    {/* Bottom Spacing */}
                    <View style={styles.bottomSpacing} />
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5,
        shadowColor: 'rgba(0,0,0,.6)',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    headerButton: {
        height: 50,
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        height: 18,
        width: 18,
        borderRadius: 20,
        position: 'absolute',
        top: 7,
        right: 10,
        zIndex: 1,
        backgroundColor: COLORS.warning,
        alignItems: 'center',
        justifyContent: 'center',
    },
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
    profilePic: {
        height: 32,
        width: 32,
        borderRadius: 20,
    },
    gridButton: {
        height: 48,
        width: 48,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bottomBanner: {
        marginBottom: 10,
    },
    bottomSpacing: {
        marginBottom: 80,
    },
});

export default Home;