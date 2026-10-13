import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  poCode: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export default function CancelReasonModal({ visible, poCode, submitting, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState('');

  const handleClose = () => {
    setReason('');
    onClose();
  };

  const handleSubmit = () => {
    if (reason.trim().length < 3) return;
    onSubmit(reason.trim());
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle" size={28} color="#dc2626" />
          </View>

          <Text style={styles.title}>Batalkan PO {poCode}?</Text>
          <Text style={styles.subtitle}>Alasan pembatalan wajib diisi, akan dikirim ke sales terkait.</Text>

          <TextInput
            style={styles.input}
            placeholder="Contoh: Stok tidak sesuai, harga perlu direvisi, dll."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            autoFocus
          />

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, (reason.trim().length < 3 || submitting) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={reason.trim().length < 3 || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Ya, Batalkan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, width: '100%', maxWidth: 340, gap: 4 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 6,
  },
  title: { fontSize: 13.5, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 10.5, color: '#64748b', textAlign: 'center', marginTop: 3, marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 10,
    fontSize: 11.5, color: '#1e293b', minHeight: 70, backgroundColor: '#f8fafc',
  },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  cancelBtnText: { color: '#475569', fontWeight: '700', fontSize: 11.5 },
  confirmBtn: { flex: 1, backgroundColor: '#dc2626', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 11 },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 11.5 },
});