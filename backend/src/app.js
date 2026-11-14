// API REST de backup do Tomateiro Master (RN-40)
//   GET    /api/saude
//   GET    /api/:recurso            lista
//   GET    /api/:recurso/:id        um registro
//   POST   /api/:recurso            cria (o corpo traz o "id"; 409 se já existir)
//   PUT    /api/:recurso/:id        cria ou atualiza (usado pelo app)
//   DELETE /api/:recurso/:id        exclui
// recurso = usuarios | categorias | produtos | fazendas
const express = require('express')
const cors = require('cors')
const { recursos } = require('./recursos')

function criarApp(db) {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/saude', (_req, res) => res.json({ ok: true }))

  // Resolve o recurso da URL ou responde 404
  app.param('recurso', (req, res, next, nome) => {
    if (!Object.hasOwn(recursos, nome)) return res.status(404).json({ erro: `Recurso "${nome}" não existe` })
    req.recurso = recursos[nome]
    next()
  })

  app.get('/api/:recurso', (req, res) => res.json(req.recurso.listar(db)))

  app.get('/api/:recurso/:id', (req, res) => {
    const registro = req.recurso.buscar(db, req.params.id)
    if (!registro) return res.status(404).json({ erro: 'Registro não encontrado' })
    res.json(registro)
  })

  app.post('/api/:recurso', (req, res) => {
    const corpo = req.body ?? {}
    if (typeof corpo.id !== 'string' || !corpo.id.trim() || !req.recurso.validar(corpo)) {
      return res.status(400).json({ erro: 'Dados inválidos' })
    }
    if (req.recurso.buscar(db, corpo.id)) return res.status(409).json({ erro: 'ID já existe' })
    req.recurso.salvar(db, corpo.id, corpo)
    res.status(201).json(req.recurso.buscar(db, corpo.id))
  })

  app.put('/api/:recurso/:id', (req, res) => {
    const corpo = req.body ?? {}
    if (!req.recurso.validar(corpo)) return res.status(400).json({ erro: 'Dados inválidos' })
    const existia = !!req.recurso.buscar(db, req.params.id)
    req.recurso.salvar(db, req.params.id, corpo)
    res.status(existia ? 200 : 201).json(req.recurso.buscar(db, req.params.id))
  })

  app.delete('/api/:recurso/:id', (req, res) => {
    if (!req.recurso.excluir(db, req.params.id)) return res.status(404).json({ erro: 'Registro não encontrado' })
    res.status(204).end()
  })

  // JSON malformado e erros inesperados
  app.use((erro, _req, res, _next) => {
    if (erro.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido' })
    console.error(erro)
    res.status(500).json({ erro: 'Erro interno' })
  })

  return app
}

module.exports = { criarApp }
