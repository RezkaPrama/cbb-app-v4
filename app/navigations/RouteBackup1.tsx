import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

// Import screens
import OnBoardingScreen from '../screens/OnBoarding/OnBoardingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import HomeScreen from '../screens/Home/Home';
import DrawerNavigation from './DrawerNavigation';
import AbsenAdmin from '../screens/Absen/AbsenAdmin';
import AbsenSales from '../screens/Absen/AbsenSales';
import Checkin from '../screens/Absen/Checkin';
import Checkout from '../screens/Absen/Checkout';
import MappingToko from '../screens/Mapping/MappingToko';
import ScanRack from '../screens/Scan/ScanRack';

// Type definitions untuk navigation
export type RootStackParamList = {
  OnBoarding: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  AbsenAdmin: undefined;
  MappingToko: undefined;
  ScanRack: undefined;
  AbsenSales: undefined; // Tambahkan type untuk AbsenSales
  Checkin: { visitCount: number }; // Tambahkan jika diperlukan
  Checkout: { // Tambahkan jika diperlukan
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
            {/* <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{
                headerShown: false,
              }}
            /> */}
          </>
        ) : (
          // Main App Stack - Tampil jika sudah login
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              // component={DrawerNavigation}
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen 
              name="AbsenAdmin" 
              component={AbsenAdmin}
              options={{
                headerShown: false,
                // Atau jika ingin dengan header:
                // title: 'Absen Admin',
              }}
            />
            <Stack.Screen 
              name="AbsenSales" 
              component={AbsenSales}
              options={{
                headerShown: false,
                // Atau jika ingin dengan header:
                // title: 'Absen Sales',
              }}
            />
            {/* Tambahkan screen Checkin dan Checkout jika diperlukan */}
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
            {/* <Stack.Screen 
              name="Profile" 
              component={Profile}
              options={{
                title: 'Profil',
              }}
            /> */}
            {/* <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{
                title: 'Pengaturan',
              }}
            /> */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Routes;