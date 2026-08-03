import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Resize lebar foto ke maxWidth (tinggi ikut menyesuaikan rasio) dan
 * kompres ke JPEG dengan quality tertentu. Foto dari kamera HP biasanya
 * 3000-4000px lebar dan beberapa MB — untuk keperluan verifikasi
 * check-in/checkout, 1280px lebar dengan quality 0.6 sudah lebih dari
 * cukup jelas dan ukurannya bisa 10-20x lebih kecil.
 */
export async function compressImage(
  uri: string,
  maxWidth: number = 1280,
  quality: number = 0.6
): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch {
    // Kalau proses resize gagal (jarang), fallback ke uri asli
    // supaya flow check-in/checkout tidak ikut gagal karenanya.
    return uri;
  }
}