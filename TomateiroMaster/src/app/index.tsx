import { ScrollViewTeclado } from '@/components/rolagem-teclado/rolagem-teclado';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import colors from "@/constants/colors";
import { useApp } from '@/src/context/AppContext';
import { useBiometriaDisponivel } from '@/src/utils/biometria';
import { EMAIL_VALIDO } from '@/src/utils/validacao';
import { FontAwesome5 } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type Aba = 'entrar' | 'criar'

const abas: { aba: Aba; label: string }[] = [
  { aba: 'entrar', label: 'Entrar' },
  { aba: 'criar', label: 'Criar Conta' },
]

export default function Login() {

  const { usuario, login, cadastrarUsuario, mostrarToast, emailBiometria, entrarComBiometria } = useApp()
  const biometriaDisponivel = useBiometriaDisponivel()
  const [abaAtiva, setAbaAtiva] = useState<Aba>('entrar')

  // RN-34: sessão salva no banco local → abre direto no Estoque
  const [sessaoSalva] = useState(usuario !== null)

  // Aba Entrar
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  // Aba Criar Conta
  const [novoEmail, setNovoEmail] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')

  // Evita tocar duas vezes enquanto o Firebase responde
  const [aguardando, setAguardando] = useState(false)
  async function aguardar<T>(tarefa: () => Promise<T>) {
    setAguardando(true)
    try {
      return await tarefa()
    } finally {
      setAguardando(false)
    }
  }

  // RN-28: após criar, volta para Entrar com o e-mail preenchido
  async function handleCriarConta() {
    if (aguardando) return
    if (!(await aguardar(() => cadastrarUsuario(novoEmail, novoNome, novaSenha, confirmacao)))) return

    setEmail(novoEmail.trim())
    setSenha('')
    setNovoEmail('')
    setNovoNome('')
    setNovaSenha('')
    setConfirmacao('')
    setAbaAtiva('entrar')
  }

  async function handleLogin() {
    if (aguardando) return
    const emailDigitado = email.trim()

    if (!EMAIL_VALIDO.test(emailDigitado)) {
      mostrarToast('Informe um e-mail válido!', 'erro')
      return
    }
    if (!senha.trim()) {
      mostrarToast('Informe a sua senha!', 'erro')
      return
    }

    if (await aguardar(() => login(emailDigitado, senha))) {
      router.replace('/estoque/page')
    }
  }

  // RN-33
  async function handleBiometria() {
    if (aguardando) return
    if (await aguardar(entrarComBiometria)) {
      router.replace('/estoque/page')
    }
  }

  if (sessaoSalva) return <Redirect href="/estoque/page" />

  return (
    <View style={styles.tela}>

      <ScrollViewTeclado style={styles.scrollview}>
        <View style={styles.container}>

          <View style={styles.header}>

            <View style={styles.img_view}>
              <Image
                source={require('@/assets/images/Tomateiros/Tomateiro001.png')}
                style={styles.imagem}
              />
            </View>

            <Text style={styles.slogan}>
              O Melhor App de gestão de <Text style={styles.subSlogan}>Tomate</Text> do meu bairro!!
            </Text>

          </View>


          <View style={styles.form}>

            {/* Barra Entrar | Criar Conta */}
            <View style={styles.abas}>
              {abas.map((item) => {
                const ativa = item.aba === abaAtiva

                return (
                  <Pressable
                    key={item.aba}
                    style={[styles.aba, ativa && styles.abaAtiva]}
                    onPress={() => setAbaAtiva(item.aba)}
                  >
                    <Text style={[styles.abaTexto, ativa && styles.abaTextoAtivo]}>
                      {item.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {abaAtiva === 'entrar' && (
              <>
                <Input
                  label="Email"
                  placeholder="Digite seu email aqui..."
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Input
                  label="Senha"
                  placeholder="Digite sua senha aqui..."
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry
                />

                <Button label={aguardando ? "Aguarde..." : "Entrar"} onPress={handleLogin} />

                {/* RN-33: só aparece com biometria no aparelho e ativada no Perfil */}
                {biometriaDisponivel && emailBiometria && (
                  <Pressable style={styles.botaoBiometria} onPress={handleBiometria}>
                    <FontAwesome5 name="fingerprint" size={22} color={colors.brandGreen} />
                    <View>
                      <Text style={styles.botaoBiometriaTexto}>Entrar com biometria</Text>
                      <Text style={styles.botaoBiometriaEmail}>{emailBiometria}</Text>
                    </View>
                  </Pressable>
                )}
              </>
            )}

            {abaAtiva === 'criar' && (
              <>
                <Input
                  label="Email"
                  placeholder="maria@fazendatomate.com"
                  value={novoEmail}
                  onChangeText={setNovoEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Input
                  label="Nome Completo"
                  placeholder="Ex: Maria da Silva"
                  value={novoNome}
                  onChangeText={setNovoNome}
                  autoCapitalize="words"
                />

                <Input
                  label="Senha"
                  placeholder="Mínimo 4 caracteres"
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                  secureTextEntry
                />

                <Input
                  label="Confirmar Senha"
                  placeholder="Repita a senha"
                  value={confirmacao}
                  onChangeText={setConfirmacao}
                  secureTextEntry
                />

                <Button label={aguardando ? "AGUARDE..." : "CRIAR CONTA"} onPress={handleCriarConta} />
              </>
            )}

          </View>



        </View>
      </ScrollViewTeclado>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: colors.zinc,
  },
  scrollview: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
  },
  header: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
  },
  img_view: {
    padding: 10,
    borderRadius: 150,
    backgroundColor: colors.zinc2,
    alignSelf: 'flex-start',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  imagem: {
    width: 300,
    height: 300,
    marginLeft: -20,
  },
  slogan: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  subSlogan: {
    fontSize: 30,
    color: colors.red,
  },
  form: {
    paddingHorizontal: 25,
    paddingBottom: 30,
    flex: 1,
    marginTop: 20,
    width: '100%'
  },
  abas: {
    flexDirection: 'row',
    padding: 6,
    gap: 4,
    marginBottom: 24,
    borderRadius: 14,
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aba: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  abaAtiva: {
    backgroundColor: colors.brandGreen,
  },
  abaTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.slate,
  },
  abaTextoAtivo: {
    color: colors.brandDark,
  },
  botaoBiometria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brandGreen,
    backgroundColor: colors.brandDark2,
  },
  botaoBiometriaTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.brandGreen,
  },
  botaoBiometriaEmail: {
    fontSize: 12,
    color: colors.slate,
  },
});
