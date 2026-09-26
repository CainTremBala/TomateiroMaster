import { Categoria, Produto, UsuarioCadastrado } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

// RN-34: banco de dados local (AsyncStorage) — os dados continuam após fechar e abrir o app
const CHAVES = {
  usuarios: '@tomateiro/usuarios',
  produtos: '@tomateiro/produtos',
  categorias: '@tomateiro/categorias',
  ultimosIds: '@tomateiro/ultimos-ids',
  sessao: '@tomateiro/sessao', // ID do usuário logado (null = deslogado)
}

// Contadores de auto-increment (IDs nunca são reaproveitados, nem após reiniciar)
export interface UltimosIds {
  produto: number
  categoria: number
  usuario: number
}

export interface DadosSalvos {
  usuarios: UsuarioCadastrado[]
  produtos: Produto[]
  categorias: Categoria[]
  ultimosIds: UltimosIds
  sessao: string | null
}

// null = primeira vez que o app abre (nada salvo ainda)
export async function carregarDados(): Promise<DadosSalvos | null> {
  const pares = await AsyncStorage.multiGet(Object.values(CHAVES))
  const valores = Object.fromEntries(pares)

  if (valores[CHAVES.usuarios] == null) return null

  return {
    usuarios: JSON.parse(valores[CHAVES.usuarios]!),
    produtos: JSON.parse(valores[CHAVES.produtos] ?? '[]'),
    categorias: JSON.parse(valores[CHAVES.categorias] ?? '[]'),
    ultimosIds: JSON.parse(valores[CHAVES.ultimosIds] ?? '{"produto":0,"categoria":0,"usuario":0}'),
    sessao: valores[CHAVES.sessao] ? JSON.parse(valores[CHAVES.sessao]!) : null,
  }
}

export async function salvarDados(dados: DadosSalvos) {
  await AsyncStorage.multiSet([
    [CHAVES.usuarios, JSON.stringify(dados.usuarios)],
    [CHAVES.produtos, JSON.stringify(dados.produtos)],
    [CHAVES.categorias, JSON.stringify(dados.categorias)],
    [CHAVES.ultimosIds, JSON.stringify(dados.ultimosIds)],
    [CHAVES.sessao, JSON.stringify(dados.sessao)],
  ])
}

// RN-29 / RN-34: a foto escolhida fica na pasta temporária do picker;
// copia para a pasta de documentos do app para não sumir após reiniciar
export async function guardarFotoPerfil(uri: string, usuarioId: string) {
  if (Platform.OS === 'web') return uri

  const destino = new File(Paths.document, `foto-${usuarioId}-${Date.now()}.jpg`)
  await new File(uri).copy(destino)
  return destino.uri
}

export function apagarFotoPerfil(uri: string | undefined) {
  if (!uri || Platform.OS === 'web' || !uri.startsWith(Paths.document.uri)) return

  try {
    const arquivo = new File(uri)
    if (arquivo.exists) arquivo.delete()
  } catch {
    // arquivo já removido: nada a fazer
  }
}
