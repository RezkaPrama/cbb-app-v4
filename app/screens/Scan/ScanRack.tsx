import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, FONTS } from '../../../app/constants/theme';
import HeaderStyle1 from '../../components/Header/HeaderStyle1';
import ButtonLight from '../../../app/components/Button/ButtonLight';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BarcodeScanningResult } from 'expo-camera';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const qrBoxSize = 150;
const cameraWidth = width * 1.2;
const cameraHeight = height * 0.9;

// Define navigation types
type RootStackParamList = {
    EditRak: { scannedData: string };
    ScanRack: undefined;
    // Add other routes as needed
};

type ScanRackNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScanRack'>;

interface ScanRackProps {
    navigation: ScanRackNavigationProp & {
        openDrawer?: () => void;
    };
}

const ScanRack: React.FC<ScanRackProps> = ({ navigation }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [scannedData, setScannedData] = useState<string>('');

    const handleBarCodeScanned = ({ data }: BarcodeScanningResult): void => {
        if (!scanned) {
            setScanned(true);
            setScannedData(data);
        }
    };

    const handleContinue = (): void => {
        setScanned(false);
        navigation.navigate('EditRak', { scannedData });
    };

    const resetScanner = (): void => {
        setScanned(false);
    };

    if (!permission) {
        // Camera permissions are still loading
        return (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.white} />
            </View>
        );
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <View style={styles.loadingOverlay}>
                <Text style={styles.permissionText}>Memerlukan izin kamera</Text>
                <ButtonLight
                    title="Berikan Izin Kamera"
                    onPress={requestPermission}
                />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
                <View style={styles.container}>
                    <HeaderStyle1
                        // drawer={navigation.openDrawer}
                        title="Scan Rak"
                        rightIcon="chat"
                    // style={styles.header}
                    />
                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={COLORS.white} />
                        </View>
                    )}
                    <View style={styles.cameraContainer}>
                        <CameraView
                            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                            barcodeScannerSettings={{
                                barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
                            }}
                            style={styles.camera}
                        />
                        <View style={styles.qrBox} />
                    </View>
                    {scanned && (
                        <View style={styles.halfCard}>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>Scan Rak</Text>
                                <ButtonLight title="Tap Scan Kembali" onPress={resetScanner} />
                                <View style={styles.buttonSpacing}>
                                    <ButtonLight
                                        color={COLORS.secondary}
                                        title="Lanjutkan Edit Rak"
                                        onPress={handleContinue}
                                    />
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </SafeAreaView>

        </SafeAreaProvider>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background2,
        marginTop: 7,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
    },
    loadingOverlay: {
        position: 'absolute',
        zIndex: 1,
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    permissionText: {
        ...FONTS.h3,
        color: COLORS.title,
        marginLeft: 10,
        marginBottom: 20,
    },
    cameraContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        borderRadius: 15,
    },
    camera: {
        width: cameraWidth,
        height: cameraHeight,
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 15,
        // marginTop: -10,
    },
    qrBox: {
        position: 'absolute',
        top: '30%',
        left: '50%',
        width: qrBoxSize,
        height: qrBoxSize,
        marginLeft: -(qrBoxSize / 2),
        marginTop: -(qrBoxSize / 2),
        borderWidth: 6,
        borderColor: '#fff',
        borderRadius: 10,
    },
    halfCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 280,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    cardContent: {
        marginTop: -90,
    },
    cardTitle: {
        ...FONTS.h4,
        color: COLORS.title,
        marginLeft: 40,
    },
    buttonSpacing: {
        marginTop: 10,
    },
});

export default ScanRack;