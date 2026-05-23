import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
// import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons'; // ganti Feather → Ionicons
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

interface CustomNavigationProps extends BottomTabBarProps { }

const CustomNavigation: React.FC<CustomNavigationProps> = ({
    state,
    descriptors,
    navigation
}) => {

    // const getIconName = (routeName: string): keyof typeof Feather.glyphMap => {
    //     switch (routeName) {
    //         case 'HomeTab':
    //             return 'home';        // Ganti dengan: 'grid', 'layout', 'trello'
    //         case 'AbsenMasuk':
    //             return 'clock';  // Ganti dengan: 'clock', 'check-circle', 'calendar'
    //         case 'ScanRack':
    //             return 'camera';      // Ganti dengan: 'aperture', 'scan', 'maximize'
    //         case 'Profile':
    //             return 'user';        // Ganti dengan: 'settings', 'menu', 'more-horizontal'
    //         default:
    //             return 'circle';
    //     }
    // };

    const getIconName = (routeName: string, isFocused: boolean): keyof typeof Ionicons.glyphMap => {
        switch (routeName) {
            case 'HomeTab':
                return isFocused ? 'home' : 'home-outline';
            case 'AbsenMasuk':
                return isFocused ? 'finger-print' : 'finger-print-outline';
            case 'ShelfScanner':
                return isFocused ? 'qr-code' : 'qr-code-outline';
            case 'Profile':
                return isFocused ? 'person' : 'person-outline';
            default:
                return 'ellipse-outline';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    // const iconName = getIconName(route.name);
                    const iconName = getIconName(route.name, isFocused);

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.tabButton}
                        >
                            <View style={[
                                styles.iconContainer,
                                isFocused && styles.iconContainerActive
                            ]}>
                                {/* <Feather
                                    name={iconName}
                                    size={24}
                                    color={isFocused ? '#fff' : '#999'}
                                /> */}
                                <Ionicons  // ganti Feather → Ionicons
                                    name={iconName}
                                    size={24}
                                    color={isFocused ? '#fff' : '#999'}
                                />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 60,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        justifyContent: 'space-around',
        alignItems: 'center',
        minHeight: 60,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 90,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    iconContainerActive: {
        borderRadius: 90,
        backgroundColor: '#4cb1ff',
        shadowColor: '#4cb1ff',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default CustomNavigation;