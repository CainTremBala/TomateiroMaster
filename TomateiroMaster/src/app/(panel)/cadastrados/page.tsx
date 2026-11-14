import { BottomNav } from '@/components/bottom-nav/bottom-nav';
import { Header } from '@/components/header/header';
import colors from "@/constants/colors";
import { useApp } from '@/src/context/AppContext';
import { formatarKg } from '@/src/utils/formatar';
import { FontAwesome5 } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

type SubAba = 'categoria' | 'produto' | 'fazenda'

// Mesma ordem da tela Adicionar: Categoria → Produto → Fazenda (RN-39)
const subAbas: { aba: SubAba; label: string; icone: string }[] = [
  { aba: 'categoria', label: 'Categoria', icone: 'tags' },
  { aba: 'produto', label: 'Produto', icone: 'box' },
  { aba: 'fazenda', label: 'Fazenda', icone: 'tractor' },
]

interface ItemLista {
  id: string
  titulo: string
  sub: string
  onPress?: () => void // RN-30 / RN-35: produto abre detalhes, fazenda abre a Tela da Fazenda
  onExcluir: () => void
}

// RN-39: tela "Cadastrados" — lista única por sub-aba, com lixeira (RN-16)
export default function Cadastrados() {

  const {
    usuario,
    produtos,
    categorias,
    fazendas,
    excluirProduto,
    excluirCategoria,
    excluirFazenda,
    fazendasDoProduto,
  } = useApp()

  const [abaAtiva, setAbaAtiva] = useState<SubAba>('categoria')

  if (!usuario) return <Redirect href="/" />

  function nomeCategoria(id: string) {
    return categorias.find((categoria) => categoria.id === id)?.nome ?? ''
  }

  const listas: Record<SubAba, { titulo: string; vazio: string; itens: ItemLista[] }> = {
    categoria: {
      titulo: 'CATEGORIAS CADASTRADAS',
      vazio: 'Nenhuma categoria cadastrada.',
      itens: categorias.map((categoria) => ({
        id: categoria.id,
        titulo: categoria.nome,
        sub: `${produtos.filter((produto) => produto.categoriaId === categoria.id).length} produto(s) nesta categoria`,
        onExcluir: () => excluirCategoria(categoria.id),
      })),
    },
    produto: {
      titulo: 'PRODUTOS CADASTRADOS',
      vazio: 'Nenhum produto cadastrado.',
      itens: produtos.map((produto) => ({
        id: produto.id,
        titulo: produto.nome,
        sub: `${nomeCategoria(produto.categoriaId)} • ${formatarKg(produto.quantidadeKg)} • ${fazendasDoProduto(produto.id).length} fazenda(s)`,
        onPress: () => router.push({ pathname: '/produto/[id]', params: { id: produto.id } }),
        onExcluir: () => excluirProduto(produto.id),
      })),
    },
    fazenda: {
      titulo: 'FAZENDAS CADASTRADAS',
      vazio: 'Nenhuma fazenda cadastrada.',
      itens: fazendas.map((fazenda) => ({
        id: fazenda.id,
        titulo: fazenda.nome,
        sub: `${fazenda.produtos.length} produto(s) fornecido(s)`,
        onPress: () => router.push({ pathname: '/fazenda/[id]', params: { id: fazenda.id } }),
        onExcluir: () => excluirFazenda(fazenda.id),
      })),
    },
  }

  const lista = listas[abaAtiva]

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <Header />

      <ScrollView style={styles.scrollview} contentContainerStyle={styles.conteudo}>

        {/* Sub-abas */}
        <View style={styles.abas}>
          {subAbas.map((item) => {
            const ativa = item.aba === abaAtiva
            const cor = ativa ? colors.brandDark : colors.slate

            return (
              <Pressable
                key={item.aba}
                style={[styles.aba, ativa && styles.abaAtiva]}
                onPress={() => setAbaAtiva(item.aba)}
              >
                <FontAwesome5 name={item.icone} size={13} color={cor} />
                <Text style={[styles.abaTexto, { color: cor }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.secaoHeader}>
            <Text style={styles.secaoTitulo}>{lista.titulo}</Text>
            <View style={styles.contador}>
              <Text style={styles.contadorTexto}>{lista.itens.length}</Text>
            </View>
          </View>

          {lista.itens.length === 0 && <Text style={styles.vazio}>{lista.vazio}</Text>}

          <View style={styles.lista}>
            {lista.itens.map((item) => (
              <View key={item.id} style={styles.item}>
                <Pressable
                  style={styles.itemInfo}
                  disabled={!item.onPress}
                  onPress={item.onPress}
                >
                  <View style={styles.itemTituloLinha}>
                    <Text style={styles.itemTitulo}>{item.titulo}</Text>
                    <Text style={styles.itemCodigo}>({item.id})</Text>
                  </View>
                  <Text style={styles.itemSub}>{item.sub}</Text>
                  {item.onPress && (
                    <View style={styles.abrir}>
                      <Text style={styles.abrirTexto}>Ver detalhes</Text>
                      <FontAwesome5 name="chevron-right" size={10} color={colors.brandGreen} />
                    </View>
                  )}
                </Pressable>

                <Pressable style={styles.lixeira} onPress={item.onExcluir}>
                  <FontAwesome5 name="trash-alt" size={16} color={colors.brandRed} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

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
    gap: 20,
  },
  abas: {
    flexDirection: 'row',
    padding: 6,
    gap: 4,
    borderRadius: 14,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aba: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  abaAtiva: {
    backgroundColor: colors.brandGreen,
  },
  abaTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  card: {
    padding: 22,
    borderRadius: 18,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: colors.slate,
  },
  contador: {
    minWidth: 32,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  contadorTexto: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.gray,
  },
  vazio: {
    fontSize: 14,
    color: colors.slate,
  },
  lista: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTituloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  itemTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  itemCodigo: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.brandRed,
  },
  itemSub: {
    fontSize: 14,
    color: colors.slate,
  },
  abrir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  abrirTexto: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.brandGreen,
  },
  lixeira: {
    width: 48,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
  },
});
