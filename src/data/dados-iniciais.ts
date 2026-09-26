import { Categoria, Produto, UsuarioCadastrado } from '@/src/types';

// Usuários cadastrados: só eles podem entrar no sistema (RN-01)
export const usuariosIniciais: UsuarioCadastrado[] = [
  {
    id: 'USR-001',
    nome: 'Caio Pragana',
    email: 'caiorochapragana63@gmail.com',
    senha: '1234',
    permissao: 'Administrador de Estoque',
  },
]

// Dados iniciais fictícios em memória
export const categoriasIniciais: Categoria[] = [
  { id: 'CAT-001', nome: 'In Natura / Mesa' },
  { id: 'CAT-002', nome: 'Industrial / Molho' },
  { id: 'CAT-003', nome: 'Orgânico' },
  { id: 'CAT-004', nome: 'Especial / Gourmet' },
]

export const produtosIniciais: Produto[] = [
  {
    id: 'TOM-101',
    nome: 'Tomate Debora Premium',
    categoriaId: 'CAT-001',
    valorKg: 7.8,
    fazenda: 'Fazenda Sol Nascente - Gleba A',
    coordenada: { latitude: -22.7253, longitude: -47.6492 },
    quantidadeKg: 90,
  },
  {
    id: 'TOM-102',
    nome: 'Tomate Italiano Molho',
    categoriaId: 'CAT-002',
    valorKg: 5.2,
    fazenda: 'Fazenda Vale Verde - Setor 2',
    coordenada: { latitude: -22.0087, longitude: -47.8909 },
    quantidadeKg: 1200,
  },
  {
    id: 'TOM-103',
    nome: 'Tomate Cherry Sweet (Uva)',
    categoriaId: 'CAT-004',
    valorKg: 14.5,
    fazenda: 'Sítio Tomatinho Feliz - Estufa 1',
    coordenada: { latitude: -22.9056, longitude: -47.0608 },
    quantidadeKg: 85,
  },
  {
    id: 'TOM-104',
    nome: 'Tomate Saladete Orgânico',
    categoriaId: 'CAT-003',
    valorKg: 9.9,
    fazenda: 'Fazenda Raiz Orgânica - Canteiro 4',
    coordenada: { latitude: -23.1896, longitude: -46.8845 },
    quantidadeKg: 230,
  },
]
