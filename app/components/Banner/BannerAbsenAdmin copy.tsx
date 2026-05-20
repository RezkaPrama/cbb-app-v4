import React, { useState } from 'react';
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
    Modal,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, FONTS, IMAGES } from '../../constants/theme';

// Define your navigation param list
type RootStackParamList = {
    AbsenAdmin: undefined;
    AttendanceWFH: undefined;
    // Add other routes as needed
};

type BannerAbsenAdminNavigationProp = StackNavigationProp<RootStackParamList>;

const BannerAbsenAdmin: React.FC = () => {
    const navigation = useNavigation<BannerAbsenAdminNavigationProp>();
    const [modalVisible, setModalVisible] = useState<boolean>(false);

    const handleAbsenPress = (): void => {
        setModalVisible(true);
    };

    const handleWFOPress = (): void => {
        setModalVisible(false);
        navigation.navigate('AbsenAdmin');
    };

    const handleWFHPress = (): void => {
        setModalVisible(false);
        navigation.navigate('AttendanceWFH');
    };

    const handleCloseModal = (): void => {
        setModalVisible(false);
    };

    return (
        <>
            <ScrollView
                horizontal
                contentContainerStyle={styles.scrollContent}
                showsHorizontalScrollIndicator={false}
            >
                <ImageBackground
                    source={IMAGES.eduPattern1}
                    style={styles.bannerBackground}
                >
                    <Text style={styles.titleText}>Absen Admin!</Text>
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

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleCloseModal}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={handleCloseModal}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Pilih Tipe Absen</Text>
                        <Text style={styles.modalSubtitle}>
                            Silakan pilih lokasi kerja Anda hari ini
                        </Text>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={handleWFOPress}
                        >
                            <Text style={styles.modalButtonText}>
                                🏢 Work From Office (WFO)
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonSecondary]}
                            onPress={handleWFHPress}
                        >
                            <Text style={styles.modalButtonText}>
                                🏠 Work From Home (WFH)
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCloseModal}
                        >
                            <Text style={styles.cancelButtonText}>Batal</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 25,
        width: '85%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    } as ViewStyle,
    modalTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: COLORS.primary || '#333',
        textAlign: 'center',
        marginBottom: 8,
    } as TextStyle,
    modalSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
    } as TextStyle,
    modalButton: {
        backgroundColor: COLORS.primary || '#007AFF',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    } as ViewStyle,
    modalButtonSecondary: {
        backgroundColor: COLORS.secondary || '#34C759',
    } as ViewStyle,
    modalButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: COLORS.white,
    } as TextStyle,
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginTop: 8,
    } as ViewStyle,
    cancelButtonText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: '#666',
    } as TextStyle,
});

export default BannerAbsenAdmin;