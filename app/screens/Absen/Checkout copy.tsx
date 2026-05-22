import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, FONTS, SIZES } from "../../../app/constants/theme";
import HeaderStyle1 from "../../components/Header/HeaderStyle1";
import { GlobalStyleSheet } from "../../constants/GlobalStyleSheet";
import CustomInput from "../../components/Input/CustomInput";
import moment from 'moment-timezone';
import { getDataLara } from "../../utils/asyncStorage";
import Toast from 'react-native-toast-message';
import axios, { AxiosError } from 'axios';
import CircleButton from "../../components/Input/CircleButton";

// Types
interface CheckoutRequestData {
  id: number;
  name_store: string;
  address_store: string;
  result: string;
  order_quantity: string | null;
  bill_quantity: string | null;
  timestamp_checkout: string;
}

interface CheckoutResponse {
  code: number;
  status: string;
  message?: string;
  errors?: Record<string, string[]>;
}

interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

type RootStackParamList = {
  Checkout: {
    idAbsen: number;
    nameStore: string;
    visitCount: number;
  };
  AbsenMasuk: undefined;
  AbsenSales: undefined;
  Main: undefined;
};

type CheckoutNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;
type CheckoutRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

interface CheckoutProps {
  navigation: CheckoutNavigationProp;
  route: CheckoutRouteProp;
}

const Checkout: React.FC<CheckoutProps> = ({ navigation, route }) => {
  const { idAbsen, nameStore, visitCount } = route.params;
  const { colors } = useTheme();
  const [addressStore, setAddressStore] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [orderQty, setOrderQty] = useState<string>('');
  const [billQty, setBillQty] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const storedToken = await getDataLara<string>("tokenUser");
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };
    fetchData();
  }, []);

  const handleCheckout = async (): Promise<void> => {
    setIsLoading(true);
    const jakartaTime = moment().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm:ss');

    // Validasi input sesuai dengan requirement API
    if (!nameStore || !addressStore.trim() || !result.trim()) {
      setIsLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Alamat Toko dan Hasil Kunjungan harus diisi!',
      });
      return;
    }

    try {
      const requestData: CheckoutRequestData = {
        id: idAbsen,
        name_store: nameStore,
        address_store: addressStore.trim(),
        result: result.trim(),
        order_quantity: orderQty.trim() || null,
        bill_quantity: billQty.trim() || null,
        timestamp_checkout: jakartaTime,
      };

      console.log('Checkout request data:', requestData);

      const response = await axios.post<CheckoutResponse>(
        'https://citrabarubusana.org/api/store-visit/check-out',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      console.log('Checkout response:', response.data);

      if (response.data.code === 200 && response.data.status === 'success') {
        Toast.show({
          type: 'success',
          text1: 'Sukses',
          text2: response.data.message || 'Absen Checkout Toko berhasil!',
        });
        navigation.navigate('Main');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.data.message || 'Absen checkout gagal',
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      console.error("Error during checkout:", axiosError);
      console.error("Error response:", axiosError.response?.data);
      console.error("Error status:", axiosError.response?.status);
      
      let errorMessage = 'Periksa Koneksi Internet Anda.';
      
      if (axiosError.response) {
        // Server responded with error status
        console.log("Full error response data:", JSON.stringify(axiosError.response.data, null, 2));
        
        if (axiosError.response.status === 422) {
          // Validation error
          const responseData = axiosError.response.data;
          
          if (responseData.errors) {
            // Laravel validation errors format
            const errorMessages = Object.entries(responseData.errors).map(([field, messages]) => {
              return `${field}: ${messages.join(', ')}`;
            });
            errorMessage = errorMessages.join('\n');
          } else if (responseData.message) {
            errorMessage = responseData.message;
          } else {
            errorMessage = 'Validation error - Data tidak valid';
          }
        } else {
          errorMessage = axiosError.response.data.message || `Server error: ${axiosError.response.status}`;
        }
      } else if (axiosError.request) {
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk memeriksa apakah tombol dapat diklik
  const isCheckoutEnabled: boolean = Boolean(
    nameStore && 
    addressStore.trim().length > 0 && 
    result.trim().length > 0
  );

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.white} />
        </View>
      )}
      <HeaderStyle1
        // drawer={navigation.openDrawer}
        title={'Absen Checkout Toko'}
        rightIcon={'chat'}
      />
      <ScrollView>
        <View style={styles.container}>
          <View style={[styles.card, { backgroundColor: COLORS.white }]}>
            <View style={{ 
              borderBottomWidth: 1, 
              borderColor: COLORS.background2, 
              paddingBottom: 8, 
              marginBottom: 20 
            }}>
              <Text style={[FONTS.h5 as TextStyle, { color: COLORS.white }]}>
                Input Hasil Kunjungan
              </Text>
            </View>
            
            {visitCount !== undefined && visitCount !== null && (
              <Text style={[FONTS.h7 as TextStyle, { color: COLORS.warning, marginBottom: 10 }]}>
                Kunjungan Toko ke - {visitCount}
              </Text>
            )}
            
            <Text style={[FONTS.h7 as TextStyle, { color: COLORS.title }]}>Nama Toko:</Text>
            <View style={[
              styles.displayField, 
              { backgroundColor: COLORS.white, borderColor: COLORS.borderColor }
            ]}>
              <Text style={[FONTS.h6 as TextStyle, { color: COLORS.text }]}>
                {nameStore || 'Nama toko tidak tersedia'}
              </Text>
            </View>

            <Text style={[FONTS.h7 as TextStyle, { color: COLORS.title, marginTop: '3%' }]}>
              Alamat Toko *
            </Text>
            <View style={{ marginBottom: 15 }}>
              <CustomInput
                value={addressStore}
                placeholder="Input Alamat Toko"
                onChangeText={(value: string) => setAddressStore(value)}
                multiline={true}
                numberOfLines={3}
              />
            </View>
            
            <Text style={[FONTS.h7 as TextStyle, { color: COLORS.title, marginTop: '3%' }]}>
              Jumlah Order (Opsional)
            </Text>
            <View style={{ marginBottom: 15 }}>
              <CustomInput
                value={orderQty}
                placeholder="Input Jumlah Order"
                onChangeText={(value: string) => setOrderQty(value)}
                keyboardType="numeric"
              />
            </View>

            <Text style={[FONTS.h7 as TextStyle, { color: COLORS.title, marginTop: '3%' }]}>
              Jumlah Tagihan (Opsional)
            </Text>
            <View style={{ marginBottom: 15 }}>
              <CustomInput
                value={billQty}
                placeholder="Input Jumlah Tagihan"
                onChangeText={(value: string) => setBillQty(value)}
                keyboardType="numeric"
              />
            </View>

            <Text style={[FONTS.h7 as TextStyle, { color: COLORS.title, marginTop: '3%' }]}>
              Hasil Kunjungan *
            </Text>
            <View style={{ marginBottom: 15 }}>
              <CustomInput
                value={result}
                placeholder="Input Hasil Kunjungan"
                onChangeText={(value: string) => setResult(value)}
                multiline={true}
                numberOfLines={4}
              />
            </View>

            <View style={{ marginTop: 10, alignItems: 'center' , marginBottom: 40}}>
                    <CircleButton 
                      icon="fingerprint" 
                      text="Check out" 
                      onPress={handleCheckout}
                    />
                  </View>

            {/* <TouchableOpacity
              style={[
                styles.button, 
                { backgroundColor: isCheckoutEnabled ? COLORS.primary5 : COLORS.primary5 }
              ]} 
              onPress={isCheckoutEnabled ? handleCheckout : undefined} 
              disabled={!isCheckoutEnabled} 
            >
              <Text style={[
                styles.buttonText, 
                { color: isCheckoutEnabled ? COLORS.text : COLORS.primary3 }
              ]}>
                {isCheckoutEnabled ? 'Checkout' : 'Lengkapi Data Terlebih Dahulu'}
              </Text>
            </TouchableOpacity> */}
            
          </View>
        </View>
      </ScrollView>
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background2,
    marginTop: 27
  } as ViewStyle,
  card: {
    padding: 15,
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
  button: {
    marginTop: 20,
    padding: 15,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  } as ViewStyle,
  buttonText: {
    ...FONTS.h6,
    textAlign: 'center',
  } as TextStyle,
  displayField: {
    padding: 15,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 15,
    marginTop: 5,
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

export default Checkout;