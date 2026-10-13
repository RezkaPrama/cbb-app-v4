import React, { useEffect, useMemo, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
    KeyboardAvoidingView, Platform, Alert, LayoutAnimation, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import apiService, { SalesOrderDetail } from '../../service/apiService';

import PiutangHeader from '../Piutang/PiutangHeader';
import { CartItem } from './../SalesPo/SalesOrderFormScreen';
import ArticleSearchModal, { PickedArticle } from './../SalesPo/components/ArticleSearchModal';
import CartTable from './../SalesPo/components/CartTable';
import DiscountBreakdownBox from './../SalesPo/components/DiscountBreakdownBox';

import { useAppDispatch, useAppSelector } from '../../redux/Store/store-hooks';
import { updateOrderProducts, clearStockWarnings } from '../../features/salesOrder/salesOrderVerificationSlice';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RouteParams {
    orderId: number;
    orderCode: string;
    // Dipanggil setelah update sukses, supaya list screen bisa refresh cache detail
    // tanpa perlu fetch ulang dari server. Function param via navigation aman selama
    // masih dalam sesi yang sama (tidak di-serialize).
    onUpdated?: () => void;
}

interface Props {
    navigation: StackNavigationProp<any>;
    route: RouteProp<{ params: RouteParams }, 'params'>;
}

export default function SalesOrderVerificationEditScreen({ navigation, route }: Props) {
    const { orderId, orderCode, onUpdated } = route.params;

    const [loadingDetail, setLoadingDetail] = useState(true);
    const [custName, setCustName] = useState('');
    const [jTrans, setJTrans] = useState('');

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [showArticleModal, setShowArticleModal] = useState(false);
    const [flashProductId, setFlashProductId] = useState<number | null>(null);

    const [diskon1, setDiskon1] = useState(0);
    const [diskon2, setDiskon2] = useState(0);
    const [diskon3, setDiskon3] = useState(0);

    // const [submitting, setSubmitting] = useState(false);

    const dispatch = useAppDispatch();
    const actionLoadingId = useAppSelector((s) => s.salesOrderVerification.actionLoadingId);
    const submitting = actionLoadingId === orderId;

    // Muat detail PO existing, lalu isi cart dari detail.details.
    // PENTING: nama kolom DB "qty" & "quantity_pack" TERBALIK terhadap nama field
    // di CartItem — lihat komentar di SalesOrderController::store().
    //   DB "qty"           -> CartItem.quantity  (isi/pack)
    //   DB "quantity_pack" -> CartItem.qty        (jumlah pack)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await apiService.getVerificationDetail(orderId);
            if (cancelled) return;
            setLoadingDetail(false);

            if (!res.success || !res.data) {
                Alert.alert('Gagal Memuat', 'Detail PO tidak ditemukan.');
                navigation.goBack();
                return;
            }

            const detail = res.data as any; // sesuaikan dengan tipe SalesOrderDetail Anda jika sudah lengkap

            setCustName(detail.cust_name);
            setJTrans(detail.j_trans);
            setDiskon1(Number(detail.discount_percentage) || 0);
            setDiskon2(Number(detail.discount_percentage_2) || 0);
            setDiskon3(Number(detail.discount_percentage_3) || 0);

            const mappedCart: CartItem[] = (detail.details || []).map((d: any) => ({
                id_product: d.id_product,
                barcode: d.barcode,
                product_name: d.product_name,
                quantity: d.qty,            // DB "qty" = isi/pack
                qty: d.quantity_pack,        // DB "quantity_pack" = jumlah pack
                price_pack: Number(d.price_pack) || 0,
                subtotal: Number(d.sub_total) || 0,
                hpp_pcs: Number(d.hpp) || 0,
            }));
            setCartItems(mappedCart);
        })();
        return () => { cancelled = true; };
    }, [orderId]);

    // --- Cart handlers (identik dengan SalesOrderFormScreen) ---
    const handlePickArticle = (article: PickedArticle) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

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

        setFlashProductId(article.id_product);
        setTimeout(() => setFlashProductId(null), 750);
    };

    const handleUpdateQty = (id_product: number, delta: number) => {
        setCartItems((prev) => prev.map((item) => {
            if (item.id_product !== id_product) return item;
            const newQty = Math.max(1, item.qty + delta);
            return { ...item, qty: newQty, subtotal: newQty * item.price_pack };
        }));
    };

    const handleRemoveItem = (id_product: number) => {
        setCartItems((prev) => prev.filter((i) => i.id_product !== id_product));
    };

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
        if (cartItems.length === 0) {
            Alert.alert('Periksa Kembali', 'Detail artikel barang tidak boleh kosong!');
            return;
        }

        const result = await dispatch(updateOrderProducts({
            id: orderId,
            payload: {
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
                discount_percentage: diskon1,
                discount_percentage_2: diskon2,
                discount_percentage_3: diskon3,
            },
        }));

        if (updateOrderProducts.rejected.match(result)) {
            Alert.alert('Gagal Menyimpan', (result.payload as string) || 'Terjadi kesalahan saat memperbarui produk PO.');
            return;
        }

        const { stockWarnings } = result.payload as {
            stockWarnings: Array<{
                product_name: string;
                shortage_pcs: number;
            }>;
        };

        if (stockWarnings.length) {
            const daftar = stockWarnings
                .map((w) => `• ${w.product_name} (kurang ${w.shortage_pcs} pcs)`)
                .join('\n');
            Alert.alert(
                'Produk Diperbarui (Ada Stok Kurang)',
                `PO tetap disimpan sebagai indent untuk artikel berikut:\n${daftar}`,
                [{ text: 'OK', onPress: () => finishAndGoBack() }],
            );
            return;
        }

        finishAndGoBack();
    };

    const finishAndGoBack = () => {
        dispatch(clearStockWarnings());
        onUpdated?.(); // list screen cukup panggil dispatch(fetchVerificationList) di sini, bukan lagi passing detail
        navigation.goBack();
    };

    if (loadingDetail) {
        return (
            <SafeAreaView style={styles.screen}>
                <ActivityIndicator size="large" color="#043DAE" style={{ marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen} edges={['bottom']}>
            <SafeAreaView edges={['top']} style={styles.headerBlue}>
                <PiutangHeader
                    title={`Edit Produk PO ${orderCode}`}
                    subtitle={`${custName} • ${jTrans}`}
                    onBackPress={() => navigation.goBack()}
                    rightBadge="ASUP"
                />
            </SafeAreaView>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>DETAIL ARTIKEL</Text>

                        <TouchableOpacity style={styles.searchArticleBtn} onPress={() => setShowArticleModal(true)}>
                            <Ionicons name="search" size={15} color="#fff" />
                            <Text style={styles.searchArticleBtnText}>Tambah Artikel</Text>
                        </TouchableOpacity>

                        <View style={styles.statusBar}>
                            <Text style={styles.statusBarText}>
                                📦 Jumlah Artikel: <Text style={styles.statusBarBold}>{cartItems.length}</Text>
                            </Text>
                        </View>

                        <View style={{ marginTop: 10 }}>
                            <CartTable
                                items={cartItems}
                                onUpdateQty={handleUpdateQty}
                                onRemove={handleRemoveItem}
                                flashProductId={flashProductId}
                            />
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
                    </View>
                </ScrollView>

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
                                <Ionicons name="save" size={16} color="#fff" />
                                <Text style={styles.submitBtnText}>Simpan Perubahan</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            <ArticleSearchModal
                visible={showArticleModal}
                onClose={() => setShowArticleModal(false)}
                onPick={handlePickArticle}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#f8f9fd' },
    headerBlue: { backgroundColor: '#043DAE' },
    scrollContent: { padding: 14, gap: 14, paddingBottom: 30 },
    card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, gap: 10 },
    cardTitle: { fontSize: 11, fontWeight: '800', color: '#334155', letterSpacing: 0.4 },
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
        flex: 2, flexDirection: 'row', gap: 6, backgroundColor: '#059669', borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', paddingVertical: 12,
    },
    submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});