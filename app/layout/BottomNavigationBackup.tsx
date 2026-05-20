import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import HomeScreen from '../screens/Home/Home';
// Import screens lain yang Anda punya
// import AbsenMasukScreen from '../screens/Absensi/AbsenMasuk';
// import ScanRackScreen from '../screens/Rack/ScanRack';
// import NotificationsScreen from '../screens/Notifications/Notifications';

// Type definitions untuk Bottom Tab
export type BottomTabParamList = {
  Home: undefined;
  AbsenMasuk?: undefined;
  ScanRack?: undefined;
  Notifications?: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomNavigation: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border || '#e0e0e0',
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      {/* Uncomment jika sudah ada screen-nya */}
      {/* <Tab.Screen
        name="AbsenMasuk"
        component={AbsenMasukScreen}
        options={{
          tabBarLabel: 'Absensi',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user-check" size={size} color={color} />
          ),
        }}
      /> */}
      {/* <Tab.Screen
        name="ScanRack"
        component={ScanRackScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <Feather name="camera" size={size} color={color} />
          ),
        }}
      /> */}
      {/* <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Notif',
          tabBarIcon: ({ color, size }) => (
            <Feather name="bell" size={size} color={color} />
          ),
        }}
      /> */}
    </Tab.Navigator>
  );
};

export default BottomNavigation;