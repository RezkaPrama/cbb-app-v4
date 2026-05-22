import React, { useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather as FeatherIcon } from '@expo/vector-icons';

// Gunakan LinearGradient dari expo-linear-gradient jika tersedia,
// fallback ke View biasa jika belum diinstall.
// Install: expo install expo-linear-gradient
let LinearGradient: any;
try {
    LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch {
    LinearGradient = ({ children, style }: any) => (
        <View style={[style, { backgroundColor: '#0f2a70' }]}>{children}</View>
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type RootStackParamList = {
    ShelfScanner: undefined;
    ShelfForm: { manualMode?: boolean };
    // Sesuaikan nama route dengan navigator Anda
};

type NavProp = StackNavigationProp<RootStackParamList>;

// ─── Component ────────────────────────────────────────────────────────────────

const BannerScanRack: React.FC = () => {
    const navigation = useNavigation<NavProp>();

    // Pulse animation untuk ikon QR
    const pulseAnim = useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    const handleScanQR = () => {
        // Navigasi ke screen scanner QR
        // Sesuaikan nama route dengan navigator Anda
        try {
            (navigation as any).navigate('ShelfScanner');
        } catch {
            Alert.alert('Info', 'Route ShelfScanner belum terdaftar di navigator.');
        }
    };

    const handleManualInput = () => {
        // Navigasi ke form manual
        try {
            (navigation as any).navigate('ShelfForm', { manualMode: true });
        } catch {
            Alert.alert('Info', 'Route ShelfForm belum terdaftar di navigator.');
        }
    };

    return (
        <View style={styles.outerWrapper}>
            <LinearGradient
                colors={['#0b1532', '#0f2a70', '#1045ab']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                {/* Dot grid overlay — titik-titik putih transparan */}
                <View style={styles.dotGrid} pointerEvents="none">
                    {Array.from({ length: 48 }).map((_, i) => (
                        <View key={i} style={styles.gridDot} />
                    ))}
                </View>

                {/* ── Header row: teks kiri + ikon kanan ─────────────────── */}
                <View style={styles.headerRow}>
                    <View style={styles.textBlock}>
                        {/* Badge "Modul Baru v5" */}
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Modul Baru v5</Text>
                        </View>

                        <Text style={styles.title}>Manajemen Rak CBB</Text>

                        <Text style={styles.subtitle}>
                            Scan QR-Code fisik pada lokasi rak toko mitra, update foto &amp; kirim posisi GPS koordinat.
                        </Text>
                    </View>

                    {/* Ikon QR dengan pulse animation */}
                    <View style={styles.iconCircle}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <FeatherIcon name="maximize" size={24} color="#8fb2ff" />
                        </Animated.View>
                    </View>
                </View>

                {/* ── Action Buttons ──────────────────────────────────────── */}
                <View style={styles.buttonsRow}>
                    {/* Primary: Scan QR Kamera */}
                    <TouchableOpacity
                        onPress={handleScanQR}
                        activeOpacity={0.82}
                        style={styles.btnScan}
                    >
                        <FeatherIcon name="camera" size={13} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.btnScanText}>Scan QR Kamera</Text>
                    </TouchableOpacity>

                    {/* Secondary: Input Manual */}
                    <TouchableOpacity
                        onPress={handleManualInput}
                        activeOpacity={0.82}
                        style={styles.btnManual}
                    >
                        <Text style={styles.btnManualText}>Input Manual</Text>
                    </TouchableOpacity>
                </View>

                {/* Watermark "V5" di sudut kanan bawah */}
                <Text style={styles.watermark}>V5</Text>
            </LinearGradient>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    outerWrapper: {
        marginHorizontal: 15,
        marginVertical: 8,
        borderRadius: 22,
        // Shadow iOS
        shadowColor: '#1045ab',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
        // Shadow Android
        elevation: 8,
    },
    container: {
        borderRadius: 22,
        padding: 18,
        overflow: 'hidden',
        // Border tipis biru
        borderWidth: 1.5,
        borderColor: 'rgba(80, 120, 240, 0.25)',
    },

    // ── Dot grid overlay ─────────────────────────────────────────────────────
    dotGrid: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        opacity: 0.08,
    },
    gridDot: {
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#fff',
        margin: 6,
    },

    // ── Header row ───────────────────────────────────────────────────────────
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    textBlock: {
        flex: 1,
        marginRight: 12,
    },

    // Badge
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#18a558',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: 7,
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    // Title
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 6,
        lineHeight: 22,
    },

    // Subtitle
    subtitle: {
        fontSize: 11,
        color: '#bbc8e8',
        lineHeight: 16,
        maxWidth: 210,
    },

    // QR icon circle (kanan atas)
    iconCircle: {
        backgroundColor: 'rgba(60, 100, 230, 0.30)',
        borderWidth: 0.5,
        borderColor: 'rgba(80, 120, 255, 0.25)',
        borderRadius: 16,
        padding: 12,
        alignSelf: 'flex-start',
    },

    // ── Buttons ──────────────────────────────────────────────────────────────
    buttonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },

    // Primary button — hijau teal gradient
    btnScan: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#18a558',   // fallback; gunakan LinearGradient jika mau
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 10,
        // shadow
        shadowColor: '#18a558',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
    },
    btnScanText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
    },

    // Secondary button — ghost putih transparan
    btnManual: {
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.18)',
        borderRadius: 12,
        paddingVertical: 11,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnManualText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.2,
    },

    // ── Watermark ────────────────────────────────────────────────────────────
    watermark: {
        position: 'absolute',
        bottom: 8,
        right: 14,
        fontSize: 40,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.06)',
        letterSpacing: 4,
        lineHeight: 44,
    },
});

export default BannerScanRack;