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
// Install command: npx expo install expo-linear-gradient
let LinearGradient: any;
try {
    LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch {
    LinearGradient = ({ children, style }: any) => (
        <View style={[style, { backgroundColor: '#065f46' }]}>{children}</View>
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type RootStackParamList = {
    PiutangListScreen: undefined;
    // Sesuaikan nama route dengan stack navigator Anda
};

type NavProp = StackNavigationProp<RootStackParamList>;

// ─── Component ────────────────────────────────────────────────────────────────

const BannerBayarPiutang: React.FC = () => {
    const navigation = useNavigation<NavProp>();

    // Pulse animation untuk ikon Dollar / Wallet
    const pulseAnim = useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 950,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 950,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    const handleInputBayar = () => {
        // Navigasi ke Halaman Pembayaran Piutang
        try {
            (navigation as any).navigate('PiutangListScreen');
        } catch {
            Alert.alert(
                'Info Navigation',
                'Route PiutangListScreen belum terdaftar di Stack Navigator Anda.'
            );
        }
    };

    return (
        <View style={styles.outerWrapper}>
            <LinearGradient
                colors={['#064e3b', '#047857', '#0d9488']} // Tema Emerald & Teal (Collection Sales)
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
                        {/* Badge "Collection Sales" */}
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Collection Sales</Text>
                        </View>

                        <Text style={styles.title}>Pembayaran Piutang</Text>

                        <Text style={styles.subtitle}>
                            Cari pelanggan & alokasi bayar faktur (FIFO / Checkbox manual)
                        </Text>
                    </View>

                    {/* Ikon Dollar / Wallet dengan pulse animation */}
                    <View style={styles.iconCircle}>
                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                            <FeatherIcon name="dollar-sign" size={24} color="#a7f3d0" />
                        </Animated.View>
                    </View>
                </View>

                {/* ── Action Buttons Row ─────────────────────────────────── */}
                <View style={styles.buttonsRow}>
                    {/* Primary Button: Input Bayar */}
                    <TouchableOpacity
                        onPress={handleInputBayar}
                        activeOpacity={0.82}
                        style={styles.btnPrimary}
                    >
                        <Text style={styles.btnPrimaryText}>Input Bayar</Text>
                        <FeatherIcon name="chevron-right" size={15} color="#064e3b" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>

                {/* Watermark "FIFO" di sudut kanan bawah */}
                <Text style={styles.watermark}>FIFO</Text>
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
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        // Shadow Android
        elevation: 8,
    },
    container: {
        borderRadius: 22,
        padding: 18,
        overflow: 'hidden',
        // Border tipis emerald
        borderWidth: 1.5,
        borderColor: 'rgba(167, 243, 208, 0.3)',
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

    // Badge "Collection Sales"
    badge: {
        alignSelf: 'flex-start',
        backgroundColor: '#f59e0b', // Amber / Gold Accent
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: 7,
    },
    badgeText: {
        color: '#451a03',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    // Title
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: '#ffffff',
        marginBottom: 6,
        lineHeight: 22,
    },

    // Subtitle
    subtitle: {
        fontSize: 11,
        color: '#d1fae5',
        lineHeight: 16,
        maxWidth: 220,
    },

    // Icon Circle (Kanan Atas)
    iconCircle: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 0.8,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 16,
        padding: 12,
        alignSelf: 'flex-start',
    },

    // ── Buttons ──────────────────────────────────────────────────────────────
    buttonsRow: {
        flexDirection: 'row',
        marginTop: 16,
    },

    // Primary Button (Tombol Putih Berdiri Elegan di Atas Emerald)
    btnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 18,
        // Shadow pada tombol
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    btnPrimaryText: {
        color: '#064e3b',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    // ── Watermark ────────────────────────────────────────────────────────────
    watermark: {
        position: 'absolute',
        bottom: 6,
        right: 12,
        fontSize: 36,
        fontWeight: '900',
        color: 'rgba(255, 255, 255, 0.07)',
        letterSpacing: 3,
        lineHeight: 40,
    },
});

export default BannerBayarPiutang;