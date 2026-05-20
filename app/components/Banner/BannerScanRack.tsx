import React from 'react';
import { Image, ImageBackground, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, IMAGES } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define navigation types
type RootStackParamList = {
    ScanRack: undefined;
    // Add other routes here if needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BannerScanRack: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <>
            <ScrollView
                horizontal
                contentContainerStyle={styles.scrollContainer}
                showsHorizontalScrollIndicator={false}
            >
                <ImageBackground
                    source={IMAGES.eduPattern3}
                    style={styles.imageBackground}
                >
                    <Text style={styles.title}>Scan Rak!</Text>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('ScanRack')}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>Scan Rak</Text>
                    </TouchableOpacity>
                    <Image
                        style={styles.qrIcon}
                        source={IMAGES.qrcode}
                    />
                </ImageBackground>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        paddingLeft: 15,
        marginBottom: 15,
        paddingTop: 10,
    },
    imageBackground: {
        width: 330,
        height: 85,
        marginRight: 15,
        borderRadius: 15,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 20,
        paddingVertical: 20,
        paddingRight: 120,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: COLORS.white,
    },
    button: {
        backgroundColor: 'rgba(255,255,255,.25)',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 8,
    },
    buttonText: {
        ...FONTS.font,
        marginBottom: 2,
        ...FONTS.fontBold,
        color: COLORS.white,
    },
    qrIcon: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
        position: 'absolute',
        right: 26,
        top: 20,
    },
});

export default BannerScanRack;