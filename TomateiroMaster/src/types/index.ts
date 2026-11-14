// RN-31: ponto da fazenda marcado no mapa
export interface Coordenada {
  latitude: number
  longitude: number
}

// RN-05: o produto tem só nome e categoria; preço e localização ficam na Fazenda (RN-35)
export interface Produto {
  id: string // TOM-NNN, auto-increment
  nome: string
  categoriaId: string
  quantidadeKg: number // nosso estoque (único, somando todas as entradas)
  custoMedioKg: number // RN-07: custo médio ponderado das entradas
}

// RN-35: produto fornecido por uma fazenda, com o preço atual dela
export interface ProdutoFornecido {
  produtoId: string
  valorKg: number
  foto?: string // RN-36: foto opcional do produto desta fazenda
}

// RN-35
export interface Fazenda {
  id: string // FAZ-NNN, auto-increment
  nome: string
  localizacao: string
  coordenada: Coordenada // RN-31
  produtos: ProdutoFornecido[]
}

// Dados do formulário da fazenda (o ponto no mapa pode ainda não estar marcado)
export type NovaFazenda = Omit<Fazenda, 'id' | 'coordenada'> & { coordenada: Coordenada | null }

// RN-12
export interface Categoria {
  id: string // CAT-NNN, auto-increment
  nome: string
}

// RN-02, RN-03
export interface Usuario {
  id: string // USR-NNN, auto-increment
  nome: string
  email: string
  permissao: string
  foto?: string // RN-29: URI da foto de perfil (sem foto = inicial do nome)
}

export type TipoToast = 'sucesso' | 'erro'

export interface Toast {
  id: number
  mensagem: string
  tipo: TipoToast
}
