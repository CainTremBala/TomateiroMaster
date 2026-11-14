// Banco SQLite do backup (RN-40). Usa o SQLite embutido no Node (node:sqlite, Node 22.5+).
const { DatabaseSync } = require('node:sqlite')

const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    permissao TEXT NOT NULL,
    atualizado_em TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS categorias (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    atualizado_em TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS produtos (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    categoria_id TEXT NOT NULL,
    quantidade_kg REAL NOT NULL,
    custo_medio_kg REAL NOT NULL,
    atualizado_em TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS fazendas (
    id TEXT PRIMARY KEY NOT NULL,
    nome TEXT NOT NULL,
    localizacao TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    atualizado_em TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS fazenda_produtos (
    fazenda_id TEXT NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
    produto_id TEXT NOT NULL,
    valor_kg REAL NOT NULL,
    ordem INTEGER NOT NULL,
    PRIMARY KEY (fazenda_id, produto_id)
  );
`

// caminho ':memory:' = banco temporário (usado nos testes)
function abrirBanco(caminho) {
  const db = new DatabaseSync(caminho)
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec(ESQUEMA)
  return db
}

module.exports = { abrirBanco }
