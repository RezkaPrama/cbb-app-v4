import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, ActionSheetIOS, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { PhotoFile } from '../../../service/apiService';

interface Props {
  photo: PhotoFile | null;
  onChangePhoto: (photo: PhotoFile | null) => void;
}

export default function ProofUploadField({ photo, onChangePhoto }: Props) {
  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Izin Kamera', 'Aplikasi memerlukan izin kamera untuk mengambil foto bukti pembayaran.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      onChangePhoto({ uri: asset.uri, type: 'image/jpeg', fileName: `bukti_${Date.now()}.jpg` });
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Izin Galeri', 'Aplikasi memerlukan izin galeri untuk memilih foto bukti pembayaran.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      onChangePhoto({ uri: asset.uri, type: 'image/jpeg', fileName: `bukti_${Date.now()}.jpg` });
    }
  };

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Batal', 'Ambil Foto', 'Pilih dari Galeri'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) pickFromCamera();
          if (index === 2) pickFromGallery();
        }
      );
    } else {
      Alert.alert('Bukti Pembayaran', 'Pilih sumber foto', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Kamera', onPress: pickFromCamera },
        { text: 'Galeri', onPress: pickFromGallery },
      ]);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>BUKTI PEMBAYARAN / SLIP TRANSAKSI</Text>

      {photo ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: photo.uri }} style={styles.previewImage} />
          <TouchableOpacity onPress={handlePress} style={styles.changeBtn}>
            <Ionicons name="camera-outline" size={13} color="#043DAE" />
            <Text style={styles.changeBtnText}>Ganti Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onChangePhoto(null)} style={styles.removeBtn}>
            <Ionicons name="trash-outline" size={13} color="#dc2626" />
            <Text style={styles.removeBtnText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadBtn} onPress={handlePress}>
          <Ionicons name="camera-outline" size={16} color="#043DAE" />
          <Text style={styles.uploadBtnText}>Ambil Foto Bukti / Slip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 9.5, fontWeight: '700', color: '#64748b', letterSpacing: 0.4 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 12,
  },
  uploadBtnText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  previewWrap: { gap: 6 },
  previewImage: { width: '100%', height: 140, borderRadius: 12, backgroundColor: '#f1f5f9' },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  changeBtnText: { fontSize: 10, fontWeight: '700', color: '#043DAE' },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  removeBtnText: { fontSize: 10, fontWeight: '700', color: '#dc2626' },
});