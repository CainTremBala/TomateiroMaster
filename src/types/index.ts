// RN-05
export interface Produto {
  id: string // TOM-NNN, auto-increment
  nome: string
  categoriaId: string
  valorKg: number
  fazenda: string
  quantidadeKg: number
}

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
}

// RN-01: usuário cadastrado, com a senha usada no login
export interface UsuarioCadastrado extends Usuario {
  senha: string
}

export type TipoToast = 'sucesso' | 'erro'

export interface Toast {
  id: number
  mensagem: string
  tipo: TipoToast
}
