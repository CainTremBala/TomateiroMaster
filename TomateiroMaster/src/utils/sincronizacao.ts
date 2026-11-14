import { OperacaoFila } from '@/src/utils/banco-tipos';
import { useNetworkState } from 'expo-network';

// RN-40: backup na API (pasta backend/). O celular é a fonte dos dados: o app só envia.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '')

const TEMPO_LIMITE = 8000

export type ResultadoEnvio = 'enviado' | 'descartado' | 'falhou'

// Envia uma alteração: "salvar" → PUT /api/<recurso>/<id>, "excluir" → DELETE /api/<recurso>/<id>
export async function enviarOperacao(
  operacao: OperacaoFila,
  buscar: typeof fetch = fetch,
  urlBase: string = API_URL
): Promise<ResultadoEnvio> {
  if (!urlBase) return 'falhou'

  const controle = new AbortController()
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE)
  try {
    const resposta = await buscar(
      `${urlBase}/api/${operacao.recurso}/${encodeURIComponent(operacao.registroId)}`,
      {
        method: operacao.acao === 'salvar' ? 'PUT' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: operacao.acao === 'salvar' ? JSON.stringify(operacao.dados) : undefined,
        signal: controle.signal,
      }
    )
    if (resposta.ok || (operacao.acao === 'excluir' && resposta.status === 404)) return 'enviado'
    // 4xx = dado recusado pela API: tentar de novo não resolve, então sai da fila
    if (resposta.status >= 400 && resposta.status < 500 && ![408, 429].includes(resposta.status)) {
      return 'descartado'
    }
    return 'falhou'
  } catch {
    return 'falhou' // sem internet, API desligada ou tempo esgotado
  } finally {
    clearTimeout(timer)
  }
}

interface FilaArmazenada {
  lerFila: () => Promise<OperacaoFila[]>
  removerDaFila: (id: number) => Promise<void>
}

// Envia a fila em ordem; para na primeira falha (a ordem das alterações importa).
// Retorna quantas alterações continuam pendentes.
export async function enviarFila(
  armazenamento: FilaArmazenada,
  enviar: (operacao: OperacaoFila) => Promise<ResultadoEnvio> = (operacao) => enviarOperacao(operacao)
) {
  const fila = await armazenamento.lerFila()
  let restantes = fila.length

  for (const operacao of fila) {
    const resultado = await enviar(operacao)
    if (resultado === 'falhou') break
    if (resultado === 'descartado') console.warn('[backup] alteração recusada pela API', operacao)
    await armazenamento.removerDaFila(operacao.id)
    restantes -= 1
  }
  return restantes
}

// RN-41: online = conectado e com internet (no iOS, isInternetReachable = isConnected)
export function useConexao() {
  const estado = useNetworkState()
  if (estado.isConnected === undefined) return true // ainda carregando: tenta como online
  return !!estado.isConnected && estado.isInternetReachable !== false
}
