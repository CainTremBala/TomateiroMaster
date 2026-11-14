import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// RN-33: conta com biometria ativada fica salva no armazenamento seguro do celular
const CHAVE_EMAIL = 'biometria_email'
const CHAVE_SENHA = 'biometria_senha'
const WEB = Platform.OS === 'web'

export type ResultadoBiometria = 'sucesso' | 'cancelado' | 'falhou'

// RN-33: aviso de falha conforme o aparelho (Face ID no iPhone, digital no Android)
export const MENSAGEM_BIOMETRIA_FALHOU =
  Platform.OS === 'ios' ? 'O Face ID não foi reconhecido!' : 'Biometria não reconhecida!'

// Aparelho com digital/Face ID configurado
export async function biometriaDisponivel() {
  if (WEB) return false
  const [temHardware, temCadastro] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ])
  return temHardware && temCadastro
}

export function useBiometriaDisponivel() {
  const [disponivel, setDisponivel] = useState(false)
  useEffect(() => {
    biometriaDisponivel().then(setDisponivel).catch(() => setDisponivel(false))
  }, [])
  return disponivel
}

export async function confirmarBiometria(mensagem: string): Promise<ResultadoBiometria> {
  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: mensagem,
    cancelLabel: 'Cancelar',
    disableDeviceFallback: true, // só biometria, sem PIN do celular
  })
  if (resultado.success) return 'sucesso'
  const cancelado = ['user_cancel', 'system_cancel', 'app_cancel'].includes(resultado.error)
  return cancelado ? 'cancelado' : 'falhou'
}

export interface ContaBiometria {
  email: string
  senha: string
}

export async function lerEmailBiometria() {
  if (WEB) return null
  return SecureStore.getItemAsync(CHAVE_EMAIL)
}

// RN-33: a senha fica criptografada no armazenamento seguro para entrar no Firebase com a digital
export async function lerContaBiometria(): Promise<ContaBiometria | null> {
  if (WEB) return null
  const [email, senha] = await Promise.all([
    SecureStore.getItemAsync(CHAVE_EMAIL),
    SecureStore.getItemAsync(CHAVE_SENHA),
  ])
  return email && senha ? { email, senha } : null
}

export async function salvarContaBiometria(conta: ContaBiometria | null) {
  if (WEB) return
  if (conta) {
    await SecureStore.setItemAsync(CHAVE_EMAIL, conta.email)
    await SecureStore.setItemAsync(CHAVE_SENHA, conta.senha)
  } else {
    await SecureStore.deleteItemAsync(CHAVE_EMAIL)
    await SecureStore.deleteItemAsync(CHAVE_SENHA)
  }
}
