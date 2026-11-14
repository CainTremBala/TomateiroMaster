import { Categoria, Fazenda, Produto, Usuario } from '@/src/types';

// Contadores de auto-increment (IDs nunca são reaproveitados, nem após reiniciar)
export interface UltimosIds {
  produto: number
  categoria: number
  fazenda: number
  usuario: number
}

// RN-34: tudo que fica salvo no banco local
export interface DadosSalvos {
  usuarios: Usuario[]
  produtos: Produto[]
  categorias: Categoria[]
  fazendas: Fazenda[]
  ultimosIds: UltimosIds
  sessao: string | null // ID do usuário logado (null = deslogado)
}

// RN-40: alteração esperando para ser enviada ao backup da API
export type Recurso = 'usuarios' | 'categorias' | 'produtos' | 'fazendas'

export interface OperacaoFila {
  id: number
  recurso: Recurso
  acao: 'salvar' | 'excluir'
  registroId: string
  dados: unknown | null // registro completo em "salvar"; null em "excluir"
}

export type NovaOperacao = Omit<OperacaoFila, 'id'>
