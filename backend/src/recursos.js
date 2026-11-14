// Recursos da API: como validar, gravar e ler cada tipo de registro do app (RN-40)

const texto = (valor) => typeof valor === 'string' && valor.trim().length > 0
const numero = (valor) => typeof valor === 'number' && Number.isFinite(valor)

const agora = () => new Date().toISOString()

const recursos = {
  usuarios: {
    validar: (r) => texto(r.nome) && texto(r.email) && texto(r.permissao),
    salvar: (db, id, r) => {
      db.prepare(`INSERT INTO usuarios (id, nome, email, permissao, atualizado_em) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET nome = excluded.nome, email = excluded.email,
          permissao = excluded.permissao, atualizado_em = excluded.atualizado_em`)
        .run(id, r.nome, r.email, r.permissao, agora())
    },
    listar: (db) => db.prepare('SELECT * FROM usuarios ORDER BY id').all().map(paraUsuario),
    buscar: (db, id) => {
      const linha = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)
      return linha && paraUsuario(linha)
    },
    excluir: (db, id) => db.prepare('DELETE FROM usuarios WHERE id = ?').run(id).changes,
  },

  categorias: {
    validar: (r) => texto(r.nome),
    salvar: (db, id, r) => {
      db.prepare(`INSERT INTO categorias (id, nome, atualizado_em) VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET nome = excluded.nome, atualizado_em = excluded.atualizado_em`)
        .run(id, r.nome, agora())
    },
    listar: (db) => db.prepare('SELECT * FROM categorias ORDER BY id').all().map(paraCategoria),
    buscar: (db, id) => {
      const linha = db.prepare('SELECT * FROM categorias WHERE id = ?').get(id)
      return linha && paraCategoria(linha)
    },
    excluir: (db, id) => db.prepare('DELETE FROM categorias WHERE id = ?').run(id).changes,
  },

  produtos: {
    validar: (r) => texto(r.nome) && texto(r.categoriaId) && numero(r.quantidadeKg) && r.quantidadeKg >= 0
      && numero(r.custoMedioKg) && r.custoMedioKg >= 0,
    salvar: (db, id, r) => {
      db.prepare(`INSERT INTO produtos (id, nome, categoria_id, quantidade_kg, custo_medio_kg, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET nome = excluded.nome, categoria_id = excluded.categoria_id,
          quantidade_kg = excluded.quantidade_kg, custo_medio_kg = excluded.custo_medio_kg,
          atualizado_em = excluded.atualizado_em`)
        .run(id, r.nome, r.categoriaId, r.quantidadeKg, r.custoMedioKg, agora())
    },
    listar: (db) => db.prepare('SELECT * FROM produtos ORDER BY id').all().map(paraProduto),
    buscar: (db, id) => {
      const linha = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id)
      return linha && paraProduto(linha)
    },
    excluir: (db, id) => db.prepare('DELETE FROM produtos WHERE id = ?').run(id).changes,
  },

  fazendas: {
    validar: (r) => texto(r.nome) && texto(r.localizacao)
      && r.coordenada && numero(r.coordenada.latitude) && numero(r.coordenada.longitude)
      && Array.isArray(r.produtos)
      && r.produtos.every((item) => texto(item.produtoId) && numero(item.valorKg) && item.valorKg > 0),
    salvar: (db, id, r) => {
      db.exec('BEGIN')
      try {
        db.prepare(`INSERT INTO fazendas (id, nome, localizacao, latitude, longitude, atualizado_em)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET nome = excluded.nome, localizacao = excluded.localizacao,
            latitude = excluded.latitude, longitude = excluded.longitude, atualizado_em = excluded.atualizado_em`)
          .run(id, r.nome, r.localizacao, r.coordenada.latitude, r.coordenada.longitude, agora())
        db.prepare('DELETE FROM fazenda_produtos WHERE fazenda_id = ?').run(id)
        const inserir = db.prepare(
          'INSERT INTO fazenda_produtos (fazenda_id, produto_id, valor_kg, ordem) VALUES (?, ?, ?, ?)'
        )
        r.produtos.forEach((item, ordem) => inserir.run(id, item.produtoId, item.valorKg, ordem))
        db.exec('COMMIT')
      } catch (erro) {
        db.exec('ROLLBACK')
        throw erro
      }
    },
    listar: (db) => db.prepare('SELECT * FROM fazendas ORDER BY id').all().map((linha) => paraFazenda(db, linha)),
    buscar: (db, id) => {
      const linha = db.prepare('SELECT * FROM fazendas WHERE id = ?').get(id)
      return linha && paraFazenda(db, linha)
    },
    excluir: (db, id) => db.prepare('DELETE FROM fazendas WHERE id = ?').run(id).changes,
  },
}

function paraUsuario(linha) {
  return { id: linha.id, nome: linha.nome, email: linha.email, permissao: linha.permissao, atualizadoEm: linha.atualizado_em }
}

function paraCategoria(linha) {
  return { id: linha.id, nome: linha.nome, atualizadoEm: linha.atualizado_em }
}

function paraProduto(linha) {
  return {
    id: linha.id,
    nome: linha.nome,
    categoriaId: linha.categoria_id,
    quantidadeKg: linha.quantidade_kg,
    custoMedioKg: linha.custo_medio_kg,
    atualizadoEm: linha.atualizado_em,
  }
}

function paraFazenda(db, linha) {
  const produtos = db
    .prepare('SELECT produto_id, valor_kg FROM fazenda_produtos WHERE fazenda_id = ? ORDER BY ordem')
    .all(linha.id)
    .map((item) => ({ produtoId: item.produto_id, valorKg: item.valor_kg }))
  return {
    id: linha.id,
    nome: linha.nome,
    localizacao: linha.localizacao,
    coordenada: { latitude: linha.latitude, longitude: linha.longitude },
    produtos,
    atualizadoEm: linha.atualizado_em,
  }
}

module.exports = { recursos }
