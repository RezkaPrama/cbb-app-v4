import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { fetchVerificationSummary } from '../../features/salesOrder/salesOrderVerificationSlice';
import { useAppDispatch, useAppSelector } from '../../redux/Store/store-hooks';

interface Props {
  navigation: any;
}

/**
 * Cara pakai di HomeScreen:
 *
 *   {user?.position?.id === 'O-041' && <VerificationBanner navigation={navigation} />}
 *
 * `user` di sini ambil dari state auth/profile yang sudah ada di project Anda
 * (hasil dari endpoint /user, disimpan sebagai `dataDetailUser` di AsyncStorage).
 * Struktur position-nya nested: { id: idjab, name: nama jabatan } — BUKAN field
 * idjab flat, sesuai AuthMobileController::user()/respondWithToken().
 *
 * Banner ini TIDAK melakukan pengecekan role sendiri — sengaja, supaya
 * satu-satunya sumber kebenaran "siapa yang boleh lihat" ada di pemanggilnya
 * (HomeScreen), bukan tersebar di banyak komponen.
 */
export default function VerificationBanner({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { pendingCount, loading } = useAppSelector((s) => ({
    pendingCount: s.salesOrderVerification.pendingCount,
    loading: s.salesOrderVerification.loading,
  }));

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchVerificationSummary());
    }, [])
  );

  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('SalesOrderVerificationListScreen')}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="shield-checkmark" size={20} color="#fff" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Verifikasi Sales PO</Text>
        <Text style={styles.subtitle}>PO dari Anda & tim yang perlu di-ACC</Text>
      </View>

      {pendingCount > 0 ? (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{pendingCount}</Text>
        </View>
      ) : null}

      <Ionicons name="chevron-forward" size={18} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#7c3aed', borderRadius: 16, padding: 12,
    marginHorizontal: 14, marginTop: 10,
    shadowColor: '#7c3aed', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#fff', fontWeight: '900', fontSize: 12.5 },
  subtitle: { color: '#ede9fe', fontSize: 9.5, marginTop: 1 },
  countBadge: {
    backgroundColor: '#fbbf24', borderRadius: 12, minWidth: 22, height: 22,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  countBadgeText: { color: '#78350f', fontWeight: '900', fontSize: 11 },
});