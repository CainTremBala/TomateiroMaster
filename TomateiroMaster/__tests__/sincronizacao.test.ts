/// <reference types="jest" />
import { OperacaoFila } from '@/src/utils/banco-tipos';
import { enviarFila, enviarOperacao, ResultadoEnvio } from '@/src/utils/sincronizacao';

jest.mock('expo-network', () => ({ useNetworkState: () => ({}) }))

const URL = 'http://api.teste'

const salvar: OperacaoFila = {
  id: 1, recurso: 'produtos', acao: 'salvar', registroId: 'TOM-101',
  dados: { id: 'TOM-101', nome: 'Tomate', categoriaId: 'CAT-001', quantidadeKg: 10, custoMedioKg: 7 },
}
const excluir: OperacaoFila = { id: 2, recurso: 'categorias', acao: 'excluir', registroId: 'CAT-004', dados: null }

function respostaFalsa(status: number) {
  return jest.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status } as Response)
}

describe('RN-40: envio de uma alteração para a API', () => {
  test('"salvar" faz PUT com o registro em JSON', async () => {
    const buscar = respostaFalsa(200)
    await expect(enviarOperacao(salvar, buscar, URL)).resolves.toBe('enviado')

    const [url, opcoes] = buscar.mock.calls[0]
    expect(url).toBe('http://api.teste/api/produtos/TOM-101')
    expect(opcoes.method).toBe('PUT')
    expect(JSON.parse(opcoes.body)).toEqual(salvar.dados)
  })

  test('"excluir" faz DELETE; 404 conta como enviado (já não existe)', async () => {
    const buscar = respostaFalsa(404)
    await expect(enviarOperacao(excluir, buscar, URL)).resolves.toBe('enviado')
    expect(buscar.mock.calls[0][1].method).toBe('DELETE')
  })

  test('sem internet ou API desligada → falhou', async () => {
    const buscar = jest.fn().mockRejectedValue(new TypeError('Network request failed'))
    await expect(enviarOperacao(salvar, buscar, URL)).resolves.toBe('falhou')
  })

  test('erro 500 → falhou (tenta de novo depois); 400 → descartado', async () => {
    await expect(enviarOperacao(salvar, respostaFalsa(500), URL)).resolves.toBe('falhou')
    await expect(enviarOperacao(salvar, respostaFalsa(400), URL)).resolves.toBe('descartado')
  })

  test('sem APIURL configurada → falhou', async () => {
    await expect(enviarOperacao(salvar, respostaFalsa(200), '')).resolves.toBe('falhou')
  })
})

describe('RN-40: fila offline', () => {
  function filaEmMemoria(itens: OperacaoFila[]) {
    let fila = [...itens]
    return {
      lerFila: async () => fila,
      removerDaFila: async (id: number) => { fila = fila.filter((item) => item.id !== id) },
      atual: () => fila,
    }
  }

  test('envia tudo em ordem e esvazia a fila', async () => {
    const fila = filaEmMemoria([salvar, excluir])
    const ordem: number[] = []
    const restantes = await enviarFila(fila, async (operacao) => {
      ordem.push(operacao.id)
      return 'enviado'
    })
    expect(ordem).toEqual([1, 2])
    expect(restantes).toBe(0)
    expect(fila.atual()).toEqual([])
  })

  test('para na primeira falha e mantém o resto para depois', async () => {
    const fila = filaEmMemoria([salvar, excluir])
    const respostas: ResultadoEnvio[] = ['falhou', 'enviado']
    const restantes = await enviarFila(fila, async () => respostas.shift()!)
    expect(restantes).toBe(2)
    expect(fila.atual()).toHaveLength(2)
  })

  test('alteração recusada (400) sai da fila para não travar as outras', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const fila = filaEmMemoria([salvar, excluir])
    const respostas: ResultadoEnvio[] = ['descartado', 'enviado']
    const restantes = await enviarFila(fila, async () => respostas.shift()!)
    expect(restantes).toBe(0)
    aviso.mockRestore()
  })
})
