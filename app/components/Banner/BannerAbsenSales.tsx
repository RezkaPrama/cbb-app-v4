import React from 'react';
import {
    Image,
    ImageBackground,
    ScrollView,
    Text,
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ImageStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, FONTS, IMAGES } from '../../constants/theme';

// Define your navigation param list
type RootStackParamList = {
    AbsenSales: undefined;
    // Add other routes as needed
};

type BannerAbsenSalesNavigationProp = StackNavigationProp<RootStackParamList>;

const BannerAbsenSales: React.FC = () => {
    const navigation = useNavigation<BannerAbsenSalesNavigationProp>();

    const handleAbsenPress = (): void => {
        navigation.navigate('AbsenSales');
    };

    return (
        <ScrollView
            horizontal
            contentContainerStyle={styles.scrollContent}
            showsHorizontalScrollIndicator={false}
        >
            <ImageBackground
                source={IMAGES.eduPattern1}
                style={styles.bannerBackground}
            >
                <Text style={styles.titleText}>Absen Sales !</Text>
                <Text style={styles.descText}>Check In Toko :</Text>
                <TouchableOpacity
                    onPress={handleAbsenPress}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Absen Sekarang</Text>
                </TouchableOpacity>
                <Image
                    style={styles.fingerprintImage}
                    source={IMAGES.fingerprint}
                />
            </ImageBackground>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingLeft: 15,
        marginBottom: 15,
        paddingTop: 10,
    } as ViewStyle,
    bannerBackground: {
        width: 330,
        height: 169,
        marginRight: 15,
        borderRadius: 15,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: 20,
        paddingVertical: 20,
        paddingRight: 120,
    } as ViewStyle,
    titleText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: COLORS.white,
    } as TextStyle,
    descText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: COLORS.white,
    } as TextStyle,
    button: {
        backgroundColor: 'rgba(255,255,255,.25)',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 8,
    } as ViewStyle,
    buttonText: {
        ...(FONTS.font as TextStyle),
        marginBottom: 2,
        ...(FONTS.fontBold as TextStyle),
        color: COLORS.white,
    } as TextStyle,
    fingerprintImage: {
        width: 125,
        height: 185,
        resizeMode: 'contain',
        position: 'absolute',
        right: 0,
        top: 0,
    } as ImageStyle,
});

export default BannerAbsenSales;