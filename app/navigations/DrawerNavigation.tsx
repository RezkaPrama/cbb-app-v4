import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DrawerMenu from '../layout/DrawerMenu';
import BottomNavigation from '../layout/BottomNavigation';

const Drawer = createDrawerNavigator();

const DrawerNavigation = () => {
    const { colors } = useTheme();

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: colors.card || '#fff',
            }}
        >
            <Drawer.Navigator
                drawerContent={(props) => <DrawerMenu {...props} homeNavigate="Home" />}
                screenOptions={{
                    headerShown: false,
                    drawerType: 'slide',
                    overlayColor: 'rgba(0,0,0,0.5)',
                }}
            >
                <Drawer.Screen
                    name="BottomNavigation"
                    component={BottomNavigation}
                />
            </Drawer.Navigator>
        </SafeAreaView>
    );
};

export default DrawerNavigation;