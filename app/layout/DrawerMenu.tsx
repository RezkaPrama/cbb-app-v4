import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Divider from '../components/Dividers/Divider';
import { COLORS, FONTS, IMAGES } from '../constants/theme';
import themeContext from '../constants/themeContext';
import { getDataLara } from '../utils/asyncStorage';

// SVG Icons
const home = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#bfc9da">
<path d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z"></path>
</svg>`;

const logout = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#bfc9da"><g></g><g><g><path d="M5,5h6c0.55,0,1-0.45,1-1v0c0-0.55-0.45-1-1-1H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h6c0.55,0,1-0.45,1-1v0 c0-0.55-0.45-1-1-1H5V5z"></path><path d="M20.65,11.65l-2.79-2.79C17.54,8.54,17,8.76,17,9.21V11h-7c-0.55,0-1,0.45-1,1v0c0,0.55,0.45,1,1,1h7v1.79 c0,0.45,0.54,0.67,0.85,0.35l2.79-2.79C20.84,12.16,20.84,11.84,20.65,11.65z"></path></g></g></svg>`;

const dark = `<svg class="dark" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#bfc9da"><g></g><g><g><g><path d="M11.57,2.3c2.38-0.59,4.68-0.27,6.63,0.64c0.35,0.16,0.41,0.64,0.1,0.86C15.7,5.6,14,8.6,14,12s1.7,6.4,4.3,8.2 c0.32,0.22,0.26,0.7-0.09,0.86C16.93,21.66,15.5,22,14,22c-6.05,0-10.85-5.38-9.87-11.6C4.74,6.48,7.72,3.24,11.57,2.3z"></path></g></g></g>
</svg>`;

// Types
interface UserDetails {
  id: number;
  name: string;
  username?: string;
  email?: string;
  employee_name?: string;
  role_name?: string;
  branch_name?: string;
  position_name?: string;
  profile_pic?: string;
}

interface DrawerMenuProps extends DrawerContentComponentProps {
  homeNavigate?: string;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({ homeNavigate, navigation }) => {
  const theme = useTheme();
  const { colors } = theme;
//   const { setDarkTheme, setLightTheme } = React.useContext(themeContext);

  const [token, setToken] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  const handleLogout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('tokenUser');
      await AsyncStorage.removeItem('dataDetailUser');
      await AsyncStorage.removeItem('idAbsenCheckIn');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const storedToken = await getDataLara<string>('tokenUser');
        const storedUserDetails = await getDataLara<UserDetails>('dataDetailUser');
        setToken(storedToken);
        setUserDetails(storedUserDetails);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.card, marginTop: '7%' }}>
      {/* Header with User Info */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 15,
          paddingVertical: 15,
          backgroundColor: COLORS.primary,
        }}
      >
        <View
          style={{
            borderRadius: 50,
            borderWidth: 2,
            borderColor: COLORS.white,
            marginRight: 12,
          }}
        >
          <Image
            style={{
              height: 48,
              width: 48,
              borderRadius: 50,
            }}
            source={IMAGES.user}
          />
        </View>
        <View>
          {userDetails && (
            <Text style={{ ...FONTS.h6, color: COLORS.white, lineHeight: 20 }}>
              {userDetails.name}
            </Text>
          )}
          {userDetails && (
            <Text style={{ ...FONTS.font, color: COLORS.white }}>
              {userDetails.role_name || '-'}
            </Text>
          )}
        </View>
      </View>

      {/* Menu Items */}
      <View style={{ paddingHorizontal: 15, paddingVertical: 20, flex: 1 }}>
        <Text style={{ ...FONTS.h6, color: COLORS.title, marginBottom: 5 }}>
          Main menu
        </Text>

        <TouchableOpacity
          onPress={() => {
            navigation.navigate(homeNavigate || 'Home');
          }}
          style={[styles.navLink]}
        >
          <SvgXml style={{ marginRight: 10 }} xml={home} />
          <Text style={[styles.navText, { color: colors.text }]}>Home</Text>
          <FeatherIcon size={16} color={colors.text} name={'chevron-right'} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={[styles.navLink]}>
          <SvgXml style={{ marginRight: 10 }} xml={logout} />
          <Text style={[styles.navText, { color: colors.text }]}>Logout</Text>
          <FeatherIcon size={16} color={colors.text} name={'chevron-right'} />
        </TouchableOpacity>

        <Divider />

        <Text style={{ ...FONTS.h6, color: COLORS.title, marginBottom: 5 }}>
          Settings
        </Text>
      </View>

      {/* Footer */}
      <View style={{ paddingBottom: 30, paddingHorizontal: 15, paddingTop: 20 }}>
        <Text style={{ ...FONTS.h6, color: COLORS.title }}>
          CBB Apps - Sales Apps
        </Text>
        <Text style={{ ...FONTS.font, color: colors.text }}>App Version 4.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  navText: {
    ...FONTS.font,
    color: COLORS.title,
    flex: 1,
  },
});

export default DrawerMenu;