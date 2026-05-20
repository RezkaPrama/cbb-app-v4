import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { COLORS, FONTS } from "../../../app/constants/theme";
import { getDataLara } from "../../utils/asyncStorage";
import HeaderStyle1 from "../../components/Header/HeaderStyle1";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import axios, { AxiosError } from 'axios';
import CustomInput from "../../components/Input/CustomInput";
import ButtonLight4 from "../../components/Button/ButtonLight4";
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const { height } = Dimensions.get('window');

// Type definitions
interface Position {
  latitude: number;
  longitude: number;
}

interface UserDetails {
  employee_name: string;
  id_user: number;
}

interface PhotoAsset {
  uri: string;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

type RootStackParamList = {
  MappingToko: undefined;
  // Add other routes as needed
};

type Props = NativeStackScreenProps<RootStackParamList, 'MappingToko'>;

const MappingToko: React.FC<Props> = ({ navigation }) => {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [markerPosition, setMarkerPosition] = useState<Position | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const [locationSubscriber, setLocationSubscriber] = useState<Location.LocationSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [nameStore, setNameStore] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [alamatToko, setAlamatToko] = useState<string>('');
  const [nameOwner, setNameOwner] = useState<string>('');
  const [contactOwner, setContactOwner] = useState<string>('');
  const [CategoryStore, setCategoryStore] = useState<string>('');
  const [competitors, setCompetitors] = useState<string>('');
  const [mapRef, setMapRef] = useState<MapView | null>(null);
  const [photo, setPhoto] = useState<PhotoAsset | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const storedToken = await getDataLara("tokenUser");
      const storedUserDetails = await getDataLara("dataDetailUser");
      setToken(storedToken);
      setUserDetails(storedUserDetails);
      setUserName(storedUserDetails.employee_name);
      setUserId(storedUserDetails.id_user);
    };
    fetchData();
  }, []);

  const requestLocationPermission = async (): Promise<void> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === "granted");

    if (status !== "granted") {
      Toast.show({
        type: 'error',
        text1: 'Permission denied',
        text2: 'Permission to access location was denied'
      });
    }
  };

  const startLocationUpdates = async (): Promise<void> => {
    if (locationPermission) {
      const location = await Location.getCurrentPositionAsync({});
      const initialPosition: Position = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentPosition(initialPosition);
      setMarkerPosition(initialPosition);

      if (mapRef) {
        mapRef.animateToRegion({
          latitude: initialPosition.latitude,
          longitude: initialPosition.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 100);
      }
    }
  };

  const getAdjustedRegion = (position: Position | null): Region | null => {
    if (!position) return null;

    const latitudeOffset = 0.0922 * 0.2;

    return {
      latitude: position.latitude - latitudeOffset,
      longitude: position.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  };

  const CurrentLocationButton: React.FC = () => (
    <TouchableOpacity
      style={styles.currentLocationButton}
      onPress={() => {
        if (currentPosition && mapRef) {
          const adjustedRegion = getAdjustedRegion(currentPosition);
          if (adjustedRegion) {
            mapRef.animateToRegion(adjustedRegion, 1000);
          }
          setMarkerPosition(currentPosition);
        }
      }}
    >
      <View style={styles.buttonContent}>
        <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#21A9F0" />
        <Text style={styles.buttonText}>Lokasi Saya</Text>
      </View>
    </TouchableOpacity>
  );

  useFocusEffect(
    useCallback(() => {
      requestLocationPermission();
      startLocationUpdates();

      return () => {
        if (locationSubscriber) {
          locationSubscriber.remove();
        }
      };
    }, [locationPermission])
  );

  const requestCameraPermission = async (): Promise<void> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission denied',
        text2: 'Permission to access camera was denied'
      });
    }
  };

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const resizeImage = async (uri: string): Promise<PhotoAsset> => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult;
    } catch (error) {
      console.error('Error resizing image:', error);
      throw error;
    }
  };

  const handleTakePhoto = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const resizedPhoto = await resizeImage(result.assets[0].uri);
        setPhoto(resizedPhoto);
        Toast.show({
          type: 'success',
          text1: 'Foto berhasil diambil',
          text2: 'Foto telah ditambahkan ke Input'
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Gagal mengambil foto'
      });
    }
  };

  const handleMapping = async (): Promise<void> => {
    setIsLoading(true);

    try {
      if (!nameStore || !alamatToko || !nameOwner || !photo) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Semua field termasuk foto harus diisi!',
        });
        setIsLoading(false);
        return;
      }

      if (!currentPosition || !currentPosition.latitude || !currentPosition.longitude) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Tidak dapat mendapatkan lokasi saat ini!',
        });
        setIsLoading(false);
        return;
      }

      if (!userId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'User ID tidak ditemukan!',
        });
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('register', userId.toString());
      formData.append('name_store', nameStore.trim());
      formData.append('address_store', alamatToko.trim());
      formData.append('pic_store', nameOwner.trim());
      formData.append('contact_store', contactOwner.trim());
      formData.append('category_store', CategoryStore.trim());
      formData.append('competitors', competitors.trim());
      formData.append('latitude', currentPosition.latitude.toString());
      formData.append('longitude', currentPosition.longitude.toString());

      console.log('Data yang akan dikirim:', {
        register: userId.toString(),
        name_store: nameStore.trim(),
        address_store: alamatToko.trim(),
        pic_store: nameOwner.trim(),
        contact_store: contactOwner.trim(),
        category_store: CategoryStore.trim(),
        competitors: competitors.trim(),
        latitude: currentPosition.latitude.toString(),
        longitude: currentPosition.longitude.toString()
      });

      const photoFileName = photo.uri.split('/').pop() || 'photo.jpg';
      const photoType = 'image/jpeg';
      formData.append('photo', {
        uri: photo.uri,
        name: photoFileName,
        type: photoType
      } as any);

      const response = await axios({
        method: 'POST',
        url: 'https://app.citrabarubusana.com/api/CustomerMapping',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        data: formData
      });

      console.log('Response from server:', response.data);

      if (response.data.success || response.status === 200) {
        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: 'Data Mapping toko berhasil disimpan!',
        });

        setNameStore('');
        setAlamatToko('');
        setNameOwner('');
        setContactOwner('');
        setCategoryStore('');
        setCompetitors('');
        setPhoto(null);

        navigation.goBack();
      } else {
        throw new Error(response.data.message || 'Terjadi kesalahan saat menyimpan data');
      }

    } catch (error) {
      console.error('Detail error:', error);

      let errorMessage = 'Terjadi kesalahan saat menyimpan data toko';

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        
        if (axiosError.response) {
          console.log('Error response data:', axiosError.response.data);
          console.log('Error response status:', axiosError.response.status);
          console.log('Error response headers:', axiosError.response.headers);

          errorMessage = axiosError.response.data?.message ||
            axiosError.response.data?.error ||
            'Server error: ' + axiosError.response.status;
        } else if (axiosError.request) {
          console.log('Error request:', axiosError.request);
          errorMessage = 'Tidak ada respon dari server';
        } else {
          console.log('Error message:', axiosError.message);
          errorMessage = axiosError.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const PhotoSection: React.FC = () => (
    <View style={styles.photoSection}>
      <TouchableOpacity
        style={styles.photoButton}
        onPress={handleTakePhoto}
      >
        <MaterialCommunityIcons name="camera" size={24} color="#21A9F0" />
        <Text style={styles.photoButtonText}>
          {photo ? 'Ubah Foto' : 'Ambil Foto'}
        </Text>
      </TouchableOpacity>
      {photo && photo.uri && (
        <View style={styles.photoPreviewContainer}>
          <Image
            source={{ uri: photo.uri }}
            style={styles.photoPreview}
            resizeMode="cover"
          />
        </View>
      )}
    </View>
  );

  if (!locationPermission) {
    return (
      <View style={styles.loadingOverlay}>
        <Text style={{ ...FONTS.h3, color: COLORS.title, marginLeft: 10 }}>
          Izin lokasi tidak diberikan
        </Text>
      </View>
    );
  }

  if (!currentPosition) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ ...FONTS.h3, color: COLORS.title, marginLeft: 10 }}>
          Loading ...
        </Text>
      </View>
    );
  }

  const adjustedRegion = getAdjustedRegion(currentPosition);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background2 }}>
        <View style={styles.container}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.white} />
            </View>
          )}

          <HeaderStyle1
            // drawer={navigation.openDrawer}
            title={'Mapping Toko Baru'}
            rightIcon={'chat'}
          />

          <MapView
            ref={ref => setMapRef(ref)}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={adjustedRegion || undefined}
            onMapReady={() => {
              if (currentPosition && adjustedRegion) {
                mapRef?.animateToRegion(adjustedRegion, 100);
              }
            }}
          >
            {currentPosition && (
              <Marker
                coordinate={currentPosition}
                draggable={false}
              >
                <View style={{ alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name="map-marker-account-outline"
                    size={34}
                    color="#21A9F0"
                  />
                  <View style={styles.markerLabelContainer}>
                    <Text style={styles.titleMarker}>
                      {nameStore || 'Lokasi Toko'}
                    </Text>
                  </View>
                </View>
              </Marker>
            )}
          </MapView>

          <CurrentLocationButton />

          <View style={styles.halfCard}>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollViewContent}
            >
              <View style={styles.formContainer}>
                <Text style={{ ...FONTS.h4, color: COLORS.title, marginBottom: 10 }}>
                  Tambah Mapping Toko
                </Text>

                <View style={{ marginBottom: 5 }}>
                  <CustomInput
                    placeholder="Nama Toko"
                    value={nameStore}
                    onChangeText={setNameStore}
                    style={styles.input}
                  />
                </View>

                <View style={{ marginBottom: 5 }}>
                  <CustomInput
                    placeholder="Alamat Toko"
                    value={alamatToko}
                    onChangeText={setAlamatToko}
                    style={styles.input}
                  />
                </View>

                <View style={{ marginBottom: 5 }}>
                  <CustomInput
                    placeholder="PIC Toko"
                    value={nameOwner}
                    onChangeText={setNameOwner}
                    style={styles.input}
                  />
                </View>

                <View style={{ marginBottom: 5 }}>
                  <CustomInput
                    placeholder="No Kontak PIC Toko"
                    value={contactOwner}
                    onChangeText={setContactOwner}
                    style={styles.input}
                  />
                </View>

                <View style={{ marginBottom: 5 }}>
                  <CustomInput
                    placeholder="Kategori Toko"
                    value={CategoryStore}
                    onChangeText={setCategoryStore}
                    style={styles.input}
                  />
                </View>

                <View style={{ marginBottom: 5 }}>
                  <CustomInput
                    placeholder="Kompetitor Toko"
                    value={competitors}
                    onChangeText={setCompetitors}
                    style={styles.input}
                  />
                </View>

                <PhotoSection />

                {nameStore.trim() !== '' && (
                  <View style={styles.buttonContainer}>
                    <ButtonLight4
                    //   icon="content-save"
                      title="Simpan"
                      onPress={handleMapping}
                    />
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 15,
  },
  map: {
    height: '100%',
    width: '100%',
  },
  halfCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  formContainer: {
    paddingTop: 20,
  },
  input: {
    marginBottom: 10,
  },
  photoSection: {
    marginVertical: 15,
    alignItems: 'center',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21A9F0',
    marginBottom: 10,
  },
  photoButtonText: {
    marginLeft: 8,
    color: '#21A9F0',
    fontFamily: "Poppins-Medium",
    fontSize: 14,
  },
  photoPreviewContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoPreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  markerLabelContainer: {
    backgroundColor: 'white',
    borderRadius: 4,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  titleMarker: {
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: '#000000',
  },
  currentLocationButton: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    marginLeft: 8,
    fontFamily: "Poppins-Medium",
    fontSize: 14,
    color: '#21A9F0',
  },
  saveButton: {
    backgroundColor: '#21A9F0',
    borderRadius: 8,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    marginLeft: 8,
    fontFamily: "Poppins-Medium",
    fontSize: 16,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    zIndex: 1,
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});

export default MappingToko;