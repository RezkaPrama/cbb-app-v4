import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme, DrawerActions, useNavigation } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import axios, { AxiosError } from 'axios';

import { GlobalStyleSheet } from '../../constants/GlobalStyleSheet';
import SearchBar from '../../components/Search/SearchBar';
import { COLORS, FONTS, IMAGES } from '../../../app/constants/theme';
import { getDataLara } from '../../utils/asyncStorage';

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

const API_BASE_URL = 'https://app.citrabarubusana.com/api';

const Home: React.FC = () => { // Hapus props
  const navigation = useNavigation(); // Gunakan useNavigation
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
            routes: [{ name: 'Login' as never }],
          });
          return;
        }

        setToken(storedToken);
        setUserDetails(storedUserDetails);

        if (storedToken && storedUserDetails) {
          await loadUnreadCount(storedToken, storedUserDetails);
        }
      } catch (error) {
        console.error('Error checking token:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' as never }],
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

  // Handler untuk membuka drawer
  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
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
          <View style={[GlobalStyleSheet.container as any, { paddingTop: 8 }]}>
            <SearchBar />
          </View>

          <View style={[GlobalStyleSheet.container as any, { paddingBottom: 0 }]}>
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
          </View>

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
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingBottom: 12,
  },
  welcomeTextContainer: {
    flex: 1,
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
  bottomSpacing: {
    marginBottom: 80,
  },
});

export default Home;