import { DadosSalvos, NovaOperacao, OperacaoFila } from '@/src/utils/banco-tipos';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type { DadosSalvos, NovaOperacao, OperacaoFila } from '@/src/utils/banco-tipos';

// RN-34: no navegador (web) os dados ficam no armazenamento do navegador.
// No celular é usado o SQLite (banco.native.ts), com as mesmas funções.
const CHAVE_DADOS = '@tomateiro/web-dados'
const CHAVE_FILA = '@tomateiro/web-fila'

export async function carregarDados(): Promise<DadosSalvos | null> {
  const texto = await AsyncStorage.getItem(CHAVE_DADOS)
  return texto ? JSON.parse(texto) : null
}

export async function salvarDados(dados: DadosSalvos) {
  await AsyncStorage.setItem(CHAVE_DADOS, JSON.stringify(dados))
}

// Uma operação da fila por vez (evita perder itens com leituras/gravações simultâneas)
let serie: Promise<unknown> = Promise.resolve()
function emSerie<T>(tarefa: () => Promise<T>): Promise<T> {
  const resultado = serie.then(tarefa)
  serie = resultado.catch(() => {})
  return resultado
}

async function lerItens(): Promise<OperacaoFila[]> {
  const texto = await AsyncStorage.getItem(CHAVE_FILA)
  return texto ? JSON.parse(texto) : []
}

async function gravarItens(itens: OperacaoFila[]) {
  await AsyncStorage.setItem(CHAVE_FILA, JSON.stringify(itens))
}

export function lerFila() {
  return emSerie(lerItens)
}

export function adicionarNaFila(operacao: NovaOperacao) {
  return emSerie(async () => {
    const itens = await lerItens()
    const id = itens.reduce((maior, item) => Math.max(maior, item.id), 0) + 1
    await gravarItens([...itens, { ...operacao, id }])
  })
}

export function removerDaFila(id: number) {
  return emSerie(async () => gravarItens((await lerItens()).filter((item) => item.id !== id)))
}
