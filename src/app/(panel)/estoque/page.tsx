import { BottomNav } from '@/components/bottom-nav/bottom-nav';
import { Header } from '@/components/header/header';
import colors from "@/constants/colors";
import { useApp } from '@/src/context/AppContext';
import { formatarKg, formatarReais } from '@/src/utils/formatar';
import { FontAwesome5 } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Estoque() {

  const { usuario, produtos, categorias, filtroCategoria, setFiltroCategoria, ajustarEstoque } = useApp()
  const [busca, setBusca] = useState('')

  // RN-04: painel só com usuário logado
  if (!usuario) return <Redirect href="/" />

  // RN-11: derivados do estado, recalculados a cada mudança
  const totalKg = produtos.reduce((soma, produto) => soma + produto.quantidadeKg, 0)
  const valorEstimado = produtos.reduce((soma, produto) => soma + produto.quantidadeKg * produto.valorKg, 0)

  // RN-17 / RN-18 / RN-19: busca AND chip
  const termo = busca.trim().toLowerCase()
  const produtosFiltrados = produtos.filter((produto) => {
    const passaChip = filtroCategoria === null || produto.categoriaId === filtroCategoria
    const passaBusca =
      !termo ||
      produto.nome.toLowerCase().includes(termo) ||
      produto.fazenda.toLowerCase().includes(termo) ||
      produto.id.toLowerCase().includes(termo)
    return passaChip && passaBusca
  })

  const chips = [{ id: null, nome: 'Todas' }, ...categorias]

  function nomeCategoria(categoriaId: string) {
    return categorias.find((categoria) => categoria.id === categoriaId)?.nome ?? ''
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <Header />

      <ScrollView
        style={styles.scrollview}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >

        {/* Resumo (RN-11) */}
        <View style={styles.resumo}>
          <View style={styles.resumoCard}>
            <Text style={styles.resumoLabel}>Total em Estoque</Text>
            <View style={styles.resumoLinha}>
              <Text style={[styles.resumoValor, { color: colors.brandGreen }]}>{formatarKg(totalKg)}</Text>
              <FontAwesome5 name="boxes" size={16} color={colors.slate} />
            </View>
          </View>

          <View style={styles.resumoCard}>
            <Text style={styles.resumoLabel}>Valor Estimado</Text>
            <View style={styles.resumoLinha}>
              <Text style={styles.resumoValor}>{formatarReais(valorEstimado)}</Text>
            </View>
          </View>
        </View>

        {/* Busca (RN-17) */}
        <View style={styles.busca}>
          <FontAwesome5 name="search" size={16} color={colors.slate} />
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar produto ou fazenda..."
            placeholderTextColor={colors.slate}
            value={busca}
            onChangeText={setBusca}
            autoCorrect={false}
          />
        </View>

        {/* Chips de categoria (RN-18) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {chips.map((chip) => {
            const ativo = chip.id === filtroCategoria

            return (
              <Pressable
                key={chip.id ?? 'todas'}
                style={[styles.chip, ativo && styles.chipAtivo]}
                onPress={() => setFiltroCategoria(chip.id)}
              >
                <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                  {chip.nome}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {/* Lista de produtos */}
        <View style={styles.listaHeader}>
          <Text style={styles.listaTitulo}>PRODUTOS EM ESTOQUE</Text>
          <Text style={styles.listaQtd}>{produtosFiltrados.length} itens</Text>
        </View>

        {produtosFiltrados.map((produto) => {
          const baixo = produto.quantidadeKg < 100 // RN-09

          return (
            <View key={produto.id} style={styles.card}>
              <View style={styles.cardTopo}>
                <View style={styles.cardInfo}>
                  <View style={styles.cardTags}>
                    <View style={styles.idTag}>
                      <Text style={styles.idTagTexto}>{produto.id}</Text>
                    </View>
                    <Text style={styles.categoria}>{nomeCategoria(produto.categoriaId)}</Text>
                  </View>
                  <Text style={styles.nome}>{produto.nome}</Text>
                </View>

                <View style={styles.precoArea}>
                  <Text style={styles.precoLabel}>Preço / kg</Text>
                  <Text style={styles.preco}>{formatarReais(produto.valorKg)}</Text>
                </View>
              </View>

              <View style={styles.fazenda}>
                <FontAwesome5 name="map-marker-alt" size={13} color={colors.brandRed} />
                <Text style={styles.fazendaTexto}>{produto.fazenda}</Text>
              </View>

              <View style={styles.cardRodape}>
                <View style={styles.estoqueArea}>
                  <Text style={styles.estoqueLabel}>Estoque:</Text>
                  <Text style={[styles.estoqueValor, baixo && { color: colors.yellow }]}>
                    {formatarKg(produto.quantidadeKg)}
                  </Text>
                  {baixo && (
                    <View style={styles.badgeBaixo}>
                      <Text style={styles.badgeBaixoTexto}>Baixo</Text>
                    </View>
                  )}
                </View>

                {/* RN-07 / RN-10: somente + e - na tela de estoque */}
                <View style={styles.botoes}>
                  <Pressable style={styles.botaoMenos} onPress={() => ajustarEstoque(produto.id, -1)}>
                    <Text style={styles.botaoMenosTexto}>-</Text>
                  </Pressable>
                  <Pressable style={styles.botaoMais} onPress={() => ajustarEstoque(produto.id, 1)}>
                    <Text style={styles.botaoMaisTexto}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )
        })}

      </ScrollView>

      <BottomNav ativa="estoque" />

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
  resumo: {
    flexDirection: 'row',
    gap: 16,
  },
  resumoCard: {
    flex: 1,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  resumoLabel: {
    fontSize: 14,
    color: colors.gray,
  },
  resumoLinha: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  resumoValor: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
  },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buscaInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.white,
  },
  chips: {
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  chipTexto: {
    fontSize: 15,
    color: colors.gray,
  },
  chipTextoAtivo: {
    color: colors.brandDark,
    fontWeight: 'bold',
  },
  listaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  listaTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: colors.slate,
  },
  listaQtd: {
    fontSize: 15,
    color: colors.slate,
  },
  card: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  cardTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardInfo: {
    flex: 1,
    gap: 10,
  },
  cardTags: {
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
  categoria: {
    fontSize: 14,
    color: colors.slate,
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  precoArea: {
    alignItems: 'flex-end',
  },
  precoLabel: {
    fontSize: 15,
    color: colors.slate,
  },
  preco: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.brandGreen,
  },
  fazenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fazendaTexto: {
    fontSize: 15,
    color: colors.slate,
  },
  cardRodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  estoqueArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  estoqueLabel: {
    fontSize: 15,
    color: colors.gray,
  },
  estoqueValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
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
  botoes: {
    flexDirection: 'row',
    gap: 10,
  },
  botaoMenos: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  botaoMenosTexto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  botaoMais: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandGreen,
  },
  botaoMaisTexto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.brandDark,
  },
});
