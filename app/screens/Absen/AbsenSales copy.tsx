import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS } from "../../constants/theme";
import { getDataLara } from "../../utils/asyncStorage";
import HeaderStyle from "../../components/Header/HeaderStyle";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ButtonLight from "../../components/Button/ButtonLight";
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
  Checkout: {
    idAbsen: number;
    nameStore: string;
    visitCount: number;
  };
  Checkin: {
    visitCount: number;
  };
  AbsenSales: undefined;
  // Add other routes as needed
};

type AbsenSalesNavigationProp = StackNavigationProp<RootStackParamList, 'AbsenSales'>;

interface AbsenSalesProps {
  navigation: AbsenSalesNavigationProp;
}

const AbsenSales: React.FC<AbsenSalesProps> = ({ navigation }) => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const [timestampCheckin, setTimestampCheckin] = useState<string>("");
  const [locationSubscriber, setLocationSubscriber] = useState<Location.LocationSubscription | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [token, setToken] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [idAbsen, setIdAbsen] = useState<number | null>(null);
  const [nameStore, setNameStore] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldShowCheckout, setShouldShowCheckout] = useState<boolean>(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const storedToken = await getDataLara<string>("tokenUser");
        const storedUserDetails = await getDataLara<UserDetails>("dataDetailUser");
        
        if (storedToken && storedUserDetails) {
          setToken(storedToken);
          setUserDetails(storedUserDetails);
          setUserName(storedUserDetails.name || "User");
          setUserId(storedUserDetails.id);
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
          
          if (!storedToken || !storedUserDetails) {
            console.warn('No token or user details found');
            return;
          }

          setToken(storedToken);
          setUserDetails(storedUserDetails);
          setUserName(storedUserDetails.name || "User");

          const response = await axios.get<CheckStatusResponse>(
            'https://citrabarubusana.org/api/store-visit/check-status',
            {
              params: {
                salesman_id: storedUserDetails.id
              },
              headers: {
                Authorization: `Bearer ${storedToken}`
              }
            }
          );

          console.log('Response data:', response.data);

          const { visit_count, has_incomplete_visit, current_visit_id, name_store } = response.data;

          // Set visit count untuk next visit
          setVisitCount(visit_count + 1);

          // Jika ada kunjungan yang belum checkout, tampilkan tombol checkout
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
          console.error('Error fetching status:', axiosError);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: axiosError.response?.data?.message || 'Failed to fetch status'
          });
        }
      };

      fetchStatus();
    }, [])
  );

  const handleCheckout = async (): Promise<void> => {
    if (isDataLoaded && idAbsen) {
      navigation.navigate('Checkout', {
        idAbsen: idAbsen,
        nameStore: nameStore || '',
        visitCount: visitCount - 1 // Current visit count, bukan next visit
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Data belum dimuat atau tidak ada kunjungan aktif'
      });
    }
  };

  const handleAbsen = async (): Promise<void> => {
    navigation.navigate('Checkin', { visitCount });
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      // Periksa dulu apakah location service diaktifkan
      const locationServiceEnabled = await Location.hasServicesEnabledAsync();
      if (!locationServiceEnabled) {
        Toast.show({
          type: 'error',
          text1: 'Location Service Disabled',
          text2: 'Please enable location services in your device settings'
        });
        return false;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      const isGranted = status === "granted";
      setLocationPermission(isGranted);

      if (!isGranted) {
        Toast.show({
          type: 'error',
          text1: 'Permission denied',
          text2: 'Permission to access location was denied'
        });
      }

      return isGranted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const startLocationUpdates = async (permissionGranted: boolean): Promise<void> => {
    if (!permissionGranted) {
      console.warn('Location permission not granted');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      setCurrentPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 900000,
          distanceInterval: 10,
        },
        (newLocation: Location.LocationObject) => {
          const newCoords: Position = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          if (
            !currentPosition ||
            currentPosition.latitude !== newCoords.latitude ||
            currentPosition.longitude !== newCoords.longitude
          ) {
            setCurrentPosition(newCoords);
          }
        }
      );

      setLocationSubscriber(subscriber);
    } catch (error) {
      console.error('Error starting location updates:', error);
      Toast.show({
        type: 'error',
        text1: 'Location Error',
        text2: 'Failed to get current location'
      });
    }
  };

  const stopLocationUpdates = (): void => {
    if (locationSubscriber) {
      locationSubscriber.remove();
      setLocationSubscriber(null);
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

  if (locationPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[FONTS.h3 as TextStyle, { color: COLORS.title, marginTop: 10 }]}>
          Meminta izin lokasi...
        </Text>
      </View>
    );
  }

  if (!locationPermission) {
    return (
      <View style={styles.loadingOverlay}>
        <Text style={[FONTS.h3 as TextStyle, { color: COLORS.title, marginLeft: 10 }]}>
          Izin lokasi tidak diberikan
        </Text>
      </View>
    );
  }

  if (!currentPosition) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={[FONTS.h3 as TextStyle, { color: COLORS.title, marginLeft: 10 }]}>
          Loading ...
        </Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: currentPosition.latitude,
    longitude: currentPosition.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, marginTop: insets.bottom }}>
        <View style={styles.container}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.white} />
            </View>
          )}

          <HeaderStyle
            // drawer={navigation.openDrawer}
            title={'Absen Checkin Toko'}
            rightIcon={'chat'}
          />

          <MapView
            style={styles.map}
            initialRegion={initialRegion}
          >
            <Marker coordinate={currentPosition} title={userName}>
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons name="map-marker-account-outline" size={34} color="#21A9F0" />
                <Text style={styles.titleMarker}>{userName}</Text>
              </View>
            </Marker>
          </MapView>

          <View style={styles.halfCard}>
            {!shouldShowCheckout ? (
              <View style={{
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <View style={{ marginTop: -90 }}>
                  <Text style={[FONTS.h4 as TextStyle, { color: COLORS.title, marginTop: '12%' }]}>
                    Absen Checkin
                  </Text>
                </View>

                <Text style={[FONTS.fontLg as TextStyle, { color: COLORS.warning, lineHeight: 17, marginBottom: 20 }]}>
                  Kunjungan Toko ke - {visitCount}
                </Text>

                <Text style={[FONTS.fontLg as TextStyle, { color: COLORS.title, lineHeight: 17 }]}>
                  {currentTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </Text>

                <View style={{ marginTop: 5 }}>
                  <ButtonLight color={COLORS.success} title={'Check In Toko'} onPress={handleAbsen} />
                </View>
              </View>
            ) : (
              <View style={{
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <View style={{
                  marginTop: -90,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={[FONTS.h6 as TextStyle, { color: COLORS.title, marginTop: '12%' }]}>
                    Anda Perlu Melakukan Checkout
                  </Text>
                  <Text style={[FONTS.h6 as TextStyle, { color: COLORS.title }]}>
                    Toko Sebelumnya
                  </Text>
                </View>

                <Text style={[FONTS.fontLg as TextStyle, { color: COLORS.title, lineHeight: 17, marginTop: 10 }]}>
                  {currentTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </Text>

                <View style={{ marginTop: 5 }}>
                  <ButtonLight color={COLORS.danger} title={'Check Out Toko'} onPress={handleCheckout} />
                </View>
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
    borderRadius: 15,
    marginTop: -50
  } as ViewStyle,
  map: {
    height: '100%',
  } as ViewStyle,
  halfCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  } as ViewStyle,
  titleMarker: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    marginLeft: 2,
  } as TextStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  loadingOverlay: {
    position: 'absolute',
    zIndex: 1,
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  } as ViewStyle,
});

export default AbsenSales;