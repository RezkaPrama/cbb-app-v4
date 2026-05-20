import React, { useState, useEffect, JSX } from 'react';
import { ImageBackground, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Theme } from '@react-navigation/native';
import { Feather as FeatherIcon } from '@expo/vector-icons';
import { GlobalStyleSheet } from '../../constants/GlobalStyleSheet';
import { COLORS, FONTS, IMAGES } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDataLara } from '../../utils/asyncStorage';
import Toast from 'react-native-toast-message';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { StyleSheet } from "react-native";

// Define types
type RootStackParamList = {
  ListActiveBills: undefined;
  BillsActive: {
    kode_pelanggan: string;
    jenis_transaksi: string | null;
  };
  // tambahkan route lainnya di sini
};

type NavigationProp = DrawerNavigationProp<RootStackParamList> & {
  openDrawer: () => void;
};

interface ListActiveBillsProps {
  navigation: NavigationProp;
}

interface Customer {
  kode_pelanggan: string;
  nama_pelanggan: string;
  total_invoices: number;
  total_piutang: number;
  jenis_transaksi?: string;
}

interface JenisTransaksiFilter {
  title: string;
}

interface ApiResponse {
  success: boolean;
  data: Customer[];
}

const ListActiveBills: React.FC<ListActiveBillsProps> = ({ navigation }) => {
  const theme = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [filterJenisTransaksi, setFilterJenisTransaksi] = useState<string>('All');

  // Status filter diubah menjadi jenis transaksi
  const jenisTransaksiFilters: JenisTransaksiFilter[] = [
    { title: "All" },
    { title: "PUTUS" },
    { title: "RETUNABLE" },
    { title: "KONSINYASI" },
    { title: "COUNTER" },
    { title: "COUNTER NON SPG" }
  ];

  useEffect(() => {
    fetchCustomers();
  }, [filterJenisTransaksi]); // Tambahkan dependency filterJenisTransaksi agar data diambil saat filter berubah

  const fetchCustomers = async (): Promise<void> => {
    try {
      setLoading(true);
      const token = await getDataLara("tokenUser");

      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Sesi login telah berakhir. Silahkan login kembali.',
        });
        return;
      }

      let url = 'https://citrabarubusana.org/api/active-bills/customers/search';

      // Tambahkan parameter jenis_transaksi ke URL jika tidak 'All'
      if (filterJenisTransaksi !== 'All') {
        url += `?jenis_transaksi=${encodeURIComponent(filterJenisTransaksi)}`;

        // Tambahkan parameter nama_pelanggan jika ada pencarian
        if (searchText) {
          url += `&nama_pelanggan=${encodeURIComponent(searchText)}`;
        }
      } else if (searchText) {
        // Jika tidak ada filter jenis transaksi tetapi ada pencarian
        url += `?nama_pelanggan=${encodeURIComponent(searchText)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setCustomers(result.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Gagal mengambil data piutang',
        });
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      Toast.show({
        type: 'error',
        text1: 'Terjadi kesalahan saat mengambil data piutang',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (): Promise<void> => {
    fetchCustomers(); // Gunakan fungsi fetchCustomers yang sudah dimodifikasi
  };

  const handleViewInvoices = (kode_pelanggan: string): void => {
    // Tambahkan jenis_transaksi pada navigasi jika ada filter aktif
    navigation.navigate('BillsActive', {
      kode_pelanggan: kode_pelanggan,
      jenis_transaksi: filterJenisTransaksi !== 'All' ? filterJenisTransaksi : null
    });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const renderCustomerItem = (customer: Customer, index: number): JSX.Element => {
    return (
      <TouchableOpacity
        key={index}
        style={[styles.container, GlobalStyleSheet.shadow,
        {
          backgroundColor: colors.card,
          marginBottom: 10,
          borderRadius: 20,
        }]}
        onPress={() => handleViewInvoices(customer.kode_pelanggan)}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ ...FONTS.h5, color: COLORS.title }}>{customer.nama_pelanggan}</Text>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
              backgroundColor: COLORS.primary + '20',
            }}>
            <Text style={{ ...FONTS.fontSm, color: COLORS.primary }}>{customer.kode_pelanggan}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <View
            style={{
              height: 8,
              width: 8,
              marginRight: 6,
              borderRadius: 8,
              backgroundColor: customer.total_piutang > 0 ? COLORS.danger : COLORS.success,
            }}
          />
          <Text
            style={{
              ...FONTS.fontSm,
              color: customer.total_piutang > 0 ? COLORS.danger : COLORS.success
            }}>
            {customer.total_piutang > 0 ? 'BELUM LUNAS' : 'LUNAS'}
          </Text>
        </View>

        {/* Tambahkan tampilan jenis transaksi jika tersedia */}
        {customer.jenis_transaksi && (
          <View style={{ marginTop: 6 }}>
            <Text style={{ ...FONTS.fontSm, color: COLORS.primary }}>
              {customer.jenis_transaksi}
            </Text>
          </View>
        )}

        <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ ...FONTS.font, color: colors.text }}>Total Faktur</Text>
            <Text style={{ ...FONTS.fontBold, color: COLORS.title }}>{customer.total_invoices}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ ...FONTS.font, color: colors.text }}>Total Piutang</Text>
            <Text style={{ ...FONTS.fontBold, color: COLORS.primary }}>{formatCurrency(customer.total_piutang)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <SafeAreaView style={{ flex: 1, marginTop: '7%' }}>
        <View style={{ paddingBottom: 10 }}>
          <ImageBackground
            source={theme.dark ? IMAGES.eduPattern2 : IMAGES.eduPattern1}
            style={styles.headerArea}
          >
            <View
              style={{
                flexDirection: 'row',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ ...FONTS.h6, color: COLORS.white }}>List Piutang Aktif</Text>
                <Text
                  numberOfLines={1}
                  style={{
                    ...FONTS.font,
                    color: COLORS.white,
                    opacity: .75
                  }}>Daftar piutang pelanggan aktif</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.openDrawer()}
                style={{
                  height: 48,
                  width: 48,
                  borderWidth: 1,
                  borderColor: COLORS.borderColor2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                }}
              >
                <FeatherIcon color={COLORS.title} size={22} name={'grid'} />
              </TouchableOpacity>
            </View>
          </ImageBackground>
          <View style={{ marginHorizontal: 15, marginTop: -26 }}>
            <TextInput
              style={{
                ...GlobalStyleSheet.searchInput,
                backgroundColor: COLORS.cardBg,
                color: COLORS.title,
              }}
              placeholder='Cari nama toko/pelanggan'
              placeholderTextColor={COLORS.textLight}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity onPress={handleSearch}>
              <FeatherIcon color={colors.text} size={22} name='search' />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 15, paddingTop: 8, paddingBottom: 15 }}
          >
            {jenisTransaksiFilters.map((filter, index) => {
              const isActive = filterJenisTransaksi === filter.title;
              return (
                <TouchableOpacity
                  key={index}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: isActive ? COLORS.primary : COLORS.borderColor,
                    borderRadius: 30,
                    marginRight: 12,
                    backgroundColor: isActive ? COLORS.primayLight : 'transparent',
                  }}
                  onPress={() => setFilterJenisTransaksi(filter.title)}
                >
                  <Text style={{
                    ...FONTS.font,
                    fontSize: 15,
                    color: isActive ? COLORS.primary : COLORS.title
                  }}>{filter.title}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {loading ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{ ...FONTS.font, color: colors.text, marginTop: 10 }}>Memuat data...</Text>
            </View>
          ) : customers.length === 0 ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <FeatherIcon name="inbox" size={60} color={COLORS.textLight} />
              <Text style={{ ...FONTS.font, color: colors.text, marginTop: 10 }}>
                Data piutang tidak ditemukan
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 15 }}>
              {customers.map((customer, index) => renderCustomerItem(customer, index))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    //maxWidth : 575,
    marginLeft: 'auto',
    marginRight: 'auto',
    //backgroundColor:'red',
    width: '100%',
  },
  headerArea: {
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 50,
  },
});

export default ListActiveBills;