import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  ViewStyle,
  TextStyle,
} from "react-native";
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import HeaderStyle1 from "../../components/Header/HeaderStyle1";
import moment from 'moment-timezone';
import { getDataLara } from "../../utils/asyncStorage";
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, Feather as FeatherIcon } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Types
interface CheckoutResponse {
  code: number;
  status: string;
  message?: string;
  errors?: Record<string, string[]>;
}

type RootStackParamList = {
  Checkout: { idAbsen: number; nameStore: string; visitCount: number };
  AbsenMasuk: undefined;
  AbsenSales: undefined;
  Main: undefined;
};

type CheckoutNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;
type CheckoutRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

interface CheckoutProps {
  navigation: CheckoutNavigationProp;
  route: CheckoutRouteProp;
}

// ── Reusable icon input component ─────────────────────────────
interface IconInputProps {
  iconName: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
}

const IconInput: React.FC<IconInputProps> = ({
  iconName,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  editable = true,
}) => (
  <View style={[inputStyles.wrapper, !editable && inputStyles.wrapperDisabled, multiline && inputStyles.wrapperMultiline]}>
    {/* Icon — kiri, tidak ikut scroll */}
    <View style={inputStyles.iconBox}>
      <MaterialCommunityIcons name={iconName as any} size={18} color={editable ? '#94a3b8' : '#cbd5e1'} />
    </View>
    {/* Divider tipis */}
    <View style={inputStyles.divider} />
    {/* TextInput — padding kiri sudah diberikan lewat paddingLeft */}
    <TextInput
      style={[
        inputStyles.input,
        multiline && inputStyles.inputMultiline,
        !editable && inputStyles.inputDisabled,
      ]}
      placeholder={placeholder}
      placeholderTextColor="#cbd5e1"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      editable={editable}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);

const inputStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  } as ViewStyle,
  wrapperDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9',
  } as ViewStyle,
  wrapperMultiline: {
    alignItems: 'flex-start',
  } as ViewStyle,
  iconBox: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  } as ViewStyle,
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: '#f1f5f9',
  } as ViewStyle,
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  } as TextStyle,
  inputMultiline: {
    paddingTop: 14,
    minHeight: 90,
  } as TextStyle,
  inputDisabled: {
    color: '#475569',
    fontWeight: '700',
  } as TextStyle,
});

// ── Photo picker box ─────────────────────────────────────────────
interface PhotoPickerProps {
  uri: string | null;
  onPick: () => void;
  onRemove: () => void;
  label: string;
  sublabel: string;
  iconName: string;
}

const PhotoPicker: React.FC<PhotoPickerProps> = ({ uri, onPick, onRemove, label, sublabel, iconName }) => (
  <TouchableOpacity
    onPress={onPick}
    activeOpacity={0.85}
    style={[photoStyles.photoPicker, uri && photoStyles.photoPickerFilled]}
  >
    {uri ? (
      <>
        <Image source={{ uri }} style={photoStyles.photoPreview} />
        <TouchableOpacity onPress={onRemove} style={photoStyles.removePhotoBtn} activeOpacity={0.8}>
          <FeatherIcon name="trash-2" size={13} color="#fff" />
        </TouchableOpacity>
      </>
    ) : (
      <View style={photoStyles.photoPickerInner}>
        <View style={photoStyles.cameraIconCircle}>
          <MaterialCommunityIcons name={iconName as any} size={22} color="#b91c1c" />
        </View>
        <Text style={photoStyles.photoPickerText}>{label}</Text>
        <Text style={photoStyles.photoPickerSub}>{sublabel}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const photoStyles = StyleSheet.create({
  photoPicker: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#94a3b8',
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 130,
  } as ViewStyle,
  photoPickerFilled: {
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
  } as ViewStyle,
  photoPreview: {
    width: '100%',
    aspectRatio: 4 / 3,
    resizeMode: 'contain',
  } as any,
  photoPickerInner: { alignItems: 'center', gap: 6 } as ViewStyle,
  cameraIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  } as ViewStyle,
  photoPickerText: { fontSize: 13, fontWeight: '700', color: '#334155' } as TextStyle,
  photoPickerSub: { fontSize: 11, color: '#94a3b8' } as TextStyle,
  removePhotoBtn: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#ef4444', width: 28, height: 28,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  } as ViewStyle,
});

// ── Main component ─────────────────────────────────────────────
const Checkout: React.FC<CheckoutProps> = ({ navigation, route }) => {
  const { idAbsen, nameStore, visitCount } = route.params;
  const [result, setResult] = useState<string>('');
  const [orderQty, setOrderQty] = useState<string>('');
  const [billQty, setBillQty] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ── Foto display & foto bersama PIC toko ──────────────────────
  const [fotoDisplayUri, setFotoDisplayUri] = useState<string | null>(null);
  const [fotoPicTokoUri, setFotoPicTokoUri] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const storedToken = await getDataLara<string>("tokenUser");
        if (storedToken) setToken(storedToken);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };
    fetchData();
  }, []);

  const pickPhoto = async (setter: (uri: string) => void) => {
    const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (camStatus !== 'granted') {
      Toast.show({ type: 'error', text1: 'Izin Ditolak', text2: 'Aplikasi memerlukan izin kamera.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };

  const appendPhoto = (formData: FormData, fieldName: string, uri: string) => {
    const uriParts = uri.split('.');
    const extension = uriParts[uriParts.length - 1];
    formData.append(fieldName, {
      uri,
      name: `${fieldName}.${extension}`,
      type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    } as any);
  };

  const handleCheckout = async (): Promise<void> => {
    setIsLoading(true);
    const jakartaTime = moment().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm:ss');

    if (!nameStore || !result.trim()) {
      setIsLoading(false);
      return Toast.show({ type: 'error', text1: 'Error', text2: 'Hasil Kunjungan harus diisi!' });
    }
    if (!fotoDisplayUri) {
      setIsLoading(false);
      return Toast.show({ type: 'error', text1: 'Error', text2: 'Foto display rak/produk wajib diambil!' });
    }
    if (!fotoPicTokoUri) {
      setIsLoading(false);
      return Toast.show({ type: 'error', text1: 'Error', text2: 'Foto bersama PIC toko wajib diambil!' });
    }

    try {
      const formData = new FormData();
      formData.append('id', String(idAbsen));
      formData.append('name_store', nameStore);
      formData.append('result', result.trim());
      if (orderQty.trim()) formData.append('order_quantity', orderQty.trim());
      if (billQty.trim()) formData.append('bill_quantity', billQty.trim());
      formData.append('timestamp_checkout', jakartaTime);

      appendPhoto(formData, 'foto_display', fotoDisplayUri);
      appendPhoto(formData, 'foto_pic_toko', fotoPicTokoUri);

      const response = await fetch('https://citrabarubusana.org/api/store-visit/check-out', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data: CheckoutResponse = await response.json();

      if (response.ok && data.code === 200 && data.status === 'success') {
        Toast.show({ type: 'success', text1: 'Sukses', text2: data.message || 'Absen Checkout Toko berhasil!' });
        navigation.navigate('Main');
      } else {
        let errorMessage = data.message || 'Absen checkout gagal';
        if (data.errors) {
          errorMessage = Object.entries(data.errors).map(([f, m]) => `${f}: ${m.join(', ')}`).join('\n');
        }
        Toast.show({ type: 'error', text1: 'Error', text2: errorMessage });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Periksa Koneksi Internet Anda.' });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = Boolean(nameStore && result.trim().length > 0 && fotoDisplayUri && fotoPicTokoUri);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}

        <HeaderStyle1 title={'Absen Checkout Toko'} rightIcon={'chat'} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO CARD ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.heroLabel}>CHECKOUT KUNJUNGAN</Text>
                <Text style={styles.heroStoreName} numberOfLines={2}>{nameStore || '—'}</Text>
              </View>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="store-check-outline" size={28} color="#ffffff" />
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <MaterialCommunityIcons name="counter" size={13} color="rgba(255,255,255,0.65)" />
                <Text style={styles.heroMetaText}>Kunjungan ke-{visitCount}</Text>
              </View>
              <View style={styles.heroMetaDot} />
              <View style={styles.heroMetaItem}>
                <MaterialCommunityIcons name="clock-outline" size={13} color="rgba(255,255,255,0.65)" />
                <Text style={styles.heroMetaText}>
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </Text>
              </View>
              <View style={styles.heroMetaDot} />
              <View style={styles.heroMetaItem}>
                <MaterialCommunityIcons name="calendar-outline" size={13} color="rgba(255,255,255,0.65)" />
                <Text style={styles.heroMetaText}>
                  {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>

          {/* ── FORM CARD ── */}
          <View style={styles.formCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={18} color="#1e3a8a" />
              <Text style={styles.cardTitle}>Input Hasil Kunjungan</Text>
            </View>

            {/* Nama Toko — read only */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NAMA TOKO</Text>
              <IconInput
                iconName="store-outline"
                placeholder="Nama toko"
                value={nameStore || ''}
                onChangeText={() => {}}
                editable={false}
              />
            </View>

            {/* Jumlah Order */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                JUMLAH ORDER CBB <Text style={styles.optional}>(OPSIONAL)</Text>
              </Text>
              <IconInput
                iconName="package-variant-closed"
                placeholder="Contoh: 150 Lusin"
                value={orderQty}
                onChangeText={setOrderQty}
                keyboardType="numeric"
              />
            </View>

            {/* Jumlah Tagihan */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                JUMLAH TAGIHAN <Text style={styles.optional}>(OPSIONAL)</Text>
              </Text>
              <IconInput
                iconName="cash-multiple"
                placeholder="Contoh: 14500000"
                value={billQty}
                onChangeText={setBillQty}
                keyboardType="numeric"
              />
            </View>

            {/* Hasil Kunjungan */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>HASIL KUNJUNGAN <Text style={styles.required}>*</Text></Text>
              <IconInput
                iconName="text-box-outline"
                placeholder="Deskripsikan hasil kunjungan Anda..."
                value={result}
                onChangeText={setResult}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Foto Display Rak/Produk */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FOTO DISPLAY RAK/PRODUK <Text style={styles.required}>*</Text></Text>
              <PhotoPicker
                uri={fotoDisplayUri}
                onPick={() => pickPhoto(setFotoDisplayUri)}
                onRemove={() => setFotoDisplayUri(null)}
                label="Ambil Foto Display"
                sublabel="Ketuk untuk membuka kamera"
                iconName="image-frame"
              />
            </View>

            {/* Foto Bersama PIC Toko */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FOTO BERSAMA PIC TOKO <Text style={styles.required}>*</Text></Text>
              <PhotoPicker
                uri={fotoPicTokoUri}
                onPick={() => pickPhoto(setFotoPicTokoUri)}
                onRemove={() => setFotoPicTokoUri(null)}
                label="Ambil Foto Bersama PIC"
                sublabel="Ketuk untuk membuka kamera"
                iconName="account-tie-outline"
              />
            </View>

            {/* Catatan wajib */}
            <View style={styles.noteRow}>
              <Text style={styles.required}>*</Text>
              <Text style={styles.noteText}>Wajib diisi</Text>
            </View>
          </View>

          {/* ── FINGERPRINT BUTTON ── */}
          {isFormValid ? (
            <View style={styles.fingerprintSection}>
              <TouchableOpacity style={styles.fingerprintBtn} onPress={handleCheckout} activeOpacity={0.8}>
                <View style={styles.fingerprintRing}>
                  <View style={styles.fingerprintInner}>
                    <MaterialCommunityIcons name="fingerprint" size={48} color="#b91c1c" />
                  </View>
                </View>
                <Text style={styles.fingerprintLabel}>Check Out Sekarang</Text>
                <Text style={styles.fingerprintSub}>Tap untuk kirim laporan kunjungan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.incompleteHint}>
              <MaterialCommunityIcons name="information-outline" size={15} color="#cbd5e1" />
              <Text style={styles.incompleteHintText}>
                Lengkapi hasil kunjungan, foto display, dan foto bersama PIC toko
              </Text>
            </View>
          )}
        </ScrollView>
        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  } as ViewStyle,
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 14,
  } as ViewStyle,
  loadingOverlay: {
    position: 'absolute',
    zIndex: 10,
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  } as ViewStyle,

  /* Hero */
  heroCard: {
    backgroundColor: '#7f1d1d',
    borderRadius: 22,
    padding: 22,
  } as ViewStyle,
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  } as ViewStyle,
  heroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.5,
    marginBottom: 6,
  } as TextStyle,
  heroStoreName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  } as TextStyle,
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 14,
  } as ViewStyle,
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  } as ViewStyle,
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  heroMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  } as TextStyle,
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  } as ViewStyle,

  /* Form card */
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: 14,
    marginBottom: 18,
  } as ViewStyle,
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  } as TextStyle,

  /* Field */
  fieldGroup: {
    marginBottom: 14,
  } as ViewStyle,
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 7,
  } as TextStyle,
  required: {
    color: '#ef4444',
    fontWeight: '800',
  } as TextStyle,
  optional: {
    fontSize: 9,
    fontWeight: '600',
    color: '#cbd5e1',
    letterSpacing: 0.3,
  } as TextStyle,

  /* Note */
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  } as ViewStyle,
  noteText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  } as TextStyle,

  /* Fingerprint */
  fingerprintSection: {
    alignItems: 'center',
    paddingVertical: 8,
  } as ViewStyle,
  fingerprintBtn: {
    alignItems: 'center',
  } as ViewStyle,
  fingerprintRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b91c1c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  } as ViewStyle,
  fingerprintInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  fingerprintLabel: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '800',
    color: '#b91c1c',
  } as TextStyle,
  fingerprintSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  } as TextStyle,

  /* Incomplete hint */
  incompleteHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  } as ViewStyle,
  incompleteHintText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  } as TextStyle,
});

export default Checkout;