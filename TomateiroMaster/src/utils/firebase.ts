import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';

// RN-01 / RN-28: as contas e senhas ficam no Firebase Authentication.
// Chaves do projeto no arquivo .env.local (veja .env.example).
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

export const firebaseConfigurado = !!(config.apiKey && config.projectId && config.appId)

let auth: Auth | null = null

// A sessão do app fica no banco local (RN-34); o Firebase só confere a senha,
// então não precisa guardar sessão própria (memória)
function obterAuth() {
  if (!firebaseConfigurado) return null
  if (!auth) {
    const app: FirebaseApp = getApps()[0] ?? initializeApp(config)
    auth = initializeAuth(app, { persistence: inMemoryPersistence })
  }
  return auth
}

export type ErroFirebase = 'credenciais' | 'existe' | 'fraca' | 'rede' | 'config' | 'desconhecido'

export type ResultadoFirebase<T = void> = { ok: true; valor: T } | { ok: false; erro: ErroFirebase }

function traduzirErro(erro: unknown): ErroFirebase {
  const codigo = (erro as { code?: string })?.code ?? ''
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email', 'auth/user-disabled'].includes(codigo)) {
    return 'credenciais'
  }
  if (codigo === 'auth/email-already-in-use') return 'existe'
  if (codigo === 'auth/weak-password') return 'fraca'
  if (codigo === 'auth/network-request-failed' || codigo === 'auth/too-many-requests') return 'rede'
  return 'desconhecido'
}

async function executar<T>(tarefa: (auth: Auth) => Promise<T>): Promise<ResultadoFirebase<T>> {
  const instancia = obterAuth()
  if (!instancia) return { ok: false, erro: 'config' }
  try {
    return { ok: true, valor: await tarefa(instancia) }
  } catch (erro) {
    return { ok: false, erro: traduzirErro(erro) }
  } finally {
    signOut(instancia).catch(() => {})
  }
}

// Confere e-mail e senha. Retorna o nome cadastrado no Firebase (displayName), se houver.
export function entrarFirebase(email: string, senha: string) {
  return executar(async (instancia) => {
    const credencial = await signInWithEmailAndPassword(instancia, email, senha)
    return credencial.user.displayName ?? null
  })
}

export function criarContaFirebase(email: string, nome: string, senha: string) {
  return executar(async (instancia) => {
    const credencial = await createUserWithEmailAndPassword(instancia, email, senha)
    await updateProfile(credencial.user, { displayName: nome })
  })
}

// RN-27: entrar com a senha atual confere que ela está correta; depois troca a senha
export function alterarSenhaFirebase(email: string, senhaAtual: string, novaSenha: string) {
  return executar(async (instancia) => {
    const credencial = await signInWithEmailAndPassword(instancia, email, senhaAtual)
    await updatePassword(credencial.user, novaSenha)
  })
}
