import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

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
   // ✅ FIX: tambahkan tipe params yang sesuai dengan ShelfFormScreenProps
  ShelfForm: {
    scannedSerial?: string;
    scannedStore?: { pelanggan: string; namaToko: string };
    manualMode?: boolean;
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
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6200ee',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontFamily: 'Poppins-SemiBold',
          },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack - Tampil jika belum login
          <>
            <Stack.Screen 
              name="OnBoarding" 
              component={OnBoardingScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          // Main App Stack - Tampil jika sudah login dengan Bottom Navigation
          <>
            {/* Bottom Tab Navigator sebagai screen utama */}
            <Stack.Screen 
              name="Main" 
              component={BottomNavigation}
              options={{
                headerShown: false
              }}
            />
            
            {/* Screen-screen lain yang di-stack di atas Bottom Navigation */}
            <Stack.Screen 
              name="AbsenAdmin" 
              component={AbsenAdmin}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="AttendanceWFH" 
              component={AttendanceWFH}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="AttendanceSiteVisitor" 
              component={AttendanceSiteVisitor}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="AbsenSales" 
              component={AbsenSales}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Checkin" 
              component={Checkin}
              options={{
                headerShown: false,
                title: 'Check In Toko',
              }}
            />
            <Stack.Screen 
              name="Checkout" 
              component={Checkout}
              options={{
                headerShown: false,
                title: 'Check Out Toko',
              }}
            />
            <Stack.Screen 
              name="MappingToko" 
              component={MappingToko}
              options={{
                headerShown: false,
                title: 'Mapping Toko',
              }}
            />
            <Stack.Screen 
              name="ScanRack" 
              component={ScanRack}
              options={{
                headerShown: false,
                title: 'Scan Rack',
              }}
            />
            <Stack.Screen 
              name="ShelfScanner" 
              component={ShelfScanner}
              options={{
                headerShown: false,
                title: 'Shelf Scanner',
              }}
            />
            <Stack.Screen 
              name="ShelfForm" 
              component={ShelfForm}
              options={{
                headerShown: false,
                title: 'Shelf Form',
              }}
            />

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Routes;