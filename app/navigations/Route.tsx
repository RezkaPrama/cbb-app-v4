import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import OnBoardingScreen from '../screens/OnBoarding/OnBoardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import BottomNavigation from '../layout/BottomNavigation';
import AbsenAdmin from '../screens/Absen/AbsenAdmin';
import AbsenSales from '../screens/Absen/AbsenSales';
import Checkin from '../screens/Absen/Checkin';
import Checkout from '../screens/Absen/Checkout';
import MappingToko from '../screens/Mapping/MappingToko';
import ScanRack from '../screens/Scan/ScanRack';
import ShelfScanner from '../screens/Scan/ShelfScanner';
import ShelfForm from '../screens/Scan/ShelfForm';
import AttendanceWFH from '../screens/Absen/AttendanceWFH';
import AttendanceSiteVisitor from '../screens/Absen/AttendanceSiteVisitor';
import TrackHistoryScreen from '../screens/Absen/TrackingHistoryScreen';
import PiutangListScreen from '../screens/Piutang/PiutangListScreen';
import PiutangFormScreen from '../screens/Piutang/PiutangFormScreen';
import SalesOrderListScreen from '../screens/SalesPo/SalesOrderListScreen';
import SalesOrderFormScreen from '../screens/SalesPo/SalesOrderFormScreen';

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { login } from '../redux/Store/Store';
import { getDataLara } from '../utils/asyncStorage';
import { useSelector, useDispatch } from 'react-redux';

// Type definitions untuk navigation
export type RootStackParamList = {
  OnBoarding: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined; // Bottom Tab Navigator
  AbsenAdmin: undefined;
  AttendanceWFH: undefined;
  AttendanceSiteVisitor: undefined;
  MappingToko: undefined;
  ScanRack: undefined;
  ShelfScanner: undefined;
  TrackHistoryScreen: undefined;
  PiutangListScreen: undefined;
  PiutangFormScreen: undefined;  
  SalesOrderListScreen: undefined;
  SalesOrderFormScreen: undefined;
  // ✅ FIX: tambahkan tipe params yang sesuai dengan ShelfFormScreenProps
  ShelfForm: {
    scannedSerial?: string;
    scannedStore?: { pelanggan: string; namaToko: string };
    manualMode?: boolean;
    rackData?: {
      type_rack?: 'Batang' | 'Wagon' | 'Tower' | 'Backwall' | '';  // ✅ tambah Backwall
      size_rack?: 'Besar' | 'Kecil' | '';
      brand_rack?: 'Nayla' | 'My Foot' | 'Parker' | 'Walton' | 'Stairway' | 'Salma' | '';
      quota?: number;
    };
  };
  AbsenSales: undefined;
  Checkin: { visitCount: number };
  Checkout: {
    idAbsen: number;
    nameStore: string;
    visitCount: number;
  };
};

// Type untuk Redux state
interface RootState {
  auth: {
    isAuthenticated: boolean;
  };
}

const Stack = createStackNavigator<RootStackParamList>();

const Routes: React.FC = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Saat app dibuka, cek AsyncStorage dulu sebelum render navigator
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await getDataLara<string>('tokenUser');
        const userData = await getDataLara<any>('dataDetailUser');

        if (token && userData) {
          // Cek apakah token masih dalam 24 jam
          // JWT payload bagian kedua berisi exp (expiry)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);

            if (payload.exp && payload.exp > now) {
              // Token masih valid, restore session ke Redux
              dispatch(login({ user: userData, token }));
            }
            // Jika expired, biarkan — user akan lihat Login screen
          } catch {
            // Token tidak bisa di-parse, biarkan user login ulang
          }
        }
      } catch {
        // Gagal baca AsyncStorage, biarkan user login ulang
      } finally {
        setIsCheckingAuth(false);
      }
    };

    restoreSession();
  }, []);

  // Tampilkan loading spinner saat cek session
  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00215C' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#6200ee' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="OnBoarding" component={OnBoardingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={BottomNavigation} options={{ headerShown: false }} />
            <Stack.Screen name="AbsenAdmin" component={AbsenAdmin} options={{ headerShown: false }} />
            <Stack.Screen name="AttendanceWFH" component={AttendanceWFH} options={{ headerShown: false }} />
            <Stack.Screen name="AttendanceSiteVisitor" component={AttendanceSiteVisitor} options={{ headerShown: false }} />
            <Stack.Screen name="AbsenSales" component={AbsenSales} options={{ headerShown: false }} />
            <Stack.Screen name="Checkin" component={Checkin} options={{ headerShown: false, title: 'Check In Toko' }} />
            <Stack.Screen name="Checkout" component={Checkout} options={{ headerShown: false, title: 'Check Out Toko' }} />
            <Stack.Screen name="MappingToko" component={MappingToko} options={{ headerShown: false, title: 'Mapping Toko' }} />
            <Stack.Screen name="ScanRack" component={ScanRack} options={{ headerShown: false, title: 'Scan Rack' }} />
            <Stack.Screen name="ShelfScanner" component={ShelfScanner} options={{ headerShown: false, title: 'Shelf Scanner' }} />
            <Stack.Screen name="ShelfForm" component={ShelfForm} options={{ headerShown: false, title: 'Shelf Form' }} />
            <Stack.Screen name="TrackHistoryScreen" component={TrackHistoryScreen} options={{ headerShown: false, title: 'Track History' }} />
            <Stack.Screen
              name="PiutangListScreen"
              component={PiutangListScreen}
              options={{ headerShown: false, title: 'Pembayaran Piutang' }}
            />
            <Stack.Screen
              name="PiutangFormScreen"
              component={PiutangFormScreen}
              options={{ headerShown: false, title: 'Form Input Pembayaran' }}
            />

            <Stack.Screen
              name="SalesOrderListScreen"
              component={SalesOrderListScreen}
              options={{ headerShown: false, title: 'Sales Order' }}
            />
            <Stack.Screen
              name="SalesOrderFormScreen"
              component={SalesOrderFormScreen}
              options={{ headerShown: false, title: 'Form Sales Order' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Routes;