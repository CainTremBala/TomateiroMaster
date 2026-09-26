import { BottomNav } from '@/components/bottom-nav/bottom-nav';
import { Header } from '@/components/header/header';
import { MapaFazenda } from '@/components/mapa/mapa';
import colors from "@/constants/colors";
import { useApp } from '@/src/context/AppContext';
import { Produto } from '@/src/types';
import { formatarKg, formatarReais } from '@/src/utils/formatar';
import { abrirNoMaps } from '@/src/utils/mapa';
import { FontAwesome5 } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

// RN-30: detalhes do produto (somente visualização)
export default function DetalhesProduto() {

  const { usuario, produtos, categorias } = useApp()
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!usuario) return <Redirect href="/" />

  const produto = produtos.find((item) => item.id === id)

  function voltar() {
    if (router.canGoBack()) router.back()
    else router.replace('/adicionar/page')
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <Header />

      <ScrollView style={styles.scrollview} contentContainerStyle={styles.conteudo}>

        <Pressable style={styles.voltar} onPress={voltar}>
          <FontAwesome5 name="arrow-left" size={14} color={colors.brandGreen} />
          <Text style={styles.voltarTexto}>Voltar</Text>
        </Pressable>

        {!produto ? (
          <View style={styles.card}>
            <Text style={styles.naoEncontrado}>Produto não encontrado.</Text>
          </View>
        ) : (
          <DadosProduto
            produto={produto}
            nomeCategoria={categorias.find((categoria) => categoria.id === produto.categoriaId)?.nome ?? ''}
          />
        )}

      </ScrollView>

      <BottomNav ativa="adicionar" />

    </SafeAreaView>
  );
}

function DadosProduto({ produto, nomeCategoria }: { produto: Produto, nomeCategoria: string }) {
  const baixo = produto.quantidadeKg < 100 // RN-09
  const valorTotal = produto.quantidadeKg * produto.valorKg

  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <View style={styles.idTag}>
          <Text style={styles.idTagTexto}>{produto.id}</Text>
        </View>
        <Text style={styles.categoriaTopo}>{nomeCategoria}</Text>
      </View>

      <Text style={styles.nome}>{produto.nome}</Text>

      <View style={styles.linhas}>
        <Linha icone="tags" label="Categoria" valor={nomeCategoria} />
        <Linha icone="dollar-sign" label="Valor Unitário" valor={`${formatarReais(produto.valorKg)} / kg`} />
        <Linha icone="map-marker-alt" corIcone={colors.brandRed} label="Localização da Fazenda" valor={produto.fazenda} />

        {/* RN-31: mapa com o ponto da fazenda */}
        <View style={styles.mapaArea}>
          <MapaFazenda coordenada={produto.coordenada} />
          <Pressable style={styles.botaoMaps} onPress={() => abrirNoMaps(produto.coordenada)}>
            <FontAwesome5 name="directions" size={15} color={colors.brandDark} />
            <Text style={styles.botaoMapsTexto}>Abrir no Maps</Text>
          </Pressable>
        </View>

        <View style={styles.linha}>
          <View style={styles.linhaLabelArea}>
            <FontAwesome5 name="boxes" size={14} color={colors.brandGreen} />
            <Text style={styles.linhaLabel}>Quantidade em Estoque</Text>
          </View>
          <View style={styles.estoqueArea}>
            <Text style={[styles.linhaValor, baixo && { color: colors.yellow }]}>
              {formatarKg(produto.quantidadeKg)}
            </Text>
            {baixo && (
              <View style={styles.badgeBaixo}>
                <Text style={styles.badgeBaixoTexto}>Baixo</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.total}>
        <Text style={styles.totalLabel}>Valor Total em Estoque</Text>
        <Text style={styles.totalValor}>{formatarReais(valorTotal)}</Text>
      </View>
    </View>
  )
}

function Linha({ icone, corIcone = colors.brandGreen, label, valor }: {
  icone: string
  corIcone?: string
  label: string
  valor: string
}) {
  return (
    <View style={styles.linha}>
      <View style={styles.linhaLabelArea}>
        <FontAwesome5 name={icone} size={14} color={corIcone} />
        <Text style={styles.linhaLabel}>{label}</Text>
      </View>
      <Text style={styles.linhaValor}>{valor}</Text>
    </View>
  )
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
    gap: 16,
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
  categoriaTopo: {
    fontSize: 14,
    color: colors.slate,
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
  },
  linhas: {
    gap: 4,
  },
  linha: {
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  linhaLabelArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linhaLabel: {
    fontSize: 14,
    color: colors.slate,
  },
  linhaValor: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.white,
  },
  mapaArea: {
    gap: 10,
    paddingBottom: 12,
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
  estoqueArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeBaixo: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.yellow,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  badgeBaixoTexto: {
    fontSize: 12,
    color: colors.yellow,
  },
  total: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.gray,
  },
  totalValor: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.brandGreen,
  },
});
