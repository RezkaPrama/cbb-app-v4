import React, { useEffect, useState } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
    ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import apiService, {
    JenisTokoOption, CabangOption, RayonOption, KotaOption, SalesmanOption,
    QuickAddCustomerPayload, CustomerAutofillResult,
} from '../../../service/apiService';
// ^ sesuaikan path apiService dengan lokasi asli di project Anda
import { useDebouncedValue } from '../../Piutang/hooks/useDebouncedValue';
import SearchableSelectModal, { SelectOption } from './SearchableSelectModal';

interface Props {
    visible: boolean;
    onClose: () => void;
    onCreated: (customer: CustomerAutofillResult, discounts: Record<string, number>) => void;
}

interface PhotoSlotValue {
    uri: string;
    type?: string;
    fileName?: string;
}

type PhotoField = 'foto_ktp' | 'foto_toko' | 'foto_survey';

const PHOTO_LABELS: Record<PhotoField, string> = {
    foto_ktp: 'Foto KTP',
    foto_toko: 'Foto Toko',
    foto_survey: 'Foto Survey',
};

// Field ini otomatis dikapitalkan semua saat diketik, sesuai standar penulisan data pelanggan.
const toUpper = (v: string) => v.toUpperCase();

export default function AddCustomerModal({ visible, onClose, onCreated }: Props) {
    // Reference data (untuk searchable-select lokal)
    const [jenisTokoList, setJenisTokoList] = useState<JenisTokoOption[]>([]);
    const [cabangList, setCabangList] = useState<CabangOption[]>([]);
    const [rayonList, setRayonList] = useState<RayonOption[]>([]);
    const [loadingRefData, setLoadingRefData] = useState(true);

    // Kota (searchable, server-side)
    const [kotaQuery, setKotaQuery] = useState('');
    const debouncedKotaQuery = useDebouncedValue(kotaQuery, 400);
    const [kotaResults, setKotaResults] = useState<KotaOption[]>([]);
    const [selectedKota, setSelectedKota] = useState<KotaOption | null>(null);
    const [idcustPreview, setIdcustPreview] = useState('');

    // Selects (jenis toko, cabang, rayon, register/salesman)
    const [selectedJenisToko, setSelectedJenisToko] = useState<SelectOption | null>(null);
    const [selectedCabang, setSelectedCabang] = useState<SelectOption | null>(null);
    const [selectedRayon, setSelectedRayon] = useState<SelectOption | null>(null);
    const [selectedSalesman, setSelectedSalesman] = useState<SelectOption | null>(null);

    const [activeSelectModal, setActiveSelectModal] = useState<
        'jenisToko' | 'cabang' | 'rayon' | 'salesman' | null
    >(null);
    
    // Form fields
    const [nama, setNama] = useState('');
    const [alamat, setAlamat] = useState('');
    const [kecamatan, setKecamatan] = useState('');
    const [kelurahan, setKelurahan] = useState('');
    const [provinsi, setProvinsi] = useState('');
    const [telepon, setTelepon] = useState('');
    const [teleponPemilik, setTeleponPemilik] = useState('');
    const [namaPemilik, setNamaPemilik] = useState('');
    const [ktp, setKtp] = useState('');
    const [keterangan, setKeterangan] = useState('');

    // Foto (opsional)
    const [photos, setPhotos] = useState<Record<PhotoField, PhotoSlotValue | null>>({
        foto_ktp: null, foto_toko: null, foto_survey: null,
    });

    // NOTE: fitur GPS disembunyikan sementara sesuai permintaan — lat/long
    // tidak dikirim dari form ini untuk saat ini.

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!visible) return;
        setLoadingRefData(true);
        Promise.all([
            apiService.getJenisTokoOptions(),
            apiService.getCabangOptions(),
            apiService.getRayonOptions(),
        ]).then(([jt, cb, ry]) => {
            setLoadingRefData(false);
            if (jt.success && jt.data) setJenisTokoList(jt.data);
            if (cb.success && cb.data) setCabangList(cb.data);
            if (ry.success && ry.data) setRayonList(ry.data);
        });
    }, [visible]);

    useEffect(() => {
        const q = debouncedKotaQuery.trim();
        if (q.length < 2) { setKotaResults([]); return; }
        let cancelled = false;
        apiService.searchKota(q).then((res) => {
            if (cancelled) return;
            if (res.success && res.data) setKotaResults(res.data);
        });
        return () => { cancelled = true; };
    }, [debouncedKotaQuery]);

    const handleSelectKota = async (k: KotaOption) => {
        setSelectedKota(k);
        setKotaQuery('');
        setKotaResults([]);
        const res = await apiService.previewGenerateIdcust(k.id_kota);
        if (res.success && res.idcust) setIdcustPreview(res.idcust);
    };

    const resetForm = () => {
        setSelectedKota(null); setKotaQuery(''); setIdcustPreview('');
        setSelectedJenisToko(null); setSelectedCabang(null); setSelectedRayon(null); setSelectedSalesman(null);
        setNama(''); setAlamat(''); setKecamatan(''); setKelurahan(''); setProvinsi('');
        setTelepon(''); setTeleponPemilik(''); setNamaPemilik(''); setKtp(''); setKeterangan('');
        setPhotos({ foto_ktp: null, foto_toko: null, foto_survey: null });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // --- Foto (opsional) ---
    const pickPhoto = (field: PhotoField) => {
        Alert.alert(PHOTO_LABELS[field], 'Pilih sumber foto', [
            { text: 'Kamera', onPress: () => launchCamera(field) },
            { text: 'Galeri', onPress: () => launchLibrary(field) },
            { text: 'Batal', style: 'cancel' },
        ]);
    };

    const launchCamera = async (field: PhotoField) => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Izin Diperlukan', 'Aktifkan izin kamera untuk mengambil foto.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: false });
        if (!result.canceled && result.assets?.[0]) {
            setPhotos((prev) => ({ ...prev, [field]: { uri: result.assets[0].uri, type: 'image/jpeg' } }));
        }
    };

    const launchLibrary = async (field: PhotoField) => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Izin Diperlukan', 'Aktifkan izin galeri untuk memilih foto.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (!result.canceled && result.assets?.[0]) {
            setPhotos((prev) => ({ ...prev, [field]: { uri: result.assets[0].uri, type: 'image/jpeg' } }));
        }
    };

    const removePhoto = (field: PhotoField) => {
        setPhotos((prev) => ({ ...prev, [field]: null }));
    };

    // --- Submit ---
    const handleSubmit = async () => {
        if (!selectedKota) return Alert.alert('Periksa Kembali', 'Pilih kota terlebih dahulu.');
        if (!nama.trim()) return Alert.alert('Periksa Kembali', 'Nama pelanggan/toko wajib diisi.');
        if (!alamat.trim()) return Alert.alert('Periksa Kembali', 'Alamat wajib diisi.');
        if (!selectedJenisToko) return Alert.alert('Periksa Kembali', 'Pilih jenis toko.');
        if (!selectedCabang) return Alert.alert('Periksa Kembali', 'Pilih cabang.');
        if (!selectedSalesman) return Alert.alert('Periksa Kembali', 'Pilih salesman/penanggung jawab.');

        setSubmitting(true);

        const payload: QuickAddCustomerPayload = {
            idkota: selectedKota.id_kota,
            nama, alamat, kecamatan, kelurahan, provinsi,
            id_jenis_toko: selectedJenisToko.value,
            kode_cab: selectedCabang.value,
            kode_rayon: selectedRayon?.value,
            register: selectedSalesman.value,
            telepon: telepon || undefined,
            telepon_pemilik: teleponPemilik || undefined,
            nama_pemilik: namaPemilik || undefined,
            ktp: ktp || undefined,
            keterangan: keterangan || undefined,
            foto_ktp: photos.foto_ktp || undefined,
            foto_toko: photos.foto_toko || undefined,
            foto_survey: photos.foto_survey || undefined,
        };

        const res = await apiService.addCustomer(payload);
        setSubmitting(false);

        if (!res.success || !res.data) {
            Alert.alert('Gagal Menyimpan', res.message || 'Terjadi kesalahan saat menyimpan pelanggan.');
            return;
        }

        Alert.alert('Berhasil', res.message || 'Pelanggan baru berhasil didaftarkan.');
        onCreated(res.data as CustomerAutofillResult, res.discounts || {});
        resetForm();
    };

    const jenisTokoOptions: SelectOption[] = jenisTokoList.map((j) => ({ value: j.id_jenis_toko, label: j.jenis_toko }));
    const cabangOptions: SelectOption[] = cabangList.map((c) => ({ value: c.kode_cab, label: c.cabang }));
    const rayonOptions: SelectOption[] = rayonList.map((r) => ({ value: r.kode_rayon, label: r.rayon }));

    const searchSalesmanOptions = async (q: string): Promise<SelectOption[]> => {
        const res = await apiService.searchSalesman(q);
        if (!res.success || !res.data) return [];
        return (res.data as SalesmanOption[]).map((s) => ({ value: s.idemployee, label: `${s.idemployee} — ${s.nama}` }));
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Tambah Pelanggan Baru</Text>
                    <TouchableOpacity onPress={handleClose}>
                        <Ionicons name="close" size={22} color="#1e293b" />
                    </TouchableOpacity>
                </View>

                {loadingRefData ? (
                    <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#043DAE" />
                ) : (
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                        <View style={styles.infoBox}>
                            <Text style={styles.infoBoxText}>
                                📋 Pelanggan baru akan berstatus "BELUM AKTIF" sampai diverifikasi oleh admin.
                            </Text>
                        </View>

                        {/* Kota */}
                        <Text style={styles.label}>Kota *</Text>
                        {selectedKota ? (
                            <TouchableOpacity style={styles.selectedBox} onPress={() => setSelectedKota(null)}>
                                <Text style={styles.selectedBoxText}>{selectedKota.id_kota} — {selectedKota.kota}</Text>
                                <Ionicons name="close-circle" size={16} color="#94a3b8" />
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Cari kota..."
                                    value={kotaQuery}
                                    onChangeText={setKotaQuery}
                                />
                                {kotaResults.map((k) => (
                                    <TouchableOpacity key={k.id_kota} style={styles.dropdownItem} onPress={() => handleSelectKota(k)}>
                                        <Text style={styles.dropdownItemText}>{k.id_kota} — {k.kota}</Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                        {!!idcustPreview && (
                            <Text style={styles.previewIdText}>ID Customer akan menjadi: {idcustPreview}</Text>
                        )}

                        {/* Nama & Alamat — auto uppercase */}
                        <Text style={styles.label}>Nama Pelanggan / Toko *</Text>
                        <TextInput
                            style={styles.input}
                            value={nama}
                            onChangeText={(v) => setNama(toUpper(v))}
                            placeholder="Contoh: TOKO MAJU JAYA"
                            autoCapitalize="characters"
                        />

                        <Text style={styles.label}>Alamat Lengkap *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={alamat}
                            onChangeText={(v) => setAlamat(toUpper(v))}
                            multiline
                            placeholder="JL. CONTOH NO. 1..."
                            autoCapitalize="characters"
                        />

                        <View style={styles.row2}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Kecamatan</Text>
                                <TextInput
                                    style={styles.input}
                                    value={kecamatan}
                                    onChangeText={(v) => setKecamatan(toUpper(v))}
                                    autoCapitalize="characters"
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Kelurahan</Text>
                                <TextInput
                                    style={styles.input}
                                    value={kelurahan}
                                    onChangeText={(v) => setKelurahan(toUpper(v))}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Provinsi</Text>
                        <TextInput
                            style={styles.input}
                            value={provinsi}
                            onChangeText={(v) => setProvinsi(toUpper(v))}
                            autoCapitalize="characters"
                        />

                        {/* Jenis Toko — searchable select */}
                        <Text style={styles.label}>Jenis Toko *</Text>
                        <TouchableOpacity style={styles.selectBox} onPress={() => setActiveSelectModal('jenisToko')}>
                            <Text style={selectedJenisToko ? styles.selectBoxTextFilled : styles.selectBoxTextPlaceholder}>
                                {selectedJenisToko ? selectedJenisToko.label : 'Pilih jenis toko...'}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Cabang — searchable select */}
                        <Text style={styles.label}>Cabang *</Text>
                        <TouchableOpacity style={styles.selectBox} onPress={() => setActiveSelectModal('cabang')}>
                            <Text style={selectedCabang ? styles.selectBoxTextFilled : styles.selectBoxTextPlaceholder}>
                                {selectedCabang ? selectedCabang.label : 'Pilih cabang...'}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Rayon — searchable select (opsional) */}
                        <Text style={styles.label}>Rayon</Text>
                        <TouchableOpacity style={styles.selectBox} onPress={() => setActiveSelectModal('rayon')}>
                            <Text style={selectedRayon ? styles.selectBoxTextFilled : styles.selectBoxTextPlaceholder}>
                                {selectedRayon ? selectedRayon.label : 'Pilih rayon (opsional)...'}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Register / Salesman — searchable select ke server */}
                        <Text style={styles.label}>Salesman / Penanggung Jawab *</Text>
                        <TouchableOpacity style={styles.selectBox} onPress={() => setActiveSelectModal('salesman')}>
                            <Text style={selectedSalesman ? styles.selectBoxTextFilled : styles.selectBoxTextPlaceholder}>
                                {selectedSalesman ? selectedSalesman.label : 'Cari & pilih salesman...'}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Info Pemilik */}
                        <Text style={styles.sectionTitle}>INFORMASI PEMILIK</Text>
                        <View style={styles.row2}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Nama Pemilik</Text>
                                <TextInput style={styles.input} value={namaPemilik} onChangeText={setNamaPemilik} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>No. KTP</Text>
                                <TextInput
                                    style={styles.input} value={ktp} keyboardType="number-pad" maxLength={16}
                                    onChangeText={(v) => setKtp(v.replace(/\D/g, '').slice(0, 16))}
                                />
                            </View>
                        </View>
                        <View style={styles.row2}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Telepon Toko</Text>
                                <TextInput style={styles.input} value={telepon} onChangeText={setTelepon} keyboardType="phone-pad" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Telepon Pemilik</Text>
                                <TextInput style={styles.input} value={teleponPemilik} onChangeText={setTeleponPemilik} keyboardType="phone-pad" />
                            </View>
                        </View>

                        {/* Foto — opsional */}
                        <Text style={styles.sectionTitle}>FOTO DOKUMENTASI <Text style={styles.optionalTag}>(opsional)</Text></Text>
                        <View style={styles.photoRow}>
                            {(['foto_ktp', 'foto_toko', 'foto_survey'] as PhotoField[]).map((field) => (
                                <TouchableOpacity key={field} style={styles.photoBox} onPress={() => pickPhoto(field)}>
                                    {photos[field] ? (
                                        <>
                                            <Image source={{ uri: photos[field]!.uri }} style={styles.photoPreview} />
                                            <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => removePhoto(field)}>
                                                <Ionicons name="close" size={12} color="#fff" />
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <Ionicons name="camera-outline" size={22} color="#94a3b8" />
                                            <Text style={styles.photoBoxLabel}>{PHOTO_LABELS[field]}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* GPS — disembunyikan sementara sesuai permintaan */}

                        <Text style={styles.label}>Keterangan</Text>
                        <TextInput style={[styles.input, styles.textArea]} value={keterangan} onChangeText={setKeterangan} multiline />

                    </ScrollView>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
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
                                <Text style={styles.submitBtnText}>Simpan Pelanggan</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <SearchableSelectModal
                    visible={activeSelectModal === 'jenisToko'}
                    title="Pilih Jenis Toko"
                    options={jenisTokoOptions}
                    onSelect={setSelectedJenisToko}
                    onClose={() => setActiveSelectModal(null)}
                    searchPlaceholder="Cari jenis toko..."
                />
                <SearchableSelectModal
                    visible={activeSelectModal === 'cabang'}
                    title="Pilih Cabang"
                    options={cabangOptions}
                    onSelect={setSelectedCabang}
                    onClose={() => setActiveSelectModal(null)}
                    searchPlaceholder="Cari cabang..."
                />
                <SearchableSelectModal
                    visible={activeSelectModal === 'rayon'}
                    title="Pilih Rayon"
                    options={rayonOptions}
                    onSelect={setSelectedRayon}
                    onClose={() => setActiveSelectModal(null)}
                    searchPlaceholder="Cari rayon..."
                />
                <SearchableSelectModal
                    visible={activeSelectModal === 'salesman'}
                    title="Pilih Salesman / Penanggung Jawab"
                    onSearch={searchSalesmanOptions}
                    onSelect={setSelectedSalesman}
                    onClose={() => setActiveSelectModal(null)}
                    searchPlaceholder="Cari nama salesman..."
                />
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff',
    },
    headerTitle: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
    scrollContent: { padding: 16, paddingBottom: 30 },
    infoBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 10, padding: 10, marginBottom: 14 },
    infoBoxText: { fontSize: 10.5, color: '#92400e', fontWeight: '600' },
    label: { fontSize: 10, fontWeight: '700', color: '#475569', marginBottom: 4, marginTop: 10 },
    sectionTitle: { fontSize: 10.5, fontWeight: '800', color: '#334155', letterSpacing: 0.4, marginTop: 18, marginBottom: 6 },
    optionalTag: { fontSize: 9, fontWeight: '600', color: '#94a3b8', letterSpacing: 0 },
    input: {
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9,
        fontSize: 11.5, fontWeight: '600', color: '#1e293b', backgroundColor: '#fff',
    },
    textArea: { height: 70, textAlignVertical: 'top' },
    row2: { flexDirection: 'row', gap: 10 },
    dropdownItem: { paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    dropdownItemText: { fontSize: 11, fontWeight: '600', color: '#1e293b' },
    selectedBox: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 9,
    },
    selectedBoxText: { fontSize: 11, fontWeight: '700', color: '#1e40af' },
    previewIdText: { fontSize: 9.5, color: '#64748b', marginTop: 4, fontFamily: 'monospace' },
    selectBox: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10,
        backgroundColor: '#fff',
    },
    selectBoxTextFilled: { fontSize: 11.5, fontWeight: '700', color: '#1e293b', flex: 1 },
    selectBoxTextPlaceholder: { fontSize: 11.5, fontWeight: '500', color: '#94a3b8', flex: 1 },
    photoRow: { flexDirection: 'row', gap: 8 },
    photoBox: {
        flex: 1, aspectRatio: 1, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', overflow: 'hidden',
    },
    photoBoxLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8', marginTop: 4, textAlign: 'center' },
    photoPreview: { width: '100%', height: '100%' },
    photoRemoveBtn: {
        position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    },
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