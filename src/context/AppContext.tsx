import { categoriasIniciais, produtosIniciais, usuariosIniciais } from '@/src/data/dados-iniciais';
import { Categoria, Produto, TipoToast, Toast, Usuario, UsuarioCadastrado } from '@/src/types';
import { apagarFotoPerfil, carregarDados, guardarFotoPerfil, salvarDados } from '@/src/utils/banco';
import { confirmarBiometria, lerEmailBiometria, salvarEmailBiometria } from '@/src/utils/biometria';
import { EMAIL_VALIDO } from '@/src/utils/validacao';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

const DURACAO_TOAST = 3000 // RN-26
const PASSO_ESTOQUE = 10 // RN-07

type NovoProduto = Omit<Produto, 'id'>

interface AppContextData {
  usuario: Usuario | null
  produtos: Produto[]
  categorias: Categoria[]
  filtroCategoria: string | null // null = "Todas"
  toast: Toast | null

  setFiltroCategoria: (categoriaId: string | null) => void
  mostrarToast: (mensagem: string, tipo?: TipoToast) => void
  login: (email: string, senha: string) => boolean
  cadastrarUsuario: (email: string, nome: string, senha: string, confirmacao: string) => boolean
  logout: () => void
  ajustarEstoque: (produtoId: string, sentido: 1 | -1) => void
  adicionarProduto: (produto: NovoProduto) => void
  adicionarCategoria: (nome: string) => boolean
  excluirProduto: (produtoId: string) => void
  excluirCategoria: (categoriaId: string) => void
  alterarSenha: (senhaAtual: string, novaSenha: string, confirmacao: string) => boolean
  alterarFoto: (uri: string | null) => Promise<void>

  // RN-33: e-mail da conta com biometria ativada neste celular (null = nenhuma)
  emailBiometria: string | null
  ativarBiometria: () => Promise<void>
  desativarBiometria: () => Promise<void>
  entrarComBiometria: () => Promise<boolean>
}

const AppContext = createContext<AppContextData | null>(null)

// Maior número já usado em IDs no formato PREFIXO-NNN
function maiorNumero(ids: string[]) {
  return ids.reduce((maior, id) => Math.max(maior, Number(id.split('-')[1]) || 0), 0)
}

// IDs em auto-increment: PREFIXO-NNN (ex: TOM-105, CAT-005, USR-002)
function formatarId(prefixo: string, numero: number) {
  return `${prefixo}-${String(numero).padStart(3, '0')}`
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Contadores de auto-increment: nunca reaproveitam um ID, mesmo após exclusão
  const ultimoIdProduto = useRef(maiorNumero(produtosIniciais.map((produto) => produto.id)))
  const ultimoIdCategoria = useRef(maiorNumero(categoriasIniciais.map((categoria) => categoria.id)))
  const ultimoIdUsuario = useRef(maiorNumero(usuariosIniciais.map((item) => item.id)))

  const [usuarios, setUsuarios] = useState<UsuarioCadastrado[]>(usuariosIniciais)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais)
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciais)
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const timerToast = useRef<ReturnType<typeof setTimeout> | null>(null)

  // RN-34: carrega o banco local ao abrir o app (1ª vez = dados iniciais)
  const [carregado, setCarregado] = useState(false)
  useEffect(() => {
    carregarDados()
      .then((dados) => {
        if (!dados) return
        ultimoIdProduto.current = dados.ultimosIds.produto
        ultimoIdCategoria.current = dados.ultimosIds.categoria
        ultimoIdUsuario.current = dados.ultimosIds.usuario
        setUsuarios(dados.usuarios)
        setProdutos(dados.produtos)
        setCategorias(dados.categorias)

        // Sessão continua até "Sair da Conta"
        const logado = dados.usuarios.find((item) => item.id === dados.sessao)
        if (logado) {
          const { senha: _senha, ...semSenha } = logado
          setUsuario(semSenha)
        }
      })
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
      ultimosIds: {
        produto: ultimoIdProduto.current,
        categoria: ultimoIdCategoria.current,
        usuario: ultimoIdUsuario.current,
      },
      sessao: usuario?.id ?? null,
    }).catch(() => {})
  }, [carregado, usuarios, produtos, categorias, usuario?.id])

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

  // RN-01: só entram usuários cadastrados, com a senha correta
  function login(email: string, senha: string) {
    const cadastrado = usuarios.find(
      (item) => item.email.toLowerCase() === email.toLowerCase() && item.senha === senha
    )
    if (!cadastrado) {
      mostrarToast('E-mail ou senha incorretos!', 'erro')
      return false
    }

    entrarComo(cadastrado)
    return true
  }

  // RN-02 / RN-03: nome, e-mail e permissão vêm do cadastro
  function entrarComo(cadastrado: UsuarioCadastrado) {
    const { senha: _senha, ...dados } = cadastrado
    setUsuario(dados)
    mostrarToast(`Bem-vindo, ${dados.nome}!`)
  }

  // RN-33: ativar exige confirmar a biometria; só uma conta por celular
  async function ativarBiometria() {
    if (!usuario) return
    const resultado = await confirmarBiometria('Confirme para ativar a entrada por biometria')
    if (resultado === 'cancelado') return
    if (resultado === 'falhou') {
      mostrarToast('Biometria não reconhecida!', 'erro')
      return
    }

    await salvarEmailBiometria(usuario.email)
    setEmailBiometria(usuario.email)
    mostrarToast('Entrada por biometria ativada!')
  }

  async function desativarBiometria() {
    await salvarEmailBiometria(null)
    setEmailBiometria(null)
    mostrarToast('Entrada por biometria desativada!')
  }

  async function entrarComBiometria() {
    if (!emailBiometria) return false

    const resultado = await confirmarBiometria('Entrar no Tomateiro Master')
    if (resultado === 'cancelado') return false
    if (resultado === 'falhou') {
      mostrarToast('Biometria não reconhecida!', 'erro')
      return false
    }

    // A conta salva pode não existir mais (ex: dados do app apagados)
    const cadastrado = usuarios.find((item) => item.email.toLowerCase() === emailBiometria.toLowerCase())
    if (!cadastrado) {
      await salvarEmailBiometria(null)
      setEmailBiometria(null)
      mostrarToast('Conta da biometria não encontrada. Entre com e-mail e senha!', 'erro')
      return false
    }

    entrarComo(cadastrado)
    return true
  }

  // RN-28: cadastro de novo usuário
  function cadastrarUsuario(email: string, nome: string, senha: string, confirmacao: string) {
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
    if (senha.length < 4) {
      mostrarToast('A senha deve ter no mínimo 4 caracteres!', 'erro')
      return false
    }
    if (senha !== confirmacao) {
      mostrarToast('A senha e a confirmação não conferem!', 'erro')
      return false
    }

    ultimoIdUsuario.current += 1
    const id = formatarId('USR', ultimoIdUsuario.current)
    setUsuarios((atuais) => [
      ...atuais,
      { id, nome: nomeFormatado, email: emailFormatado, senha, permissao: 'Administrador de Estoque' }, // RN-03
    ])
    mostrarToast('Conta criada com sucesso!')
    return true
  }

  // RN-04
  function logout() {
    setUsuario(null)
    setFiltroCategoria(null)
    mostrarToast('Você saiu do sistema.')
  }

  // RN-07 / RN-08
  function ajustarEstoque(produtoId: string, sentido: 1 | -1) {
    const produto = produtos.find((item) => item.id === produtoId)
    if (!produto) return

    setProdutos((atuais) =>
      atuais.map((item) =>
        item.id === produtoId
          ? { ...item, quantidadeKg: Math.max(0, item.quantidadeKg + sentido * PASSO_ESTOQUE) }
          : item
      )
    )
    mostrarToast(`Estoque de "${produto.nome}" atualizado!`)
  }

  function adicionarProduto(novo: NovoProduto) {
    ultimoIdProduto.current += 1
    const id = formatarId('TOM', ultimoIdProduto.current)
    setProdutos((atuais) => [...atuais, { ...novo, id }])
    mostrarToast('Novo lote de tomate adicionado com sucesso!')
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
    const id = formatarId('CAT', ultimoIdCategoria.current)
    setCategorias((atuais) => [...atuais, { id, nome: nomeFormatado }])
    mostrarToast('Nova categoria registrada!')
    return true
  }

  function excluirProduto(produtoId: string) {
    const produto = produtos.find((item) => item.id === produtoId)
    if (!produto) return

    setProdutos((atuais) => atuais.filter((item) => item.id !== produtoId))
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
    mostrarToast(`Categoria "${categoria.nome}" excluída!`)
  }

  function alterarSenha(senhaAtual: string, novaSenha: string, confirmacao: string) {
    const cadastrado = usuarios.find((item) => item.id === usuario?.id)

    // RN-27
    if (!cadastrado || senhaAtual !== cadastrado.senha) {
      mostrarToast('A senha atual está incorreta!', 'erro')
      return false
    }
    // RN-23
    if (novaSenha.length < 4) {
      mostrarToast('A nova senha deve ter no mínimo 4 caracteres!', 'erro')
      return false
    }
    // RN-22
    if (novaSenha !== confirmacao) {
      mostrarToast('A nova senha e a confirmação não conferem!', 'erro')
      return false
    }

    // A nova senha passa a valer no próximo login
    setUsuarios((atuais) =>
      atuais.map((item) => (item.id === cadastrado.id ? { ...item, senha: novaSenha } : item))
    )
    mostrarToast('Senha alterada com sucesso!')
    return true
  }

  // RN-29 / RN-34: foto fica salva no cadastro (banco local); null remove
  async function alterarFoto(uri: string | null) {
    if (!usuario) return

    let foto: string | undefined
    if (uri) {
      try {
        foto = await guardarFotoPerfil(uri, usuario.id)
      } catch {
        foto = uri // falhou a cópia: usa a foto original
      }
    }
    apagarFotoPerfil(usuario.foto)

    setUsuario({ ...usuario, foto })
    setUsuarios((atuais) =>
      atuais.map((item) => (item.id === usuario.id ? { ...item, foto } : item))
    )
    mostrarToast(uri ? 'Foto de perfil atualizada!' : 'Foto de perfil removida!')
  }

  // Só mostra as telas depois de carregar o banco (evita piscar o Login com sessão salva)
  if (!carregado) return null

  return (
    <AppContext.Provider
      value={{
        usuario,
        produtos,
        categorias,
        filtroCategoria,
        toast,
        setFiltroCategoria,
        mostrarToast,
        login,
        cadastrarUsuario,
        logout,
        ajustarEstoque,
        adicionarProduto,
        adicionarCategoria,
        excluirProduto,
        excluirCategoria,
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
