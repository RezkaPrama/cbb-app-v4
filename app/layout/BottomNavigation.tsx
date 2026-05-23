import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/Home/Home';
import CustomNavigation from './CustomNavigation';
import AbsenSales from '../screens/Absen/AbsenSales';
import ScanRack from '../screens/Scan/ScanRack';
import ShelfScanner from '../screens/Scan/ShelfScanner';
// Import screens lain yang Anda punya
// import AbsenMasukScreen from '../screens/Absensi/AbsenMasuk';
// import ScanRackScreen from '../screens/Scan/ScanRack';
// import ProfileScreen from '../screens/Profile/Profile';

// Type definitions untuk Bottom Tab
export type BottomTabParamList = {
  HomeTab: undefined;
  AbsenMasuk?: undefined;
  ScanRack?: undefined;
  ShelfScanner?: undefined;
  Profile?: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomNavigation: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomNavigation {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="HomeTab"
    >
      <Tab.Screen 
        name="HomeTab"
        component={HomeScreen}
      />
      {/* Uncomment jika sudah ada screen-nya */}
      <Tab.Screen 
        name="ShelfScanner"
        component={ShelfScanner}
      />

      <Tab.Screen 
        name="AbsenMasuk"
        component={AbsenSales}
      />      
      {/* <Tab.Screen 
        name="Profile"
        component={ProfileScreen}
      /> */}
    </Tab.Navigator>
  );
};

export default BottomNavigation;