import { ScrollViewTeclado } from '@/components/rolagem-teclado/rolagem-teclado';
import { BottomNav } from '@/components/bottom-nav/bottom-nav';
import { FazendaForm } from '@/components/fazenda-form/fazenda-form';
import { Header } from '@/components/header/header';
import colors from "@/constants/colors";
import { useApp } from '@/src/context/AppContext';
import { abrirNoMaps } from '@/src/utils/mapa';
import { FontAwesome5 } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

// RN-35: tela da fazenda — edita nome, localização, mapa, produtos fornecidos, preços e fotos
export default function TelaFazenda() {

  const { usuario, fazendas, salvarFazenda } = useApp()
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!usuario) return <Redirect href="/" />

  const fazenda = fazendas.find((item) => item.id === id)

  function voltar() {
    if (router.canGoBack()) router.back()
    else router.replace('/cadastrados/page')
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <Header />

      <ScrollViewTeclado
        style={styles.scrollview}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >

        <Pressable style={styles.voltar} onPress={voltar}>
          <FontAwesome5 name="arrow-left" size={14} color={colors.brandGreen} />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </Pressable>

        {!fazenda ? (
          <View style={styles.card}>
            <Text style={styles.naoEncontrado}>Fazenda não encontrada.</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.topo}>
                <View style={styles.idTag}>
                  <Text style={styles.idTagTexto}>{fazenda.id}</Text>
                </View>
                <Text style={styles.sub}>{fazenda.produtos.length} produto(s) fornecido(s)</Text>
              </View>
              <Text style={styles.nome}>{fazenda.nome}</Text>

              {/* RN-31: abre o ponto salvo no app de mapas */}
              <Pressable style={styles.botaoMaps} onPress={() => abrirNoMaps(fazenda.coordenada)}>
                <FontAwesome5 name="directions" size={15} color={colors.brandDark} />
                <Text style={styles.botaoMapsTexto}>Abrir no Maps</Text>
              </Pressable>
            </View>

            <FazendaForm
              key={fazenda.id}
              titulo="Editar Fazenda"
              textoBotao="SALVAR ALTERAÇÕES"
              inicial={fazenda}
              onSalvar={(dados) => salvarFazenda(dados, fazenda.id)}
            />
          </>
        )}

      </ScrollViewTeclado>

      <BottomNav ativa="cadastrados" />

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
    gap: 16,
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 6,
  },
  voltarTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.brandGreen,
  },
  card: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  naoEncontrado: {
    fontSize: 16,
    color: colors.slate,
    textAlign: 'center',
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  idTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  idTagTexto: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.brandGreen,
  },
  sub: {
    fontSize: 14,
    color: colors.slate,
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
  },
  botaoMaps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.brandGreen,
  },
  botaoMapsTexto: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.brandDark,
  },
});
