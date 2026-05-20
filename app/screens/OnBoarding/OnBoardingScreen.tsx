import React from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigations/Route';

// Import constants - sesuaikan path dengan struktur project Anda
import { COLORS, FONTS, IMAGES } from '../../constants/theme';

type OnBoardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OnBoarding'>;

interface Props {
    navigation: OnBoardingScreenNavigationProp;
}

const OnBoardingScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#0539BE', '#022685', '#00215C']}
                start={{ x: 0.0, y: 0.25 }}
                end={{ x: 0.5, y: 1.0 }}
                style={styles.gradient}
            >
                {/* Decorative gradient circles */}
                <LinearGradient
                    colors={['#1E5AF4', '#00215C']}
                    style={[styles.decorativeCircle, styles.circle1]}
                />

                <LinearGradient
                    colors={['#1152DE', '#00215C']}
                    style={[styles.decorativeCircle, styles.circle2]}
                />

                <LinearGradient
                    colors={['#0539BE', '#022685']}
                    style={styles.decorativeRectangle}
                />

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Logo/Image Section */}
                    <View style={styles.imageContainer}>
                        <Image
                            source={IMAGES.cbb1}
                            style={styles.logo}
                        />
                    </View>

                    {/* Content Section */}
                    <View style={styles.contentContainer}>
                        <View style={styles.card}>
                            <Text style={styles.title}>
                                Selamat Datang di CBB Apps
                            </Text>
                            <Text style={styles.subtitle}>
                                Silahkan Lakukan Login ..
                            </Text>
                            
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('Login')}
                                style={styles.signInButton}
                            >
                                <Text style={styles.buttonText}>
                                    Sign In App
                                </Text>
                                <LinearGradient
                                    colors={['#699EFF', '#0459F5']}
                                    style={styles.arrowCircle}
                                >
                                    <FeatherIcon
                                        name="arrow-right"
                                        size={24}
                                        color={COLORS.white}
                                    />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 9999,
    },
    circle1: {
        height: 180,
        width: 180,
        bottom: '23%',
        right: -70,
    },
    circle2: {
        height: 132,
        width: 132,
        bottom: -25,
        left: -30,
    },
    decorativeRectangle: {
        position: 'absolute',
        height: 400,
        width: 600,
        borderRadius: 42,
        left: -360,
        top: 50,
        transform: [{ rotate: '-35deg' }],
    },
    scrollContent: {
        flexGrow: 1,
    },
    imageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 14,
    },
    logo: {
        width: '80%',
        height: 230,
        resizeMode: 'contain',
    },
    contentContainer: {
        marginTop: -80,
        paddingBottom: 25,
        paddingLeft: 25,
        paddingRight: 25,
        paddingTop: 0,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,.08)',
        padding: 30,
        borderRadius: 18,
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 22,
        color: '#FFFFFF',
        marginTop: 2,
        marginBottom: 2,
    },
    subtitle: {
        fontFamily: 'NunitoSans-Regular',
        fontSize: 15,
        color: '#FFFFFF',
        opacity: 0.6,
        marginBottom: 25,
    },
    signInButton: {
        backgroundColor: '#FFFFFF',
        height: 55,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        paddingHorizontal: 25,
        paddingRight: 75,
        width: '100%',
    },
    buttonText: {
        fontFamily: 'NunitoSans-Regular',
        fontSize: 18,
        color: '#000000',
        top: 1,
    },
    arrowCircle: {
        height: 48,
        width: 48,
        borderRadius: 48,
        position: 'absolute',
        right: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default OnBoardingScreen;