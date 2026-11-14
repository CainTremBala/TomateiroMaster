import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

// RN-29 / RN-36 / RN-34: a foto escolhida fica na pasta temporária do picker;
// copia para a pasta de documentos do app para não sumir após reiniciar
export async function guardarFoto(uri: string, nomeBase: string) {
  if (Platform.OS === 'web' || fotoGuardada(uri)) return uri

  const destino = new File(Paths.document, `foto-${nomeBase}-${Date.now()}.jpg`)
  await new File(uri).copy(destino)
  return destino.uri
}

// true = foto já está na pasta de documentos do app
export function fotoGuardada(uri: string) {
  return Platform.OS !== 'web' && uri.startsWith(Paths.document.uri)
}

export function apagarFoto(uri: string | undefined) {
  if (!uri || !fotoGuardada(uri)) return

  try {
    const arquivo = new File(uri)
    if (arquivo.exists) arquivo.delete()
  } catch {
    // arquivo já removido: nada a fazer
  }
}
