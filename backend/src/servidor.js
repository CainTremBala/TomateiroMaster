const path = require('node:path')
const { abrirBanco } = require('./banco')
const { criarApp } = require('./app')

const PORTA = Number(process.env.PORT) || 3000
const ARQUIVO = process.env.DB_PATH || path.join(__dirname, '..', 'tomateiro-backup.db')

const app = criarApp(abrirBanco(ARQUIVO))

// 0.0.0.0 = aceita conexões do celular na mesma rede Wi-Fi
app.listen(PORTA, '0.0.0.0', () => {
  console.log(`API de backup do Tomateiro Master em http://localhost:${PORTA}/api`)
  console.log(`Banco: ${ARQUIVO}`)
})
