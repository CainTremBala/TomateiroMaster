import { Categoria, Fazenda, Produto, Usuario } from '@/src/types';

// RN-01: as contas (e-mail e senha) ficam no Firebase Authentication. O perfil local
// (ID USR-NNN, nome, permissão e foto) é criado na primeira entrada de cada conta neste celular.
export const usuariosIniciais: Usuario[] = []

// Dados iniciais fictícios
export const categoriasIniciais: Categoria[] = [
  { id: 'CAT-001', nome: 'In Natura / Mesa' },
  { id: 'CAT-002', nome: 'Industrial / Molho' },
  { id: 'CAT-003', nome: 'Orgânico' },
  { id: 'CAT-004', nome: 'Especial / Gourmet' },
]

export const produtosIniciais: Produto[] = [
  { id: 'TOM-101', nome: 'Tomate Debora Premium', categoriaId: 'CAT-001', quantidadeKg: 90, custoMedioKg: 7.8 },
  { id: 'TOM-102', nome: 'Tomate Italiano Molho', categoriaId: 'CAT-002', quantidadeKg: 1200, custoMedioKg: 5.2 },
  { id: 'TOM-103', nome: 'Tomate Cherry Sweet (Uva)', categoriaId: 'CAT-004', quantidadeKg: 85, custoMedioKg: 14.5 },
  { id: 'TOM-104', nome: 'Tomate Saladete Orgânico', categoriaId: 'CAT-003', quantidadeKg: 230, custoMedioKg: 9.9 },
]

// RN-35: fazendas diferentes podem vender o mesmo produto com preços diferentes
export const fazendasIniciais: Fazenda[] = [
  {
    id: 'FAZ-001',
    nome: 'Fazenda Sol Nascente',
    localizacao: 'Fazenda Sol Nascente - Gleba A',
    coordenada: { latitude: -22.7253, longitude: -47.6492 },
    produtos: [
      { produtoId: 'TOM-101', valorKg: 7.8 },
      { produtoId: 'TOM-102', valorKg: 5.5 },
    ],
  },
  {
    id: 'FAZ-002',
    nome: 'Fazenda Vale Verde',
    localizacao: 'Fazenda Vale Verde - Setor 2',
    coordenada: { latitude: -22.0087, longitude: -47.8909 },
    produtos: [
      { produtoId: 'TOM-101', valorKg: 8.2 },
      { produtoId: 'TOM-102', valorKg: 5.2 },
    ],
  },
  {
    id: 'FAZ-003',
    nome: 'Sítio Tomatinho Feliz',
    localizacao: 'Sítio Tomatinho Feliz - Estufa 1',
    coordenada: { latitude: -22.9056, longitude: -47.0608 },
    produtos: [
      { produtoId: 'TOM-103', valorKg: 14.5 },
    ],
  },
  {
    id: 'FAZ-004',
    nome: 'Fazenda Raiz Orgânica',
    localizacao: 'Fazenda Raiz Orgânica - Canteiro 4',
    coordenada: { latitude: -23.1896, longitude: -46.8845 },
    produtos: [
      { produtoId: 'TOM-104', valorKg: 9.9 },
      { produtoId: 'TOM-103', valorKg: 13.9 },
    ],
  },
]
