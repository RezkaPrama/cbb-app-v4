import React, { useEffect, useMemo, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
    KeyboardAvoidingView, Platform, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

import apiService, {
    CustomerSearchResult, CustomerAutofillResult, CreateSalesOrderPayload,
} from '../../service/apiService';
// ^ sesuaikan path apiService dengan lokasi asli di project Anda

import { useDebouncedValue } from '../Piutang/hooks/useDebouncedValue';
import PiutangHeader from '../Piutang/PiutangHeader';

import CustomerSearchBar from './components/CustomerSearchBar';
import SelectedCustomerAutofillCard from './components/SelectedCustomerAutofillCard';
import ArticleSearchModal, { PickedArticle } from './components/ArticleSearchModal';
import CartTable from './components/CartTable';
import DiscountBreakdownBox from './components/DiscountBreakdownBox';
import POSuccessModal from './components/POSuccessModal';

export interface CartItem {
    id_product: number;
    barcode: string | null;
    product_name: string;
    quantity: number;   // isi/pack
    qty: number;         // jumlah pack dipesan
    price_pack: number;
    subtotal: number;
    hpp_pcs: number;
    available_pcs?: number;  // stok tersedia dalam PCS (fisik - reserved)
}

interface Props {
    navigation: StackNavigationProp<any>;
}

const todayISO = () => new Date().toISOString().split('T')[0];

// TODO: sesuaikan sumber pilihan Jenis Transaksi & Jenis Barang kalau ternyata
// harus dinamis dari API (mis. apiService.getJenisBarangList()).
const J_TRANS_OPTIONS = ['PUTUS', 'RETUNABLE', 'KONSINYASI', 'COUNTER', 'COUNTER NON SPG'];

export default function SalesOrderFormScreen({ navigation }: Props) {
    // --- Header PO fields ---
    const [jTrans, setJTrans] = useState<string>('PUTUS');
    const [idJenisBarang, setIdJenisBarang] = useState<number | null>(null);
    const [poCode, setPoCode] = useState<string>('');
    const [loadingCode, setLoadingCode] = useState(true);
    const [tanggalFaktur, setTanggalFaktur] = useState<Date>(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const tanggalFakturISO = tanggalFaktur.toISOString().split('T')[0];
    const tanggalFakturDisplay = tanggalFaktur.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
    const handleDateChange = (_event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios'); // Android auto-close, iOS biar user tutup manual
        if (selectedDate) setTanggalFaktur(selectedDate);
    };

    const [noPoCustomer, setNoPoCustomer] = useState<string>('');

    // --- Customer ---
    const [customerQuery, setCustomerQuery] = useState('');
    const debouncedCustomerQuery = useDebouncedValue(customerQuery, 400);
    const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerAutofillResult | null>(null);
    const [customerDiscounts, setCustomerDiscounts] = useState<Record<string, number>>({});

    // --- Cart / detail artikel ---
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [showArticleModal, setShowArticleModal] = useState(false);

    // --- Diskon & catatan ---
    const [diskon1, setDiskon1] = useState(0);
    const [diskon2, setDiskon2] = useState(0);
    const [diskon3, setDiskon3] = useState(0);
    const [catatan, setCatatan] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [successResult, setSuccessResult] = useState<{ code: string } | null>(null);

    // Generate No PO begitu screen dibuka
    useEffect(() => {
        apiService.generateSalesOrderCode().then((res) => {
            setLoadingCode(false);
            if (res.success && res.code) setPoCode(res.code);
        });
    }, []);

    // Cari pelanggan (debounced)
    useEffect(() => {
        const q = debouncedCustomerQuery.trim();
        if (q.length < 2) {
            setCustomerResults([]);
            return;
        }
        let cancelled = false;
        setSearchLoading(true);
        apiService.searchSalesOrderCustomers(q).then((res) => {
            if (cancelled) return;
            setSearchLoading(false);
            if (res.success && res.data) setCustomerResults(res.data); // langsung array
        });
        return () => { cancelled = true; };
    }, [debouncedCustomerQuery]);

    const handleSelectCustomer = async (c: CustomerSearchResult) => {
        setCustomerQuery('');
        setCustomerResults([]);
        const res = await apiService.getSalesOrderCustomerDetail(c.idcust);
        if (res.success && res.data) {
            setSelectedCustomer(res.data);
            setCustomerDiscounts(res.discounts || {});
            const discountValue = res.discounts?.[jTrans] ?? 0;
            setDiskon1(discountValue);
        }
    };

    const handleChangeCustomer = () => {
        setSelectedCustomer(null);
        setCustomerDiscounts({});
    };

    // Saat jenis transaksi berubah, sesuaikan diskon 1 kalau pelanggan sudah dipilih
    const handleChangeJTrans = (value: string) => {
        setJTrans(value);
        if (customerDiscounts[value] !== undefined) {
            setDiskon1(customerDiscounts[value]);
        }
    };

    // --- Cart handlers ---
    const handlePickArticle = (article: PickedArticle) => {
        setCartItems((prev) => {
            const existing = prev.find((i) => i.id_product === article.id_product);
            if (existing) {
                return prev.map((i) => i.id_product === article.id_product
                    ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.price_pack }
                    : i);
            }
            return [...prev, {
                id_product: article.id_product,
                barcode: article.barcode,
                product_name: article.product_name,
                quantity: article.quantity,
                qty: 1,
                price_pack: article.price_pack,
                subtotal: article.price_pack,
                hpp_pcs: article.hpp_pcs,
                available_pcs: article.available_pcs,
            }];
        });
    };

    const handleUpdateQty = (id_product: number, delta: number) => {
        setCartItems((prev) => prev.map((item) => {
            if (item.id_product !== id_product) return item;
            const newQty = Math.max(1, item.qty + delta);

            // Validasi terhadap stok tersedia yang diketahui saat artikel dipilih (satuan: pcs)
            if (item.available_pcs !== undefined) {
                const requestedPcs = newQty * (item.quantity || 1);
                if (requestedPcs > item.available_pcs) {
                    Alert.alert('Stok Tidak Cukup', `Stok tersedia untuk ${item.product_name} tidak mencukupi.`);
                    return item;
                }
            }

            return { ...item, qty: newQty, subtotal: newQty * item.price_pack };
        }));
    };

    const handleRemoveItem = (id_product: number) => {
        setCartItems((prev) => prev.filter((i) => i.id_product !== id_product));
    };

    // --- Totals ---
    const totals = useMemo(() => {
        const totalQtyPack = cartItems.reduce((acc, i) => acc + i.qty, 0);
        const bruto = cartItems.reduce((acc, i) => acc + i.subtotal, 0);
        const hpp = cartItems.reduce((acc, i) => acc + i.hpp_pcs * i.qty, 0);

        const diskon1Rp = Math.round(bruto * (diskon1 / 100));
        const afterDisc1 = bruto - diskon1Rp;
        const diskon2Rp = Math.round(afterDisc1 * (diskon2 / 100));
        const afterDisc2 = afterDisc1 - diskon2Rp;
        const diskon3Rp = Math.round(afterDisc2 * (diskon3 / 100));
        const netto = afterDisc2 - diskon3Rp;

        return { totalQtyPack, bruto, hpp, diskon1Rp, diskon2Rp, diskon3Rp, netto };
    }, [cartItems, diskon1, diskon2, diskon3]);

    const handleSubmit = async () => {
        if (!selectedCustomer) {
            Alert.alert('Periksa Kembali', 'Silakan pilih Pelanggan / Toko!');
            return;
        }
        if (cartItems.length === 0) {
            Alert.alert('Periksa Kembali', 'Detail artikel barang masih kosong!');
            return;
        }

        setSubmitting(true);

        // Field-field ini PERSIS mengikuti apa yang dibaca SalesOrderController::store().
        // Perhatikan: id_customer (bukan id_cust), j_trans (bukan j_transaksi),
        // discount_percentage_2/_3 (pakai underscore). Tidak perlu kirim code/total_pack/
        // netto_amount — semua dihitung ulang di server dari daftar products di bawah.
        const payload: CreateSalesOrderPayload = {
            date: tanggalFakturISO,
            id_jenis_barang: idJenisBarang ?? undefined,
            j_trans: jTrans,
            id_customer: selectedCustomer.idcust,
            cust_name: selectedCustomer.nama,
            address_name: selectedCustomer.alamat,
            kel: selectedCustomer.kelurahan,
            kec: selectedCustomer.kecamatan,
            kota_kab: selectedCustomer.idkota,
            provinsi: selectedCustomer.provinsi,
            discount_percentage: diskon1,
            discount_percentage_2: diskon2,
            discount_percentage_3: diskon3,
            note: catatan || undefined,
            products: cartItems.map((i) => ({
                id_product: i.id_product,
                barcode: i.barcode,
                product_name: i.product_name,
                quantity: i.quantity,
                qty: i.qty,
                price_pack: i.price_pack,
                subtotal: i.subtotal,
                hpp_pcs: i.hpp_pcs,
            })),
        };

        const res = await apiService.createSalesOrder(payload);
        setSubmitting(false);

        if (!res.success) {
            Alert.alert('Gagal Menyimpan', res.message || 'Terjadi kesalahan saat menyimpan PO.');
            return;
        }

        setSuccessResult({ code: res.code });
    };

    const closeSuccessAndGoBack = () => {
        setSuccessResult(null);
        navigation.navigate('SalesOrderListScreen');
    };

    return (
        <SafeAreaView style={styles.screen} edges={['bottom']}>
            <SafeAreaView edges={['top']} style={styles.headerBlue}>
                <PiutangHeader
                    title="Form Input Purchase Order"
                    subtitle="Entry Order Penjualan Sales Mobile"
                    onBackPress={() => navigation.goBack()}
                    rightBadge="Order Mobile"
                />
            </SafeAreaView>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* CARD 1: HEADER PO */}
                    <View style={styles.card}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.cardTitle}>FORM PURCHASE ORDER</Text>
                            <Text style={styles.wajibText}>* Wajib diisi</Text>
                        </View>

                        <View style={{ marginTop: 8 }}>
                            <Text style={styles.fieldLabel}>Jenis Transaksi *</Text>
                            <View style={styles.chipRow}>
                                {J_TRANS_OPTIONS.map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => handleChangeJTrans(opt)}
                                        style={[styles.chip, jTrans === opt && styles.chipActive]}
                                    >
                                        <Text style={[styles.chipText, jTrans === opt && styles.chipTextActive]}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.row2}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fieldLabel}>No PO (Internal)</Text>
                                <View style={styles.readonlyBox}>
                                    {loadingCode ? (
                                        <ActivityIndicator size="small" color="#043DAE" />
                                    ) : (
                                        <Text style={styles.readonlyBoxText}>{poCode}</Text>
                                    )}
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fieldLabel}>Tanggal</Text>
                                <TouchableOpacity style={styles.readonlyBox} onPress={() => setShowDatePicker(true)}>
                                    <Text style={styles.readonlyBoxText}>{tanggalFakturDisplay}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View>
                            <Text style={styles.fieldLabel}>No PO Customer (opsional)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Nomor PO dari toko/customer"
                                value={noPoCustomer}
                                onChangeText={setNoPoCustomer}
                            />
                        </View>
                    </View>

                    {/* CARD 2: PELANGGAN */}
                    <View style={styles.card}>
                        <View style={styles.rowInline}>
                            <Ionicons name="storefront-outline" size={14} color="#043DAE" />
                            <Text style={styles.cardTitle}>PILIH PELANGGAN / TOKO</Text>
                        </View>

                        {!selectedCustomer ? (
                            <>
                                <View style={{ marginTop: 8 }}>
                                    <CustomerSearchBar
                                        query={customerQuery}
                                        onChangeQuery={setCustomerQuery}
                                        loading={searchLoading}
                                        results={customerResults}
                                        onSelectCustomer={handleSelectCustomer}
                                    />
                                </View>
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoBoxText}>Pilih pelanggan, data pendukung akan otomatis terisi.</Text>
                                </View>
                            </>
                        ) : (
                            <View style={{ marginTop: 8 }}>
                                <SelectedCustomerAutofillCard customer={selectedCustomer} onChangeCustomer={handleChangeCustomer} />
                            </View>
                        )}
                    </View>

                    {/* CARD 3: DETAIL ARTIKEL */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>DETAIL ARTIKEL</Text>

                        <TouchableOpacity style={styles.searchArticleBtn} onPress={() => setShowArticleModal(true)}>
                            <Ionicons name="search" size={15} color="#fff" />
                            <Text style={styles.searchArticleBtnText}>Cari Artikel</Text>
                        </TouchableOpacity>

                        <View style={styles.statusBar}>
                            <Text style={styles.statusBarText}>
                                📦 Jumlah Artikel: <Text style={styles.statusBarBold}>{cartItems.length}</Text> / Maksimal 23 artikel
                            </Text>
                        </View>

                        <View style={{ marginTop: 10 }}>
                            <CartTable items={cartItems} onUpdateQty={handleUpdateQty} onRemove={handleRemoveItem} />
                        </View>

                        <View style={{ marginTop: 12 }}>
                            <DiscountBreakdownBox
                                hpp={totals.hpp}
                                bruto={totals.bruto}
                                diskon1={diskon1}
                                diskon2={diskon2}
                                diskon3={diskon3}
                                onChangeDiskon1={setDiskon1}
                                onChangeDiskon2={setDiskon2}
                                onChangeDiskon3={setDiskon3}
                                diskon1Rp={totals.diskon1Rp}
                                diskon2Rp={totals.diskon2Rp}
                                diskon3Rp={totals.diskon3Rp}
                                netto={totals.netto}
                            />
                        </View>

                        <View style={{ marginTop: 12 }}>
                            <Text style={styles.fieldLabel}>Catatan (Jika diperlukan)</Text>
                            <TextInput
                                style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
                                placeholder="Tulis instruksi khusus..."
                                value={catatan}
                                onChangeText={setCatatan}
                                multiline
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* Footer actions */}
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.cancelBtnText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                <Text style={styles.submitBtnText}>Simpan & Kirim PO</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            {showDatePicker && (
                <DateTimePicker
                    value={tanggalFaktur}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                />
            )}

            <ArticleSearchModal
                visible={showArticleModal}
                onClose={() => setShowArticleModal(false)}
                onPick={handlePickArticle}
            />

            <POSuccessModal
                visible={!!successResult}
                code={successResult?.code || ''}
                custName={selectedCustomer?.nama || ''}
                totalQtyPack={totals.totalQtyPack}
                netto={totals.netto}
                onClose={closeSuccessAndGoBack}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8f9fd' },
    headerBlue: { backgroundColor: '#043DAE' },
    scrollContent: { padding: 14, gap: 14, paddingBottom: 30 },
    card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, gap: 10 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    row2: { flexDirection: 'row', gap: 8 },
    cardTitle: { fontSize: 11, fontWeight: '800', color: '#334155', letterSpacing: 0.4 },
    wajibText: { fontSize: 9, fontWeight: '700', color: '#e11d48' },
    fieldLabel: { fontSize: 9.5, fontWeight: '700', color: '#475569', marginBottom: 4 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#f8fafc' },
    chipActive: { backgroundColor: '#043DAE', borderColor: '#043DAE' },
    chipText: { fontSize: 10, fontWeight: '700', color: '#475569' },
    chipTextActive: { color: '#fff' },
    readonlyBox: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9 },
    readonlyBoxText: { fontSize: 11, fontWeight: '800', color: '#1e293b', fontFamily: 'monospace' },
    textInput: {
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9,
        fontSize: 11.5, fontWeight: '600', color: '#1e293b', backgroundColor: '#fff',
    },
    infoBox: { backgroundColor: '#ede7f6', borderWidth: 1, borderColor: '#d1c4e9', borderRadius: 12, padding: 10, marginTop: 8 },
    infoBoxText: { fontSize: 10.5, color: '#4a148c', fontWeight: '600' },
    searchArticleBtn: {
        flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#0091ff', borderRadius: 12, paddingVertical: 11,
    },
    searchArticleBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    statusBar: { backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
    statusBarText: { fontSize: 10, fontWeight: '700', color: '#075985', fontFamily: 'monospace' },
    statusBarBold: { fontWeight: '900' },
    footer: {
        flexDirection: 'row', gap: 8, padding: 12,
        backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
    },
    cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    cancelBtnText: { color: '#475569', fontWeight: '700', fontSize: 12 },
    submitBtn: {
        flex: 2, flexDirection: 'row', gap: 6, backgroundColor: '#ea580c', borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', paddingVertical: 12,
    },
    submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});