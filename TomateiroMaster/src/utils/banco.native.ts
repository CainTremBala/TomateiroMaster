import { Categoria, Fazenda, Produto, Usuario } from '@/src/types';
import { DadosSalvos, NovaOperacao, OperacaoFila } from '@/src/utils/banco-tipos';
import * as SQLite from 'expo-sqlite';

export type { DadosSalvos, NovaOperacao, OperacaoFila } from '@/src/utils/banco-tipos';

// RN-34: banco de dados local SQLite (celular)
const VERSAO_ESQUEMA = 1

const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    permissao TEXT NOT NULL,
    foto TEXT
  );
  CREATE TABLE IF NOT EXISTS categorias (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    categoria_id TEXT NOT NULL,
    quantidade_kg REAL NOT NULL,
    custo_medio_kg REAL NOT NULL
  );
  CREATE TABLE IF NOT EXISTS fazendas (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    localizacao TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );
  CREATE TABLE IF NOT EXISTS fazenda_produtos (
    fazenda_id TEXT NOT NULL,
    produto_id TEXT NOT NULL,
    valor_kg REAL NOT NULL,
    foto TEXT,
    ordem INTEGER NOT NULL,
    PRIMARY KEY (fazenda_id, produto_id)
  );
  CREATE TABLE IF NOT EXISTS config (
    chave TEXT PRIMARY KEY NOT NULL,
    valor TEXT
  );
  CREATE TABLE IF NOT EXISTS fila_sync (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recurso TEXT NOT NULL,
    acao TEXT NOT NULL,
    registro_id TEXT NOT NULL,
    dados TEXT
  );
`

let conexao: Promise<SQLite.SQLiteDatabase> | null = null

function abrir() {
  if (!conexao) {
    conexao = (async () => {
      const db = await SQLite.openDatabaseAsync('tomateiro.db')
      await db.execAsync('PRAGMA journal_mode = WAL;')
      const versao = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
      if ((versao?.user_version ?? 0) < VERSAO_ESQUEMA) {
        await db.execAsync(ESQUEMA)
        await db.execAsync(`PRAGMA user_version = ${VERSAO_ESQUEMA}`)
      }
      return db
    })()
  }
  return conexao
}

// Executa uma operação por vez (evita duas transações ao mesmo tempo)
let fila: Promise<unknown> = Promise.resolve()
function emSerie<T>(tarefa: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  const resultado = fila.then(async () => tarefa(await abrir()))
  fila = resultado.catch(() => {})
  return resultado
}

interface LinhaUsuario { id: string; nome: string; email: string; permissao: string; foto: string | null }
interface LinhaProduto { id: string; nome: string; categoria_id: string; quantidade_kg: number; custo_medio_kg: number }
interface LinhaFazenda { id: string; nome: string; localizacao: string; latitude: number; longitude: number }
interface LinhaFornecido { fazenda_id: string; produto_id: string; valor_kg: number; foto: string | null }
interface LinhaFila { id: number; recurso: OperacaoFila['recurso']; acao: OperacaoFila['acao']; registro_id: string; dados: string | null }

// null = primeira vez que o app abre (nada salvo ainda)
export function carregarDados(): Promise<DadosSalvos | null> {
  return emSerie(async (db) => {
    const iniciado = await db.getFirstAsync<{ valor: string }>("SELECT valor FROM config WHERE chave = 'ultimos_ids'")
    if (!iniciado) return null

    const usuarios = await db.getAllAsync<LinhaUsuario>('SELECT * FROM usuarios ORDER BY id')
    const categorias = await db.getAllAsync<Categoria>('SELECT id, nome FROM categorias ORDER BY id')
    const produtos = await db.getAllAsync<LinhaProduto>('SELECT * FROM produtos ORDER BY id')
    const fazendas = await db.getAllAsync<LinhaFazenda>('SELECT * FROM fazendas ORDER BY id')
    const fornecidos = await db.getAllAsync<LinhaFornecido>('SELECT * FROM fazenda_produtos ORDER BY fazenda_id, ordem')
    const sessao = await db.getFirstAsync<{ valor: string | null }>("SELECT valor FROM config WHERE chave = 'sessao'")

    return {
      usuarios: usuarios.map<Usuario>((linha) => ({
        id: linha.id,
        nome: linha.nome,
        email: linha.email,
        permissao: linha.permissao,
        foto: linha.foto ?? undefined,
      })),
      categorias,
      produtos: produtos.map<Produto>((linha) => ({
        id: linha.id,
        nome: linha.nome,
        categoriaId: linha.categoria_id,
        quantidadeKg: linha.quantidade_kg,
        custoMedioKg: linha.custo_medio_kg,
      })),
      fazendas: fazendas.map<Fazenda>((linha) => ({
        id: linha.id,
        nome: linha.nome,
        localizacao: linha.localizacao,
        coordenada: { latitude: linha.latitude, longitude: linha.longitude },
        produtos: fornecidos
          .filter((item) => item.fazenda_id === linha.id)
          .map((item) => ({ produtoId: item.produto_id, valorKg: item.valor_kg, foto: item.foto ?? undefined })),
      })),
      ultimosIds: { produto: 0, categoria: 0, fazenda: 0, usuario: 0, ...JSON.parse(iniciado.valor) },
      sessao: sessao?.valor ?? null,
    }
  })
}

// RN-34: grava o estado atual inteiro numa transação (dados pequenos; mantém o banco igual à tela)
export function salvarDados(dados: DadosSalvos) {
  return emSerie((db) =>
    db.withTransactionAsync(async () => {
      await db.execAsync(
        'DELETE FROM usuarios; DELETE FROM categorias; DELETE FROM produtos; DELETE FROM fazendas; DELETE FROM fazenda_produtos;'
      )

      for (const usuario of dados.usuarios) {
        await db.runAsync(
          'INSERT INTO usuarios (id, nome, email, permissao, foto) VALUES (?, ?, ?, ?, ?)',
          usuario.id, usuario.nome, usuario.email, usuario.permissao, usuario.foto ?? null
        )
      }
      for (const categoria of dados.categorias) {
        await db.runAsync('INSERT INTO categorias (id, nome) VALUES (?, ?)', categoria.id, categoria.nome)
      }
      for (const produto of dados.produtos) {
        await db.runAsync(
          'INSERT INTO produtos (id, nome, categoria_id, quantidade_kg, custo_medio_kg) VALUES (?, ?, ?, ?, ?)',
          produto.id, produto.nome, produto.categoriaId, produto.quantidadeKg, produto.custoMedioKg
        )
      }
      for (const fazenda of dados.fazendas) {
        await db.runAsync(
          'INSERT INTO fazendas (id, nome, localizacao, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
          fazenda.id, fazenda.nome, fazenda.localizacao, fazenda.coordenada.latitude, fazenda.coordenada.longitude
        )
        for (const [ordem, item] of fazenda.produtos.entries()) {
          await db.runAsync(
            'INSERT INTO fazenda_produtos (fazenda_id, produto_id, valor_kg, foto, ordem) VALUES (?, ?, ?, ?, ?)',
            fazenda.id, item.produtoId, item.valorKg, item.foto ?? null, ordem
          )
        }
      }

      await db.runAsync(
        "INSERT OR REPLACE INTO config (chave, valor) VALUES ('ultimos_ids', ?), ('sessao', ?)",
        JSON.stringify(dados.ultimosIds), dados.sessao
      )
    })
  )
}

// RN-40: fila de alterações para o backup da API
export function adicionarNaFila(operacao: NovaOperacao) {
  return emSerie((db) =>
    db.runAsync(
      'INSERT INTO fila_sync (recurso, acao, registro_id, dados) VALUES (?, ?, ?, ?)',
      operacao.recurso, operacao.acao, operacao.registroId,
      operacao.dados == null ? null : JSON.stringify(operacao.dados)
    )
  ).then(() => undefined)
}

export function lerFila(): Promise<OperacaoFila[]> {
  return emSerie(async (db) => {
    const linhas = await db.getAllAsync<LinhaFila>('SELECT * FROM fila_sync ORDER BY id')
    return linhas.map((linha) => ({
      id: linha.id,
      recurso: linha.recurso,
      acao: linha.acao,
      registroId: linha.registro_id,
      dados: linha.dados == null ? null : JSON.parse(linha.dados),
    }))
  })
}

export function removerDaFila(id: number) {
  return emSerie((db) => db.runAsync('DELETE FROM fila_sync WHERE id = ?', id)).then(() => undefined)
}
