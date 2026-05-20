import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useFocusEffect, useTheme, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import HeaderStyle1 from "../../components/Header/HeaderStyle1";
import { GlobalStyleSheet } from "../../constants/GlobalStyleSheet";
import CustomInput from "../../components/Input/CustomInput";
import moment from 'moment-timezone';
import Toast from 'react-native-toast-message';
import CircleButton from "../../components/Input/CircleButton";
import * as Location from 'expo-location';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from "@react-native-picker/picker";
import { storeDataLara } from "../../utils/asyncStorage";
import { getDataLara } from "../../utils/asyncStorage";

// Types
interface Position {
  latitude: number;
  longitude: number;
}

interface UserPosition {
  id: number;
  name: string;
}

interface UserDetails {
  id: number;
  name: string;
  position: UserPosition;
}

interface PickerOption {
  label: string;
  value: string;
}

interface CheckInResponse {
  data?: {
    id: number;
  };
  message?: string;
  errors?: Record<string, string[] | string>;
}

type RootStackParamList = {
  Checkin: { visitCount: number };
  AbsenMasuk: undefined;
  AbsenSales: undefined;
  Home: undefined;
};

type CheckinNavigationProp = StackNavigationProp<RootStackParamList, 'Checkin'>;
type CheckinRouteProp = RouteProp<RootStackParamList, 'Checkin'>;

interface CheckinProps {
  navigation: CheckinNavigationProp;
  route: CheckinRouteProp;
}

const Checkin: React.FC<CheckinProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [nameStore, setNameStore] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [locationSubscriber, setLocationSubscriber] = useState<Location.LocationSubscription | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // Define picker options based on position
  const getPickerOptions = (): PickerOption[] => {
    if (userDetails?.position.name === 'ASUP') {
      return [
        { label: "Penawaran", value: "Penawaran" },
        { label: "Tagihan", value: "Tagihan" },
        { label: "SO", value: "SO" },
        { label: "Pasang Rak", value: "Pasang Rak" },
        { label: "Konfimarsi PO", value: "Konfimarsi PO" },
        { label: "Tarik Rak", value: "Tarik Rak" },
        { label: "Pengenolan", value: "Pengenolan" },
        { label: "Service Display & Maintanance", value: "Service Display & Maintanance" },
        { label: "Cek Kiriman", value: "Cek Kiriman" },
        { label: "Ambil Retur", value: "Ambil Retur" },
        { label: "Mapping", value: "Mapping" },
        { label: "CDM", value: "CDM" },
        { label: "Adm Kantor", value: "Adm Kantor" }
      ];
    } else if (userDetails?.position.name === 'Sales') {
      return [
        { label: "Penawaran", value: "Penawaran" },
        { label: "Tagihan", value: "Tagihan" },
        { label: "SO", value: "SO" },
        { label: "Pasang Rak", value: "Pasang Rak" },
        { label: "Konfimarsi PO", value: "Konfimarsi PO" },
        { label: "Tarik Rak", value: "Tarik Rak" },
        { label: "Pengenolan", value: "Pengenolan" },
        { label: "Service Display & Maintanance", value: "Service Display & Maintanance" },
        { label: "Cek Kiriman", value: "Cek Kiriman" },
        { label: "Ambil Retur", value: "Ambil Retur" },
      ];
    } else if (userDetails?.position.name === 'RSM') {
      return [
        { label: "Penawaran", value: "Penawaran" },
        { label: "Tagihan", value: "Tagihan" },
        { label: "SO", value: "SO" },
        { label: "Pasang Rak", value: "Pasang Rak" },
        { label: "Konfimarsi PO", value: "Konfimarsi PO" },
        { label: "Tarik Rak", value: "Tarik Rak" },
        { label: "Pengenolan", value: "Pengenolan" },
        { label: "Service Display & Maintanance", value: "Service Display & Maintanance" },
        { label: "Cek Kiriman", value: "Cek Kiriman" },
        { label: "Ambil Retur", value: "Ambil Retur" },
        { label: "Mapping", value: "Mapping" },
        { label: "CDM", value: "CDM" },
        { label: "Adm Kantor", value: "Adm Kantor" }
      ];
    }
    // Default options if position is neither ASUP nor Sales
    return [
      { label: "Penawaran", value: "Penawaran" },
      { label: "Tagihan", value: "Tagihan" },
      { label: "SO", value: "SO" },
      { label: "Pasang Rak", value: "Pasang Rak" },
      { label: "Konfimarsi PO", value: "Konfimarsi PO" },
      { label: "Tarik Rak", value: "Tarik Rak" },
      { label: "Pengenolan", value: "Pengenolan" },
      { label: "Service Display & Maintanance", value: "Service Display & Maintanance" },
      { label: "Cek Kiriman", value: "Cek Kiriman" },
      { label: "Ambil Retur", value: "Ambil Retur" },
    ];
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
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
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

  const handleAbsen = async (): Promise<void> => {
    setIsLoading(true);
    const jakartaTime = moment().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss');

    if (!currentPosition || !currentPosition.latitude || !currentPosition.longitude) {
      setIsLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Latitude dan Longitude tidak valid!',
      });
      return;
    }

    if (!nameStore.trim()) {
      setIsLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Nama toko harus diisi!',
      });
      return;
    }

    if (!purpose) {
      setIsLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Tujuan kunjungan harus dipilih!',
      });
      return;
    }

    if (!userDetails?.id) {
      setIsLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User ID tidak ditemukan!',
      });
      return;
    }

    try {
      const formBody = new URLSearchParams({
        latitude: currentPosition.latitude.toString(),
        longitude: currentPosition.longitude.toString(),
        timestamp_checkin: jakartaTime,
        salesman_id: userDetails.id.toString(),
        name_store: nameStore,
        purpose: purpose
      }).toString();

      console.log("Form body:", formBody);

      const response = await fetch("https://citrabarubusana.org/api/store-visit/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${token}`,
        },
        body: formBody
      });

      const responseData: CheckInResponse = await response.json();

      if (response.ok) {
        // Store ID for checkout later
        if (responseData.data && responseData.data.id) {
          await storeDataLara("storeVisitId", responseData.data.id.toString());
        }
        
        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: 'Absen Check In Toko berhasil!',
        });

        // navigation.navigate('AbsenSales');
        navigation.navigate('Home');
      } else {
        console.error("Error response from server:", responseData);
        let errorMessage = 'Absen gagal';
        
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
      console.error("Error during fetch:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Periksa Koneksi Internet Anda.',
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
        <View style={styles.container}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.white} />
            </View>
          )}
          <HeaderStyle1
            // drawer={navigation.openDrawer}
            title={'Absen Checkin Toko'}
            rightIcon={'chat'}
          />

          <ScrollView>
            <View style={styles.container}>
              <View style={[styles.card, {
                backgroundColor: COLORS.white,
              }]}>
                <View style={{ borderBottomWidth: 1, borderColor: COLORS.borderColor, paddingBottom: 8, marginBottom: 20 }}>
                  <Text style={[FONTS.h5 as TextStyle, { color: COLORS.title }]}>Checkin Toko</Text>
                </View>
                <View style={{ marginBottom: 15 }}>
                  <CustomInput
                    value={nameStore}
                    placeholder="Input Nama Toko"
                    onChangeText={(value: string) => setNameStore(value)}
                  />
                </View>

                <View style={{ marginBottom: 15 }}>
                  <Text style={[FONTS.fontLg as TextStyle, { color: colors.text }]}>Tujuan Kunjungan</Text>
                  <View style={styles.select}>
                    <Picker
                      selectedValue={purpose}
                      onValueChange={(itemValue: string) => setPurpose(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Pilih Tujuan Kunjungan" value="" />
                      {getPickerOptions().map((option) => (
                        <Picker.Item
                          key={option.value}
                          label={option.label}
                          value={option.value}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {nameStore.trim() !== '' && purpose !== '' && (
                  <View style={{ marginTop: 10, alignItems: 'center' }}>
                    <CircleButton 
                      icon="fingerprint" 
                      text="Checkin" 
                      onPress={handleAbsen}
                    />
                  </View>
                )}

                {/* <View style={{ marginTop: 10, alignItems: 'center' }}>
                  <CircleButton 
                    icon="fingerprint" 
                    text="Checkin" 
                    onPress={handleAbsen} 
                    // disabled={!nameStore.trim() || !purpose}
                  />
                </View> */}

              </View>
            </View>
          </ScrollView>
        </View>
        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop: -50,
    backgroundColor: COLORS.background2
  } as ViewStyle,
  card: {
    padding: 25,
    borderRadius: SIZES.radius,
    marginBottom: 15,
    shadowColor: "rgba(0,0,0,.6)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  } as ViewStyle,
  inputStyle: {
    ...FONTS.fontLg,
    height: 50,
    paddingLeft: 60,
    borderWidth: 1,
    borderRadius: SIZES.radius,
  } as TextStyle,
  inputIcon: {
    backgroundColor: COLORS.yellow,
    height: 40,
    width: 40,
    borderRadius: 10,
    position: 'absolute',
    left: 5,
    top: 5,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  eyeIcon: {
    position: 'absolute',
    height: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    right: 0,
    zIndex: 1,
    top: 0,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  select: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 8,
    height: 55,
  } as ViewStyle,
  picker: {
    height: 60,
    width: '100%',
  } as ViewStyle,
});

export default Checkin;