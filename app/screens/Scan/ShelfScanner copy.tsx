import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Alert,
    StatusBar,
    ActivityIndicator,
    Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// ─── Types ────────────────────────────────────────────────────────────────────

type RootStackParamList = {
    Home: undefined;
    ShelfScanner: undefined;
    ShelfForm: { scannedSerial: string };
};

type ShelfScannerNavigationProp = StackNavigationProp<RootStackParamList, 'ShelfScanner'>;
type ShelfScannerRouteProp = RouteProp<RootStackParamList, 'ShelfScanner'>;

interface ShelfScannerScreenProps {
    navigation: ShelfScannerNavigationProp;
    route: ShelfScannerRouteProp;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * CornerBracket — sudut persegi target scanner (4 posisi)
 */
const CornerBracket = ({
    position,
}: {
    position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}) => {
    const SIZE = 28;
    const THICKNESS = 4;
    const RADIUS = 6;
    const COLOR = '#00e5ff';

    const isTop = position === 'topLeft' || position === 'topRight';
    const isLeft = position === 'topLeft' || position === 'bottomLeft';

    return (
        <View
            style={[
                styles.cornerBase,
                isTop ? { top: -THICKNESS / 2 } : { bottom: -THICKNESS / 2 },
                isLeft ? { left: -THICKNESS / 2 } : { right: -THICKNESS / 2 },
            ]}
        >
            {/* Horizontal bar */}
            <View
                style={{
                    position: 'absolute',
                    width: SIZE,
                    height: THICKNESS,
                    backgroundColor: COLOR,
                    borderRadius: RADIUS,
                    top: isTop ? 0 : undefined,
                    bottom: isTop ? undefined : 0,
                    left: isLeft ? 0 : undefined,
                    right: isLeft ? undefined : 0,
                }}
            />
            {/* Vertical bar */}
            <View
                style={{
                    position: 'absolute',
                    width: THICKNESS,
                    height: SIZE,
                    backgroundColor: COLOR,
                    borderRadius: RADIUS,
                    top: isTop ? 0 : undefined,
                    bottom: isTop ? undefined : 0,
                    left: isLeft ? 0 : undefined,
                    right: isLeft ? undefined : 0,
                }}
            />
        </View>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ShelfScannerScreen: React.FC<ShelfScannerScreenProps> = ({ navigation }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanMode, setScanMode] = useState<'scan' | 'processing'>('scan');
    const [flashOn, setFlashOn] = useState(false);
    const insets = useSafeAreaInsets();

    // Laser line animation
    const laserAnim = useRef(new Animated.Value(0)).current;
    // Fade-in for overlay
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    // Start laser sweep loop
    useEffect(() => {
        Animated.sequence([
            Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();

        const laserLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(laserAnim, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(laserAnim, {
                    toValue: 0,
                    duration: 1800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        laserLoop.start();
        return () => laserLoop.stop();
    }, []);

    // ── Permission: loading ───────────────────────────────────────────────────
    if (!permission) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00e5ff" />
                <Text style={styles.loadingText}>Memuat perizinan kamera...</Text>
            </View>
        );
    }

    // ── Permission: denied ────────────────────────────────────────────────────
    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#070b19" />
                <View style={styles.permissionInner}>
                    {/* Icon */}
                    <View style={styles.permissionIconCircle}>
                        <FeatherIcon name="camera-off" size={36} color="#8fb2ff" />
                    </View>

                    <Text style={styles.permissionTitle}>Izin Kamera Diperlukan</Text>
                    <Text style={styles.permissionSubtitle}>
                        Aplikasi CBB membutuhkan akses kamera untuk memindai QR-Code pada rak toko mitra.
                    </Text>

                    <TouchableOpacity
                        onPress={requestPermission}
                        style={styles.permissionBtn}
                        activeOpacity={0.85}
                    >
                        <FeatherIcon name="camera" size={16} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.permissionBtnText}>Berikan Izin Kamera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backTextBtn}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backTextBtnLabel}>Kembali ke Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Handle scan success ───────────────────────────────────────────────────
    const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;
        setScanned(true);
        setScanMode('processing');

        // Simulasi 800ms processing feedback sebelum Alert
        setTimeout(() => {
            Alert.alert(
                '🟢 Rak Ditemukan!',
                `Serial Number: ${data}\n\nApakah Anda ingin mengisi laporan kondisi rak ini?`,
                [
                    {
                        text: 'Batal',
                        style: 'cancel',
                        onPress: () => {
                            setScanned(false);
                            setScanMode('scan');
                        },
                    },
                    {
                        text: 'Isi Laporan',
                        onPress: () => {
                            setScanned(false);
                            setScanMode('scan');
                            navigation.navigate('ShelfForm', { scannedSerial: data });
                        },
                    },
                ]
            );
        }, 800);
    };

    // ── Laser translateY (0 → WINDOW_SIZE) ────────────────────────────────────
    const WINDOW_SIZE = 260;
    const laserTranslateY = laserAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, WINDOW_SIZE - 4],
    });

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Camera feed - full screen */}
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                enableTorch={flashOn}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Dark overlay - top, sides, bottom (cutout window di tengah) */}
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>

                {/* ── Top bar: back + title + flash ──────────────────────── */}
                <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.iconBtn}
                        activeOpacity={0.8}
                    >
                        <FeatherIcon name="chevron-left" size={20} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.topTitleBlock}>
                        <Text style={styles.topTitle}>Kamera Pengintai Rak</Text>
                        <Text style={styles.topSubtitle}>CBB Manajemen Rak v5</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setFlashOn((f) => !f)}
                        style={[styles.iconBtn, flashOn && styles.iconBtnActive]}
                        activeOpacity={0.8}
                    >
                        <FeatherIcon
                            name={flashOn ? 'zap' : 'zap-off'}
                            size={18}
                            color={flashOn ? '#ffd600' : '#fff'}
                        />
                    </TouchableOpacity>
                </View>

                {/* ── Instruction text ───────────────────────────────────── */}
                <Text style={styles.instructionText}>
                    Arahkan kamera ke QR-Code pada label rak
                </Text>

                {/* ── Scan window (cutout effect) ───────────────────────── */}
                <View style={styles.scanWindowWrapper}>
                    <View style={[styles.scanWindow, { width: WINDOW_SIZE, height: WINDOW_SIZE }]}>

                        {/* Corner brackets */}
                        <CornerBracket position="topLeft" />
                        <CornerBracket position="topRight" />
                        <CornerBracket position="bottomLeft" />
                        <CornerBracket position="bottomRight" />

                        {/* Laser sweep line */}
                        {!scanned && (
                            <Animated.View
                                style={[
                                    styles.laserLine,
                                    { transform: [{ translateY: laserTranslateY }] },
                                ]}
                            />
                        )}

                        {/* Processing state — spinner di tengah jendela */}
                        {scanMode === 'processing' && (
                            <View style={styles.processingOverlay}>
                                <ActivityIndicator size="large" color="#00e5ff" />
                                <Text style={styles.processingText}>Menghubungkan database CBB...</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Status badge di bawah window ──────────────────────── */}
                <View style={styles.statusBadge}>
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: scanMode === 'processing' ? '#ffd600' : '#18a558' },
                        ]}
                    />
                    <Text style={styles.statusBadgeText}>
                        {scanMode === 'processing'
                            ? 'Memproses QR-Code...'
                            : 'Siap Memindai 1D / 2D Barcode'}
                    </Text>
                </View>

                {/* ── Bottom panel ──────────────────────────────────────── */}
                <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 20 }]}>

                    {/* Scan ulang button — muncul setelah scan */}
                    {scanned && scanMode !== 'processing' && (
                        <TouchableOpacity
                            onPress={() => { setScanned(false); setScanMode('scan'); }}
                            style={styles.rescanBtn}
                            activeOpacity={0.85}
                        >
                            <FeatherIcon name="refresh-cw" size={15} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.rescanBtnText}>Scan Ulang</Text>
                        </TouchableOpacity>
                    )}

                    {/* Mode pills: QR | Barcode */}
                    <View style={styles.modePills}>
                        <View style={[styles.pill, styles.pillActive]}>
                            <FeatherIcon name="maximize" size={11} color="#fff" style={{ marginRight: 5 }} />
                            <Text style={styles.pillActiveText}>QR-Code</Text>
                        </View>
                        <View style={styles.pill}>
                            <FeatherIcon name="align-justify" size={11} color="#8fb2ff" style={{ marginRight: 5 }} />
                            <Text style={styles.pillText}>Barcode 1D</Text>
                        </View>
                    </View>

                    <Text style={styles.bottomNote}>
                        Aplikasi memindai 1D Barcode & 2D QR-Code secara real-time
                    </Text>
                </View>
            </Animated.View>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const NAVY = '#070b19';
const BLUE = '#1045ab';
const CYAN = '#00e5ff';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },

    // ── Permission screen ─────────────────────────────────────────────────────
    centerContainer: {
        flex: 1,
        backgroundColor: NAVY,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#8fb2ff',
        fontSize: 13,
        marginTop: 8,
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: NAVY,
    },
    permissionInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 36,
    },
    permissionIconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(16, 69, 171, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(80, 120, 240, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    permissionSubtitle: {
        fontSize: 13,
        color: '#8fb2ff',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    permissionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BLUE,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 14,
        marginBottom: 14,
        // shadow
        shadowColor: BLUE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    permissionBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    backTextBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    backTextBtnLabel: {
        color: '#5872a8',
        fontSize: 13,
        fontWeight: '600',
    },

    // ── Camera overlay ────────────────────────────────────────────────────────
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(7, 11, 25, 0.72)',
        justifyContent: 'space-between',
    },

    // Top bar
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconBtnActive: {
        backgroundColor: 'rgba(255, 214, 0, 0.15)',
        borderColor: 'rgba(255, 214, 0, 0.3)',
    },
    topTitleBlock: {
        flex: 1,
        alignItems: 'center',
    },
    topTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#e0ecff',
        letterSpacing: 0.3,
    },
    topSubtitle: {
        fontSize: 10,
        color: '#5872a8',
        marginTop: 1,
    },

    // Instruction
    instructionText: {
        textAlign: 'center',
        color: '#bbc8e8',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 12,
        paddingHorizontal: 24,
    },

    // Scan window
    scanWindowWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanWindow: {
        borderRadius: 16,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        position: 'relative',
    },
    cornerBase: {
        position: 'absolute',
        width: 28,
        height: 28,
    },

    // Laser
    laserLine: {
        position: 'absolute',
        left: 8,
        right: 8,
        height: 2,
        borderRadius: 2,
        backgroundColor: '#ff1744',
        // Glow effect via shadow (iOS)
        shadowColor: '#ff1744',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
        elevation: 4,
    },

    // Processing overlay inside window
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(7, 11, 25, 0.82)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    processingText: {
        color: CYAN,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // Status badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 7,
        marginTop: 18,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusBadgeText: {
        color: '#c5d8ff',
        fontSize: 11,
        fontWeight: '600',
    },

    // Bottom panel
    bottomPanel: {
        alignItems: 'center',
        paddingHorizontal: 24,
        gap: 14,
    },

    rescanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BLUE,
        paddingVertical: 13,
        paddingHorizontal: 28,
        borderRadius: 14,
        shadowColor: BLUE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    rescanBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },

    modePills: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 20,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.12)',
        padding: 4,
        gap: 4,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
    },
    pillActive: {
        backgroundColor: BLUE,
    },
    pillActiveText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    pillText: {
        color: '#8fb2ff',
        fontSize: 10,
        fontWeight: '600',
    },

    bottomNote: {
        color: '#4a5c80',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default ShelfScannerScreen;