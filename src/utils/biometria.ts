import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// RN-33: conta com biometria ativada fica salva no armazenamento seguro do celular
const CHAVE_EMAIL = 'biometria_email'
const WEB = Platform.OS === 'web'

export type ResultadoBiometria = 'sucesso' | 'cancelado' | 'falhou'

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

export async function lerEmailBiometria() {
  if (WEB) return null
  return SecureStore.getItemAsync(CHAVE_EMAIL)
}

export async function salvarEmailBiometria(email: string | null) {
  if (WEB) return
  if (email) await SecureStore.setItemAsync(CHAVE_EMAIL, email)
  else await SecureStore.deleteItemAsync(CHAVE_EMAIL)
}
