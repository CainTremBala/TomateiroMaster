import { ScrollViewTeclado } from '@/components/rolagem-teclado/rolagem-teclado';
import { BannerAnuncio } from '@/components/anuncio/banner';
import { BottomNav } from '@/components/bottom-nav/bottom-nav';
import { Fornecedores } from '@/components/fornecedores/fornecedores';
import { Header } from '@/components/header/header';
import colors from "@/constants/colors";
import { useApp } from '@/src/context/AppContext';
import { formatarKg, formatarReais } from '@/src/utils/formatar';
import { lerQuantidade } from '@/src/utils/estoque';
import { FontAwesome5 } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

type Ajuste = { produtoId: string; sentido: 1 | -1 }

export default function Estoque() {

  const {
    usuario,
    produtos,
    categorias,
    filtroCategoria,
    setFiltroCategoria,
    entradaEstoque,
    saidaEstoque,
    fazendasDoProduto,
    mostrarToast,
  } = useApp()
  const [busca, setBusca] = useState('')
  const [ajuste, setAjuste] = useState<Ajuste | null>(null)
  const [quantidadeTexto, setQuantidadeTexto] = useState('')
  const [fazendaId, setFazendaId] = useState<string | null>(null)

  // RN-04: painel só com usuário logado
  if (!usuario) return <Redirect href="/" />

  const produtoAjuste = ajuste ? produtos.find((produto) => produto.id === ajuste.produtoId) : undefined
  const fornecedoresAjuste = produtoAjuste ? fazendasDoProduto(produtoAjuste.id) : []

  // RN-07: + / - abrem o Modal para digitar a quantidade
  function abrirAjuste(produtoId: string, sentido: 1 | -1) {
    const fornecedores = fazendasDoProduto(produtoId)

    // RN-07: a entrada precisa de uma fazenda que forneça o produto
    if (sentido === 1 && fornecedores.length === 0) {
      mostrarToast('Nenhuma fazenda fornece este produto!', 'erro')
      return
    }

    setQuantidadeTexto('')
    setFazendaId(sentido === 1 ? fornecedores[0].fazenda.id : null)
    setAjuste({ produtoId, sentido })
  }

  function fecharAjuste() {
    setAjuste(null)
    setQuantidadeTexto('')
    setFazendaId(null)
  }

  // RN-07: número maior que 0, aceita casas decimais (vírgula ou ponto)
  function confirmarAjuste() {
    if (!ajuste) return
    const quantidade = lerQuantidade(quantidadeTexto)

    if (Number.isNaN(quantidade)) {
      mostrarToast('Informe uma quantidade maior que 0!', 'erro')
      return
    }

    if (ajuste.sentido === 1) {
      if (!fazendaId) return
      entradaEstoque(ajuste.produtoId, fazendaId, quantidade)
    } else {
      saidaEstoque(ajuste.produtoId, quantidade)
    }
    fecharAjuste()
  }

  // RN-11: derivados do estado, recalculados a cada mudança
  const totalKg = produtos.reduce((soma, produto) => soma + produto.quantidadeKg, 0)
  const valorEstimado = produtos.reduce((soma, produto) => soma + produto.quantidadeKg * produto.custoMedioKg, 0)

  // RN-17 / RN-18 / RN-19: busca AND chip
  const termo = busca.trim().toLowerCase()
  const produtosFiltrados = produtos.filter((produto) => {
    const passaChip = filtroCategoria === null || produto.categoriaId === filtroCategoria
    const passaBusca =
      !termo ||
      produto.nome.toLowerCase().includes(termo) ||
      produto.id.toLowerCase().includes(termo) ||
      fazendasDoProduto(produto.id).some(
        ({ fazenda }) =>
          fazenda.nome.toLowerCase().includes(termo) || fazenda.localizacao.toLowerCase().includes(termo)
      )
    return passaChip && passaBusca
  })

  const chips = [{ id: null, nome: 'Todas' }, ...categorias]

  function nomeCategoria(categoriaId: string) {
    return categorias.find((categoria) => categoria.id === categoriaId)?.nome ?? ''
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <Header />

      <ScrollViewTeclado
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
                  <Text style={styles.precoLabel}>Custo médio / kg</Text>
                  <Text style={styles.preco}>{formatarReais(produto.custoMedioKg)}</Text>
                </View>
              </View>

              {/* RN-35: fazendas que fornecem o produto e o preço de cada uma */}
              <View style={styles.fornecedores}>
                <Text style={styles.fornecedoresTitulo}>Fazendas fornecedoras</Text>
                <Fornecedores fornecedores={fazendasDoProduto(produto.id)} />
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
                  <Pressable style={styles.botaoMenos} onPress={() => abrirAjuste(produto.id, -1)}>
                    <Text style={styles.botaoMenosTexto}>-</Text>
                  </Pressable>
                  <Pressable style={styles.botaoMais} onPress={() => abrirAjuste(produto.id, 1)}>
                    <Text style={styles.botaoMaisTexto}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )
        })}

      </ScrollViewTeclado>

      {/* RN-07: Modal de ajuste por quantidade digitada */}
      <Modal
        visible={!!produtoAjuste}
        transparent
        animationType="fade"
        onRequestClose={fecharAjuste}
      >
        {/* Sobe a caixa junto com o teclado para o campo continuar visível */}
        <KeyboardAvoidingView style={styles.modalTeclado} behavior="padding">
        <Pressable style={styles.modalFundo} onPress={fecharAjuste}>
          {/* Pressable vazio: toque dentro da caixa não fecha o Modal */}
          <Pressable style={styles.modalCaixa} onPress={() => {}}>
            {produtoAjuste && ajuste && (
              <>
                <Text style={styles.modalTitulo}>
                  {ajuste.sentido === 1 ? 'Adicionar ao Estoque' : 'Remover do Estoque'}
                </Text>
                <Text style={styles.modalProduto}>{produtoAjuste.nome}</Text>
                <Text style={styles.modalAtual}>
                  Estoque atual: {formatarKg(produtoAjuste.quantidadeKg)} • Custo médio:{' '}
                  {formatarReais(produtoAjuste.custoMedioKg)}/kg
                </Text>

                {/* RN-07: a entrada usa o preço da fazenda escolhida */}
                {ajuste.sentido === 1 && (
                  <>
                    <Text style={styles.modalLabel}>Fazenda</Text>
                    <ScrollView style={styles.modalLista} nestedScrollEnabled>
                      {fornecedoresAjuste.map(({ fazenda, valorKg, foto }) => {
                        const selecionada = fazenda.id === fazendaId

                        return (
                          <Pressable
                            key={fazenda.id}
                            style={[styles.modalFazenda, selecionada && styles.modalFazendaAtiva]}
                            onPress={() => setFazendaId(fazenda.id)}
                          >
                            <View style={styles.modalFoto}>
                              {foto ? (
                                <Image source={{ uri: foto }} style={styles.modalFotoImagem} />
                              ) : (
                                <FontAwesome5 name="seedling" size={14} color={colors.slate} />
                              )}
                            </View>
                            <Text
                              style={[styles.modalFazendaNome, selecionada && styles.modalFazendaTextoAtivo]}
                              numberOfLines={1}
                            >
                              {fazenda.nome}
                            </Text>
                            <Text style={[styles.modalFazendaPreco, selecionada && styles.modalFazendaTextoAtivo]}>
                              {formatarReais(valorKg)}/kg
                            </Text>
                          </Pressable>
                        )
                      })}
                    </ScrollView>
                  </>
                )}

                <Text style={styles.modalLabel}>Quantidade (Kg)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: 25,5"
                  placeholderTextColor={colors.slate}
                  keyboardType="decimal-pad"
                  value={quantidadeTexto}
                  onChangeText={setQuantidadeTexto}
                  onSubmitEditing={confirmarAjuste}
                  autoFocus
                />

                <View style={styles.modalBotoes}>
                  <Pressable style={styles.modalCancelar} onPress={fecharAjuste}>
                    <Text style={styles.modalCancelarTexto}>Cancelar</Text>
                  </Pressable>
                  <Pressable style={styles.modalConfirmar} onPress={confirmarAjuste}>
                    <Text style={styles.modalConfirmarTexto}>Confirmar</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* RN-42: banner de teste do AdMob no rodapé do Estoque */}
      <BannerAnuncio />

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
  fornecedores: {
    gap: 8,
  },
  fornecedoresTitulo: {
    fontSize: 13,
    fontWeight: 'bold',
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
  modalTeclado: {
    flex: 1,
  },
  modalFundo: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCaixa: {
    padding: 20,
    gap: 12,
    borderRadius: 18,
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  modalProduto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.brandGreen,
  },
  modalAtual: {
    fontSize: 14,
    color: colors.slate,
  },
  modalLabel: {
    marginTop: 4,
    fontSize: 14,
    color: colors.gray,
  },
  modalLista: {
    maxHeight: 220,
  },
  modalFazenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalFazendaAtiva: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  modalFoto: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardDark,
  },
  modalFotoImagem: {
    width: '100%',
    height: '100%',
  },
  modalFazendaNome: {
    flex: 1,
    fontSize: 15,
    color: colors.gray,
  },
  modalFazendaPreco: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.brandGreen,
  },
  modalFazendaTextoAtivo: {
    color: colors.brandDark,
  },
  modalInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.inputText,
  },
  modalBotoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelarTexto: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.white,
  },
  modalConfirmar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.brandGreen,
  },
  modalConfirmarTexto: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.brandDark,
  },
});
