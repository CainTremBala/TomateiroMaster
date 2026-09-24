import { BottomNav } from '@/components/bottom-nav/bottom-nav';
import { Header } from '@/components/header/header';
import colors from "@/constants/colors";
import { useApp } from '@/src/context/AppContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Perfil() {

  const { usuario, alterarSenha, logout } = useApp()

  // RN-21: fechado por padrão
  const [senhaAberta, setSenhaAberta] = useState(false)
  const [alturaConteudo, setAlturaConteudo] = useState(0)
  const animacao = useRef(new Animated.Value(0)).current

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')

  if (!usuario) return <Redirect href="/" />

  // RN-21: expansão suave e seta girando 180°
  function alternarAccordion(abrir: boolean) {
    setSenhaAberta(abrir)
    Animated.timing(animacao, {
      toValue: abrir ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start()
  }

  function salvarSenha() {
    if (!alterarSenha(senhaAtual, novaSenha, confirmacao)) return

    // RN-24
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmacao('')
    alternarAccordion(false)
  }

  // RN-04
  function sair() {
    router.replace('/')
    logout()
  }

  const altura = animacao.interpolate({ inputRange: [0, 1], outputRange: [0, alturaConteudo] })
  const rotacao = animacao.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <Header />

      <ScrollView
        style={styles.scrollview}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >

        {/* Dados do usuário (RN-20) */}
        <View style={[styles.card, styles.perfil]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{usuario.nome.charAt(0)}</Text>
            <View style={styles.online} />
          </View>

          <Text style={styles.nome}>{usuario.nome}</Text>
          <Text style={styles.email}>{usuario.email}</Text>

          <View style={styles.permissao}>
            <Text style={styles.permissaoTexto}>{usuario.permissao}</Text>
          </View>
        </View>

        {/* Accordion de alteração de senha */}
        <View style={styles.accordion}>
          <Pressable
            style={[styles.accordionHeader, senhaAberta && styles.accordionHeaderAberto]}
            onPress={() => alternarAccordion(!senhaAberta)}
          >
            <View style={styles.accordionTituloArea}>
              <FontAwesome5 name="lock" size={18} color={colors.brandGreen} />
              <Text style={styles.accordionTitulo}>ALTERAR SENHA</Text>
            </View>
            <Animated.View style={{ transform: [{ rotate: rotacao }] }}>
              <FontAwesome5 name="chevron-down" size={14} color={colors.slate} />
            </Animated.View>
          </Pressable>

          <Animated.View
            style={[styles.accordionAnimado, { height: altura, opacity: animacao }]}
            pointerEvents={senhaAberta ? 'auto' : 'none'}
          >
            {/* Absoluto para medir a altura real do conteúdo */}
            <View
              style={[styles.accordionConteudo, styles.accordionMedida]}
              onLayout={(evento) => setAlturaConteudo(evento.nativeEvent.layout.height)}
            >
              <View style={styles.campo}>
                <Text style={styles.label}>Senha Atual</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.slate}
                  secureTextEntry
                  value={senhaAtual}
                  onChangeText={setSenhaAtual}
                />
              </View>

              <View style={styles.campo}>
                <Text style={styles.label}>Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite a nova senha"
                  placeholderTextColor={colors.slate}
                  secureTextEntry
                  value={novaSenha}
                  onChangeText={setNovaSenha}
                />
              </View>

              <View style={styles.campo}>
                <Text style={styles.label}>Confirmar Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repita a nova senha"
                  placeholderTextColor={colors.slate}
                  secureTextEntry
                  value={confirmacao}
                  onChangeText={setConfirmacao}
                />
              </View>

              <Pressable style={styles.botaoSalvar} onPress={salvarSenha}>
                <Text style={styles.botaoSalvarTexto}>Salvar Nova Senha</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>

        {/* Logout (RN-04) */}
        <Pressable style={styles.botaoSair} onPress={sair}>
          <FontAwesome5 name="sign-out-alt" size={16} color={colors.brandRed} />
          <Text style={styles.botaoSairTexto}>Sair da Conta</Text>
        </Pressable>

      </ScrollView>

      <BottomNav ativa="perfil" />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brandDark,
  },
  scrollview: {
    flex: 1,
  },
  conteudo: {
    padding: 20,
    gap: 24,
  },
  card: {
    borderRadius: 18,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  perfil: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandDark,
    borderWidth: 3,
    borderColor: colors.brandGreen,
    marginBottom: 16,
  },
  avatarTexto: {
    fontSize: 44,
    fontWeight: 'bold',
    color: colors.brandGreen,
  },
  online: {
    position: 'absolute',
    right: 2,
    bottom: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.online,
    borderWidth: 3,
    borderColor: colors.cardDark,
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
  },
  email: {
    marginTop: 4,
    fontSize: 16,
    color: colors.slate,
  },
  permissao: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
  },
  permissaoTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.brandRed,
  },
  accordion: {
    borderRadius: 18,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 22,
  },
  accordionHeaderAberto: {
    backgroundColor: colors.brandDark,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray,
  },
  accordionTituloArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accordionTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: colors.gray,
  },
  accordionAnimado: {
    overflow: 'hidden',
  },
  accordionMedida: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  accordionConteudo: {
    padding: 24,
    paddingTop: 18,
    gap: 16,
  },
  campo: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 15,
    color: colors.inputText,
    backgroundColor: colors.white,
  },
  botaoSalvar: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.brandGreen,
  },
  botaoSalvarTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.brandDark,
  },
  botaoSair: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.4)',
  },
  botaoSairTexto: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.brandRed,
  },
});
