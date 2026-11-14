# Tomateiro Master — API de backup

API REST (Node + Express + SQLite) que recebe o backup do app (RN-40). O celular é a fonte dos dados: o app só **envia**; a API guarda.

Usa o SQLite embutido no Node (`node:sqlite`), então precisa do **Node 22.5 ou mais novo** e não tem compilação nativa.

## Rodar

```bash
cd backend
npm install
npm start          # http://localhost:3000/api  (banco: backend/tomateiro-backup.db)
npm run dev        # reinicia sozinho ao salvar
npm test           # testes (Jest + Supertest, banco em memória)
```

Variáveis opcionais: `PORT` (padrão 3000) e `DB_PATH` (arquivo do banco).

## Ligar o app à API

No `TomateiroMaster/.env.local`:

```
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
```

Use o **IP do computador na rede Wi-Fi** (`ipconfig` no Windows). `localhost` só funciona no navegador do próprio computador, não no celular. O servidor escuta em `0.0.0.0`, então aceita o celular na mesma rede (libere a porta no Firewall do Windows se pedir).

## Rotas

`recurso` = `usuarios` | `categorias` | `produtos` | `fazendas`

| Método | Rota | O que faz |
| :--- | :--- | :--- |
| GET | `/api/saude` | `{ "ok": true }` |
| GET | `/api/:recurso` | lista tudo |
| GET | `/api/:recurso/:id` | um registro (404 se não existe) |
| POST | `/api/:recurso` | cria (o corpo traz o `id`; 409 se já existe) |
| PUT | `/api/:recurso/:id` | cria (201) ou atualiza (200) — **é o que o app usa** |
| DELETE | `/api/:recurso/:id` | exclui (204; 404 se não existe) |

Dados inválidos respondem **400**. Usuários são guardados **sem senha** (a senha fica no Firebase) e as fotos não vão para a API (ficam só no celular).

Exemplo:

```bash
curl -X PUT http://localhost:3000/api/categorias/CAT-001 \
  -H "Content-Type: application/json" \
  -d '{"id":"CAT-001","nome":"In Natura / Mesa"}'
```
