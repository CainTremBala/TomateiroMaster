import { categoriasIniciais, fazendasIniciais, produtosIniciais, usuariosIniciais } from '@/src/data/dados-iniciais';
import { Categoria, Fazenda, NovaFazenda, Produto, TipoToast, Toast, Usuario } from '@/src/types';
import { apagarFoto, guardarFoto } from '@/src/utils/arquivos';
import { adicionarNaFila, carregarDados, lerFila, removerDaFila, salvarDados } from '@/src/utils/banco';
import { NovaOperacao } from '@/src/utils/banco-tipos';
import { confirmarBiometria, lerContaBiometria, lerEmailBiometria, MENSAGEM_BIOMETRIA_FALHOU, salvarContaBiometria } from '@/src/utils/biometria';
import { calcularEntrada, calcularSaida } from '@/src/utils/estoque';
import { alterarSenhaFirebase, criarContaFirebase, entrarFirebase, ErroFirebase } from '@/src/utils/firebase';
import { enviarFila, useConexao } from '@/src/utils/sincronizacao';
import { EMAIL_VALIDO } from '@/src/utils/validacao';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

const DURACAO_TOAST = 3000 // RN-26
const SENHA_MINIMA = 6 // RN-23 / RN-28 (mínimo do Firebase)
const INTERVALO_REENVIO = 30000 // RN-40: tenta reenviar a fila a cada 30s enquanto houver pendências

const SEM_CONEXAO = 'Sem conexão com a internet!'

interface AppContextData {
  usuario: Usuario | null
  produtos: Produto[]
  categorias: Categoria[]
  fazendas: Fazenda[]
  filtroCategoria: string | null // null = "Todas"
  toast: Toast | null

  // RN-41: situação da conexão e do backup
  online: boolean
  pendentes: number

  setFiltroCategoria: (categoriaId: string | null) => void
  mostrarToast: (mensagem: string, tipo?: TipoToast) => void
  login: (email: string, senha: string) => Promise<boolean>
  cadastrarUsuario: (email: string, nome: string, senha: string, confirmacao: string) => Promise<boolean>
  logout: () => void
  entradaEstoque: (produtoId: string, fazendaId: string, quantidadeKg: number) => void
  saidaEstoque: (produtoId: string, quantidadeKg: number) => void
  adicionarProduto: (nome: string, categoriaId: string) => void
  adicionarCategoria: (nome: string) => boolean
  salvarFazenda: (dados: NovaFazenda, fazendaId?: string) => Promise<boolean>
  excluirProduto: (produtoId: string) => void
  excluirCategoria: (categoriaId: string) => void
  excluirFazenda: (fazendaId: string) => void
  fazendasDoProduto: (produtoId: string) => { fazenda: Fazenda; valorKg: number; foto?: string }[]
  alterarSenha: (senhaAtual: string, novaSenha: string, confirmacao: string) => Promise<boolean>
  alterarFoto: (uri: string | null) => Promise<void>

  // RN-33: e-mail da conta com biometria ativada neste celular (null = nenhuma)
  emailBiometria: string | null
  ativarBiometria: (senha: string) => Promise<boolean>
  desativarBiometria: () => Promise<void>
  entrarComBiometria: () => Promise<boolean>
}

const AppContext = createContext<AppContextData | null>(null)

// Maior número já usado em IDs no formato PREFIXO-NNN
function maiorNumero(ids: string[]) {
  return ids.reduce((maior, id) => Math.max(maior, Number(id.split('-')[1]) || 0), 0)
}

// IDs em auto-increment: PREFIXO-NNN (ex: TOM-105, CAT-005, FAZ-005, USR-002)
function formatarId(prefixo: string, numero: number) {
  return `${prefixo}-${String(numero).padStart(3, '0')}`
}

// RN-40: o backup não leva fotos (ficam só no celular) nem senha (fica no Firebase)
function usuarioParaBackup({ foto: _foto, ...usuario }: Usuario) {
  return usuario
}

function fazendaParaBackup(fazenda: Fazenda) {
  return { ...fazenda, produtos: fazenda.produtos.map(({ produtoId, valorKg }) => ({ produtoId, valorKg })) }
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Contadores de auto-increment: nunca reaproveitam um ID, mesmo após exclusão
  const ultimoIdProduto = useRef(maiorNumero(produtosIniciais.map((produto) => produto.id)))
  const ultimoIdCategoria = useRef(maiorNumero(categoriasIniciais.map((categoria) => categoria.id)))
  const ultimoIdFazenda = useRef(maiorNumero(fazendasIniciais.map((fazenda) => fazenda.id)))
  const ultimoIdUsuario = useRef(maiorNumero(usuariosIniciais.map((item) => item.id)))

  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciais)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais)
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciais)
  const [fazendas, setFazendas] = useState<Fazenda[]>(fazendasIniciais)
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const timerToast = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── RN-40 / RN-41: fila de backup para a API ─────────────────────────────
  const online = useConexao()
  const [pendentes, setPendentes] = useState(0)
  const enviando = useRef(false)

  const tentarEnviar = useCallback(async () => {
    if (enviando.current) return
    enviando.current = true
    try {
      setPendentes(await enviarFila({ lerFila, removerDaFila }))
    } catch {
      // banco/fila ilegível: tenta de novo depois
    } finally {
      enviando.current = false
    }
  }, [])

  function enfileirar(...operacoes: NovaOperacao[]) {
    operacoes
      .reduce((anterior, operacao) => anterior.then(() => adicionarNaFila(operacao)), Promise.resolve())
      .then(() => {
        setPendentes((atual) => atual + operacoes.length)
        if (online) tentarEnviar()
      })
      .catch(() => {})
  }

  // Internet voltou → envia a fila; com pendências, tenta de novo a cada 30s
  useEffect(() => {
    if (!online) return
    tentarEnviar()
    if (pendentes === 0) return
    const timer = setInterval(tentarEnviar, INTERVALO_REENVIO)
    return () => clearInterval(timer)
  }, [online, pendentes > 0, tentarEnviar]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── RN-34: carrega o banco local (SQLite) ao abrir o app ─────────────────
  const [carregado, setCarregado] = useState(false)
  useEffect(() => {
    carregarDados()
      .then(async (dados) => {
        if (!dados) {
          // Primeira abertura: dados iniciais e backup completo deles na API (RN-40)
          await Promise.all([
            ...categoriasIniciais.map((item) =>
              adicionarNaFila({ recurso: 'categorias', acao: 'salvar', registroId: item.id, dados: item })),
            ...produtosIniciais.map((item) =>
              adicionarNaFila({ recurso: 'produtos', acao: 'salvar', registroId: item.id, dados: item })),
            ...fazendasIniciais.map((item) =>
              adicionarNaFila({ recurso: 'fazendas', acao: 'salvar', registroId: item.id, dados: fazendaParaBackup(item) })),
          ])
          return
        }

        ultimoIdProduto.current = dados.ultimosIds.produto
        ultimoIdCategoria.current = dados.ultimosIds.categoria
        ultimoIdFazenda.current = dados.ultimosIds.fazenda
        ultimoIdUsuario.current = dados.ultimosIds.usuario
        setUsuarios(dados.usuarios)
        setProdutos(dados.produtos)
        setCategorias(dados.categorias)
        setFazendas(dados.fazendas)

        // Sessão continua até "Sair da Conta"
        setUsuario(dados.usuarios.find((item) => item.id === dados.sessao) ?? null)
      })
      .then(() => lerFila())
      .then((fila) => setPendentes(fila.length))
      .catch(() => {}) // banco ilegível: segue com os dados iniciais
      .finally(() => setCarregado(true))
  }, [])

  // RN-34: salva a cada alteração (só depois de carregar, para não sobrescrever o banco)
  useEffect(() => {
    if (!carregado) return
    salvarDados({
      usuarios,
      produtos,
      categorias,
      fazendas,
      ultimosIds: {
        produto: ultimoIdProduto.current,
        categoria: ultimoIdCategoria.current,
        fazenda: ultimoIdFazenda.current,
        usuario: ultimoIdUsuario.current,
      },
      sessao: usuario?.id ?? null,
    }).catch(() => {})
  }, [carregado, usuarios, produtos, categorias, fazendas, usuario?.id])

  // RN-33: carrega do armazenamento seguro a conta com biometria ativada
  const [emailBiometria, setEmailBiometria] = useState<string | null>(null)
  useEffect(() => {
    lerEmailBiometria().then(setEmailBiometria).catch(() => setEmailBiometria(null))
  }, [])

  // RN-25 / RN-26: um novo toast substitui o anterior e reinicia o tempo
  function mostrarToast(mensagem: string, tipo: TipoToast = 'sucesso') {
    if (timerToast.current) clearTimeout(timerToast.current)
    setToast({ id: Date.now(), mensagem, tipo })
    timerToast.current = setTimeout(() => setToast(null), DURACAO_TOAST)
  }

  function mostrarErroFirebase(erro: ErroFirebase, mensagemCredenciais: string) {
    const mensagens: Record<ErroFirebase, string> = {
      credenciais: mensagemCredenciais,
      existe: 'E-mail já cadastrado!',
      fraca: `A senha deve ter no mínimo ${SENHA_MINIMA} caracteres!`,
      rede: SEM_CONEXAO,
      config: 'Firebase não configurado. Preencha o arquivo .env.local!',
      desconhecido: 'Não foi possível falar com o Firebase. Tente novamente!',
    }
    mostrarToast(mensagens[erro], 'erro')
  }

  // ── Autenticação (RN-01 / RN-28 / RN-33 com Firebase) ────────────────────

  // Perfil local (nome, foto, permissão) da conta do Firebase; cria na 1ª entrada neste celular
  function garantirPerfil(email: string, nome: string | null): Usuario {
    const existente = usuarios.find((item) => item.email.toLowerCase() === email.toLowerCase())
    if (existente) return existente

    ultimoIdUsuario.current += 1
    const novo: Usuario = {
      id: formatarId('USR', ultimoIdUsuario.current),
      nome: nome?.trim() || email.split('@')[0],
      email,
      permissao: 'Administrador de Estoque', // RN-03
    }
    setUsuarios((atuais) => [...atuais, novo])
    enfileirar({ recurso: 'usuarios', acao: 'salvar', registroId: novo.id, dados: usuarioParaBackup(novo) })
    return novo
  }

  // RN-02 / RN-03: nome, e-mail e permissão vêm do cadastro
  function entrarComo(perfil: Usuario) {
    setUsuario(perfil)
    mostrarToast(`Bem-vindo, ${perfil.nome}!`)
  }

  // RN-01: só entram contas do Firebase com a senha correta (exige internet)
  async function login(email: string, senha: string) {
    if (!online) {
      mostrarToast(SEM_CONEXAO, 'erro')
      return false
    }

    const resultado = await entrarFirebase(email, senha)
    if (!resultado.ok) {
      mostrarErroFirebase(resultado.erro, 'E-mail ou senha incorretos!')
      return false
    }

    entrarComo(garantirPerfil(email, resultado.valor))
    return true
  }

  // RN-33: ativar exige a senha (confere no Firebase) e a biometria; só uma conta por celular
  async function ativarBiometria(senha: string) {
    if (!usuario) return false
    if (!online) {
      mostrarToast(SEM_CONEXAO, 'erro')
      return false
    }

    const conferida = await entrarFirebase(usuario.email, senha)
    if (!conferida.ok) {
      mostrarErroFirebase(conferida.erro, 'A senha atual está incorreta!')
      return false
    }

    const resultado = await confirmarBiometria('Confirme para ativar a entrada por biometria')
    if (resultado === 'cancelado') return false
    if (resultado === 'falhou') {
      mostrarToast(MENSAGEM_BIOMETRIA_FALHOU, 'erro')
      return false
    }

    await salvarContaBiometria({ email: usuario.email, senha })
    setEmailBiometria(usuario.email)
    mostrarToast('Entrada por biometria ativada!')
    return true
  }

  async function desativarBiometria() {
    await salvarContaBiometria(null)
    setEmailBiometria(null)
    mostrarToast('Entrada por biometria desativada!')
  }

  async function removerBiometriaInvalida() {
    await salvarContaBiometria(null)
    setEmailBiometria(null)
    mostrarToast('Conta da biometria não encontrada. Entre com e-mail e senha!', 'erro')
  }

  // RN-33: online entra no Firebase com a senha guardada; offline entra pelo perfil salvo no celular
  async function entrarComBiometria() {
    if (!emailBiometria) return false

    const resultado = await confirmarBiometria('Entrar no Tomateiro Master')
    if (resultado === 'cancelado') return false
    if (resultado === 'falhou') {
      mostrarToast(MENSAGEM_BIOMETRIA_FALHOU, 'erro')
      return false
    }

    const conta = await lerContaBiometria()
    if (!conta) {
      await removerBiometriaInvalida()
      return false
    }

    if (online) {
      const conferida = await entrarFirebase(conta.email, conta.senha)
      if (conferida.ok) {
        entrarComo(garantirPerfil(conta.email, conferida.valor))
        return true
      }
      // Senha trocada ou conta apagada no Firebase: a biometria salva não vale mais
      if (conferida.erro === 'credenciais') {
        await removerBiometriaInvalida()
        return false
      }
      // Falha de rede/Firebase: segue como offline
    }

    const perfil = usuarios.find((item) => item.email.toLowerCase() === conta.email.toLowerCase())
    if (!perfil) {
      mostrarToast(SEM_CONEXAO, 'erro')
      return false
    }
    entrarComo(perfil)
    return true
  }

  // RN-28: cadastro de novo usuário no Firebase (exige internet)
  async function cadastrarUsuario(email: string, nome: string, senha: string, confirmacao: string) {
    const emailFormatado = email.trim()
    const nomeFormatado = nome.trim()

    if (!EMAIL_VALIDO.test(emailFormatado)) {
      mostrarToast('Informe um e-mail válido!', 'erro')
      return false
    }
    if (usuarios.some((item) => item.email.toLowerCase() === emailFormatado.toLowerCase())) {
      mostrarToast('E-mail já cadastrado!', 'erro')
      return false
    }
    if (nomeFormatado.length < 3) {
      mostrarToast('O nome deve ter no mínimo 3 caracteres!', 'erro')
      return false
    }
    if (senha.length < SENHA_MINIMA) {
      mostrarToast(`A senha deve ter no mínimo ${SENHA_MINIMA} caracteres!`, 'erro')
      return false
    }
    if (senha !== confirmacao) {
      mostrarToast('A senha e a confirmação não conferem!', 'erro')
      return false
    }
    if (!online) {
      mostrarToast(SEM_CONEXAO, 'erro')
      return false
    }

    const criada = await criarContaFirebase(emailFormatado, nomeFormatado, senha)
    if (!criada.ok) {
      mostrarErroFirebase(criada.erro, 'E-mail já cadastrado!')
      return false
    }

    garantirPerfil(emailFormatado, nomeFormatado)
    mostrarToast('Conta criada com sucesso!')
    return true
  }

  // RN-04
  function logout() {
    setUsuario(null)
    setFiltroCategoria(null)
    mostrarToast('Você saiu do sistema.')
  }

  // RN-27 → RN-23 → RN-22: a senha é trocada no Firebase (exige internet)
  async function alterarSenha(senhaAtual: string, novaSenha: string, confirmacao: string) {
    if (!usuario) return false
    if (!online) {
      mostrarToast(SEM_CONEXAO, 'erro')
      return false
    }

    // RN-27
    const conferida = await entrarFirebase(usuario.email, senhaAtual)
    if (!conferida.ok) {
      mostrarErroFirebase(conferida.erro, 'A senha atual está incorreta!')
      return false
    }
    // RN-23
    if (novaSenha.length < SENHA_MINIMA) {
      mostrarToast(`A nova senha deve ter no mínimo ${SENHA_MINIMA} caracteres!`, 'erro')
      return false
    }
    // RN-22
    if (novaSenha !== confirmacao) {
      mostrarToast('A nova senha e a confirmação não conferem!', 'erro')
      return false
    }

    const alterada = await alterarSenhaFirebase(usuario.email, senhaAtual, novaSenha)
    if (!alterada.ok) {
      mostrarErroFirebase(alterada.erro, 'A senha atual está incorreta!')
      return false
    }

    // RN-33: a biometria desta conta passa a usar a nova senha
    if (emailBiometria?.toLowerCase() === usuario.email.toLowerCase()) {
      await salvarContaBiometria({ email: usuario.email, senha: novaSenha })
    }
    mostrarToast('Senha alterada com sucesso!')
    return true
  }

  // RN-29 / RN-34: foto fica salva no perfil (banco local); null remove
  async function alterarFoto(uri: string | null) {
    if (!usuario) return

    let foto: string | undefined
    if (uri) {
      try {
        foto = await guardarFoto(uri, usuario.id)
      } catch {
        foto = uri // falhou a cópia: usa a foto original
      }
    }
    apagarFoto(usuario.foto)

    setUsuario({ ...usuario, foto })
    setUsuarios((atuais) =>
      atuais.map((item) => (item.id === usuario.id ? { ...item, foto } : item))
    )
    mostrarToast(uri ? 'Foto de perfil atualizada!' : 'Foto de perfil removida!')
  }

  // ── Estoque, produtos, categorias e fazendas ─────────────────────────────

  // RN-35: fazendas que fornecem o produto, com o preço atual de cada uma
  function fazendasDoProduto(produtoId: string) {
    return fazendas.flatMap((fazenda) =>
      fazenda.produtos
        .filter((item) => item.produtoId === produtoId)
        .map((item) => ({ fazenda, valorKg: item.valorKg, foto: item.foto }))
    )
  }

  function atualizarProduto(produto: Produto) {
    setProdutos((atuais) => atuais.map((item) => (item.id === produto.id ? produto : item)))
    enfileirar({ recurso: 'produtos', acao: 'salvar', registroId: produto.id, dados: produto })
  }

  // RN-07: entrada pelo preço da fazenda escolhida, recalculando o custo médio ponderado
  function entradaEstoque(produtoId: string, fazendaId: string, quantidadeKg: number) {
    const produto = produtos.find((item) => item.id === produtoId)
    const fornecido = fazendasDoProduto(produtoId).find((item) => item.fazenda.id === fazendaId)
    if (!produto || !fornecido) return

    atualizarProduto({
      ...produto,
      ...calcularEntrada(produto.quantidadeKg, produto.custoMedioKg, quantidadeKg, fornecido.valorKg),
    })
    mostrarToast(`Estoque de "${produto.nome}" atualizado!`)
  }

  // RN-07 / RN-08: saída pelo custo médio (não muda o custo médio), nunca abaixo de 0 kg
  function saidaEstoque(produtoId: string, quantidadeKg: number) {
    const produto = produtos.find((item) => item.id === produtoId)
    if (!produto) return

    atualizarProduto({ ...produto, quantidadeKg: calcularSaida(produto.quantidadeKg, quantidadeKg) })
    mostrarToast(`Estoque de "${produto.nome}" atualizado!`)
  }

  // RN-05 / RN-06: produto nasce com 0 kg; o estoque entra pelo botão + (RN-07)
  function adicionarProduto(nome: string, categoriaId: string) {
    ultimoIdProduto.current += 1
    const produto: Produto = {
      id: formatarId('TOM', ultimoIdProduto.current),
      nome,
      categoriaId,
      quantidadeKg: 0,
      custoMedioKg: 0,
    }
    setProdutos((atuais) => [...atuais, produto])
    enfileirar({ recurso: 'produtos', acao: 'salvar', registroId: produto.id, dados: produto })
    mostrarToast('Novo lote de tomate adicionado com sucesso!')
  }

  // RN-35 / RN-36: cadastra (sem fazendaId) ou atualiza uma fazenda
  async function salvarFazenda(dados: NovaFazenda, fazendaId?: string) {
    const nome = dados.nome.trim()
    const localizacao = dados.localizacao.trim()

    if (nome.length < 3) {
      mostrarToast('O nome da fazenda deve ter no mínimo 3 caracteres!', 'erro')
      return false
    }
    const repetida = fazendas.some(
      (fazenda) => fazenda.id !== fazendaId && fazenda.nome.toLowerCase() === nome.toLowerCase()
    )
    if (repetida) {
      mostrarToast('Fazenda já existe!', 'erro')
      return false
    }
    if (!localizacao) {
      mostrarToast('Informe a localização da fazenda!', 'erro')
      return false
    }
    const coordenada = dados.coordenada
    if (!coordenada) {
      mostrarToast('Marque a localização da fazenda no mapa!', 'erro')
      return false
    }
    if (dados.produtos.length === 0) {
      mostrarToast('Adicione ao menos um produto fornecido!', 'erro')
      return false
    }
    if (dados.produtos.some((item) => !(item.valorKg > 0))) {
      mostrarToast('Informe um valor unitário positivo!', 'erro')
      return false
    }

    const id = fazendaId ?? formatarId('FAZ', ultimoIdFazenda.current + 1)

    // RN-36: copia as fotos novas para a pasta do app
    const produtosFornecidos = await Promise.all(
      dados.produtos.map(async (item) => {
        if (!item.foto) return item
        try {
          return { ...item, foto: await guardarFoto(item.foto, `${id}-${item.produtoId}`) }
        } catch {
          return item // falhou a cópia: usa a foto original
        }
      })
    )
    const fazenda: Fazenda = { id, nome, localizacao, coordenada, produtos: produtosFornecidos }

    if (fazendaId) {
      // Fotos trocadas ou removidas: apaga o arquivo anterior
      const anterior = fazendas.find((item) => item.id === fazendaId)
      const fotosAtuais = produtosFornecidos.map((item) => item.foto)
      anterior?.produtos.forEach((item) => {
        if (!fotosAtuais.includes(item.foto)) apagarFoto(item.foto)
      })
      setFazendas((atuais) => atuais.map((item) => (item.id === fazendaId ? fazenda : item)))
      mostrarToast(`Fazenda "${nome}" atualizada!`)
    } else {
      ultimoIdFazenda.current += 1
      setFazendas((atuais) => [...atuais, fazenda])
      mostrarToast('Fazenda cadastrada com sucesso!')
    }
    enfileirar({ recurso: 'fazendas', acao: 'salvar', registroId: id, dados: fazendaParaBackup(fazenda) })
    return true
  }

  // RN-37: excluir a fazenda remove os vínculos dela (o estoque já recebido continua)
  function excluirFazenda(fazendaId: string) {
    const fazenda = fazendas.find((item) => item.id === fazendaId)
    if (!fazenda) return

    fazenda.produtos.forEach((item) => apagarFoto(item.foto))
    setFazendas((atuais) => atuais.filter((item) => item.id !== fazendaId))
    enfileirar({ recurso: 'fazendas', acao: 'excluir', registroId: fazendaId, dados: null })
    mostrarToast(`Fazenda "${fazenda.nome}" excluída!`)
  }

  // RN-12 / RN-13: ID gerado em auto-increment, então só o nome pode repetir
  function adicionarCategoria(nome: string) {
    const nomeFormatado = nome.trim()

    if (!nomeFormatado) {
      mostrarToast('Informe o nome da categoria!', 'erro')
      return false
    }

    const duplicada = categorias.some(
      (categoria) => categoria.nome.toLowerCase() === nomeFormatado.toLowerCase()
    )
    if (duplicada) {
      mostrarToast('Categoria já existe!', 'erro')
      return false
    }

    ultimoIdCategoria.current += 1
    const categoria: Categoria = { id: formatarId('CAT', ultimoIdCategoria.current), nome: nomeFormatado }
    setCategorias((atuais) => [...atuais, categoria])
    enfileirar({ recurso: 'categorias', acao: 'salvar', registroId: categoria.id, dados: categoria })
    mostrarToast('Nova categoria registrada!')
    return true
  }

  function excluirProduto(produtoId: string) {
    const produto = produtos.find((item) => item.id === produtoId)
    if (!produto) return

    // RN-37: produto fornecido por alguma fazenda não pode ser excluído
    if (fazendasDoProduto(produtoId).length > 0) {
      mostrarToast(`O produto "${produto.nome}" possui fazendas vinculadas!`, 'erro')
      return
    }

    setProdutos((atuais) => atuais.filter((item) => item.id !== produtoId))
    enfileirar({ recurso: 'produtos', acao: 'excluir', registroId: produtoId, dados: null })
    mostrarToast(`Produto "${produto.nome}" excluído com sucesso!`)
  }

  function excluirCategoria(categoriaId: string) {
    const categoria = categorias.find((item) => item.id === categoriaId)
    if (!categoria) return

    // RN-14: integridade referencial
    if (produtos.some((produto) => produto.categoriaId === categoriaId)) {
      mostrarToast(`A categoria "${categoria.nome}" possui produtos vinculados!`, 'erro')
      return
    }

    // RN-15
    setCategorias((atuais) => atuais.filter((item) => item.id !== categoriaId))
    if (filtroCategoria === categoriaId) setFiltroCategoria(null)
    enfileirar({ recurso: 'categorias', acao: 'excluir', registroId: categoriaId, dados: null })
    mostrarToast(`Categoria "${categoria.nome}" excluída!`)
  }

  // Só mostra as telas depois de carregar o banco (evita piscar o Login com sessão salva)
  if (!carregado) return null

  return (
    <AppContext.Provider
      value={{
        usuario,
        produtos,
        categorias,
        fazendas,
        filtroCategoria,
        toast,
        online,
        pendentes,
        setFiltroCategoria,
        mostrarToast,
        login,
        cadastrarUsuario,
        logout,
        entradaEstoque,
        saidaEstoque,
        adicionarProduto,
        adicionarCategoria,
        salvarFazenda,
        excluirProduto,
        excluirCategoria,
        excluirFazenda,
        fazendasDoProduto,
        alterarSenha,
        alterarFoto,
        emailBiometria,
        ativarBiometria,
        desativarBiometria,
        entrarComBiometria,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const contexto = useContext(AppContext)
  if (!contexto) throw new Error('useApp deve ser usado dentro de <AppProvider>')
  return contexto
}
