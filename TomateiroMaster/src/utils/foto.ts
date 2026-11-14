import { TipoToast } from '@/src/types';
import * as ImagePicker from 'expo-image-picker';

// RN-29 / RN-36: recorte quadrado (1:1)
const OPCOES_FOTO: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
}

// Abre a galeria ou a câmera. Retorna a URI escolhida ou null (cancelado / permissão negada).
export async function escolherFoto(
  origem: 'galeria' | 'camera',
  mostrarToast: (mensagem: string, tipo?: TipoToast) => void
) {
  const permissao = origem === 'galeria'
    ? await ImagePicker.requestMediaLibraryPermissionsAsync()
    : await ImagePicker.requestCameraPermissionsAsync()

  if (!permissao.granted) {
    mostrarToast(
      origem === 'galeria' ? 'Permissão de acesso às fotos negada!' : 'Permissão de acesso à câmera negada!',
      'erro'
    )
    return null
  }

  const resultado = origem === 'galeria'
    ? await ImagePicker.launchImageLibraryAsync(OPCOES_FOTO)
    : await ImagePicker.launchCameraAsync(OPCOES_FOTO)

  return resultado.canceled ? null : resultado.assets[0].uri
}
