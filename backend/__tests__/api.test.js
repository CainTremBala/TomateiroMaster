const request = require('supertest')
const { abrirBanco } = require('../src/banco')
const { criarApp } = require('../src/app')

// Cada teste usa um banco novo em memória
let app
beforeEach(() => {
  app = criarApp(abrirBanco(':memory:'))
})

const categoria = { id: 'CAT-001', nome: 'In Natura / Mesa' }
const produto = { id: 'TOM-101', nome: 'Tomate Debora Premium', categoriaId: 'CAT-001', quantidadeKg: 90, custoMedioKg: 7.8 }
const fazenda = {
  id: 'FAZ-001',
  nome: 'Fazenda Sol Nascente',
  localizacao: 'Fazenda Sol Nascente - Gleba A',
  coordenada: { latitude: -22.7253, longitude: -47.6492 },
  produtos: [{ produtoId: 'TOM-101', valorKg: 7.8 }, { produtoId: 'TOM-102', valorKg: 5.5 }],
}

describe('saúde', () => {
  test('GET /api/saude responde ok', async () => {
    const resposta = await request(app).get('/api/saude')
    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ ok: true })
  })
})

describe('PUT (usado pelo app): cria ou atualiza', () => {
  test('cria com 201 e atualiza com 200', async () => {
    const criado = await request(app).put('/api/produtos/TOM-101').send(produto)
    expect(criado.status).toBe(201)
    expect(criado.body).toMatchObject(produto)

    const atualizado = await request(app).put('/api/produtos/TOM-101').send({ ...produto, quantidadeKg: 150, custoMedioKg: 7.67 })
    expect(atualizado.status).toBe(200)
    expect(atualizado.body).toMatchObject({ quantidadeKg: 150, custoMedioKg: 7.67 })

    const lista = await request(app).get('/api/produtos')
    expect(lista.body).toHaveLength(1)
  })

  test('recusa dados inválidos com 400', async () => {
    const semNome = await request(app).put('/api/categorias/CAT-001').send({ nome: '' })
    expect(semNome.status).toBe(400)

    const estoqueNegativo = await request(app).put('/api/produtos/TOM-101').send({ ...produto, quantidadeKg: -1 })
    expect(estoqueNegativo.status).toBe(400)

    const precoZero = await request(app)
      .put('/api/fazendas/FAZ-001')
      .send({ ...fazenda, produtos: [{ produtoId: 'TOM-101', valorKg: 0 }] })
    expect(precoZero.status).toBe(400)
  })

  test('JSON malformado responde 400', async () => {
    const resposta = await request(app)
      .put('/api/categorias/CAT-001')
      .set('Content-Type', 'application/json')
      .send('{ nome: ')
    expect(resposta.status).toBe(400)
  })
})

describe('fazendas com produtos fornecidos', () => {
  test('salva e lê os produtos com o preço de cada um, na ordem', async () => {
    await request(app).put('/api/fazendas/FAZ-001').send(fazenda).expect(201)

    const lida = await request(app).get('/api/fazendas/FAZ-001')
    expect(lida.status).toBe(200)
    expect(lida.body).toMatchObject(fazenda)
  })

  test('atualizar substitui a lista de produtos (preço novo, produto removido)', async () => {
    await request(app).put('/api/fazendas/FAZ-001').send(fazenda)
    await request(app)
      .put('/api/fazendas/FAZ-001')
      .send({ ...fazenda, produtos: [{ produtoId: 'TOM-101', valorKg: 8.5 }] })

    const lida = await request(app).get('/api/fazendas/FAZ-001')
    expect(lida.body.produtos).toEqual([{ produtoId: 'TOM-101', valorKg: 8.5 }])
  })
})

describe('POST cria uma vez', () => {
  test('201 na criação e 409 se o ID já existe', async () => {
    await request(app).post('/api/categorias').send(categoria).expect(201)
    await request(app).post('/api/categorias').send(categoria).expect(409)
  })

  test('400 sem ID', async () => {
    await request(app).post('/api/categorias').send({ nome: 'Orgânico' }).expect(400)
  })
})

describe('DELETE', () => {
  test('exclui (204) e depois o registro não existe (404)', async () => {
    await request(app).put('/api/categorias/CAT-001').send(categoria)
    await request(app).delete('/api/categorias/CAT-001').expect(204)
    await request(app).get('/api/categorias/CAT-001').expect(404)
    await request(app).delete('/api/categorias/CAT-001').expect(404)
  })

  test('excluir a fazenda apaga os produtos fornecidos dela', async () => {
    await request(app).put('/api/fazendas/FAZ-001').send(fazenda)
    await request(app).delete('/api/fazendas/FAZ-001').expect(204)
    await request(app).put('/api/fazendas/FAZ-001').send({ ...fazenda, produtos: [] }).expect(201)

    const lida = await request(app).get('/api/fazendas/FAZ-001')
    expect(lida.body.produtos).toEqual([])
  })
})

describe('usuários', () => {
  test('guarda o perfil sem senha', async () => {
    const usuario = { id: 'USR-001', nome: 'Caio Pragana', email: 'caio@exemplo.com', permissao: 'Administrador de Estoque' }
    await request(app).put('/api/usuarios/USR-001').send({ ...usuario, senha: '123456' }).expect(201)

    const lido = await request(app).get('/api/usuarios/USR-001')
    expect(lido.body).toMatchObject(usuario)
    expect(lido.body).not.toHaveProperty('senha')
  })
})

test('recurso inexistente responde 404', async () => {
  await request(app).get('/api/tarefas').expect(404)
})
