import { BottomNav } from '@/components/bottom-nav/bottom-nav';
import { Header } from '@/components/header/header';
import { MapaFazenda } from '@/components/mapa/mapa';
import colors from "@/constants/colors";
import { useApp } from '@/src/context/AppContext';
import { Coordenada } from '@/src/types';
import { formatarKg, mascararReais, valorDaMascara } from '@/src/utils/formatar';
import { buscarEndereco } from '@/src/utils/mapa';
import { FontAwesome5 } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

// RN-05: quantidade inteira >= 0 (o valor usa a máscara de moeda)
const INTEIRO = /^\d+$/

type SubAba = 'produto' | 'categoria'

// RN-32
type BuscaEndereco = 'ociosa' | 'buscando' | 'encontrado' | 'nao-encontrado'
const ESPERA_BUSCA = 1000

function dicaDoMapa(busca: BuscaEndereco, temPonto: boolean) {
  if (busca === 'buscando') return 'Buscando endereço no mapa...'
  if (busca === 'nao-encontrado') return 'Endereço não encontrado. Toque no mapa para marcar manualmente.'
  if (temPonto) return 'Ponto marcado. Toque em outro lugar ou arraste o marcador para ajustar.'
  return 'Digite a localização acima ou toque no mapa para marcar a fazenda.'
}

const subAbas: { aba: SubAba; label: string; icone: string }[] = [
  { aba: 'produto', label: 'Produto', icone: 'plus-circle' },
  { aba: 'categoria', label: 'Categoria', icone: 'tags' },
]

export default function Adicionar() {

  const {
    usuario,
    produtos,
    categorias,
    mostrarToast,
    adicionarProduto,
    adicionarCategoria,
    excluirProduto,
    excluirCategoria,
  } = useApp()

  const [abaAtiva, setAbaAtiva] = useState<SubAba>('produto')

  // Formulário de produto
  const [nome, setNome] = useState('')
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [valor, setValor] = useState('')
  const [fazenda, setFazenda] = useState('')
  const [coordenada, setCoordenada] = useState<Coordenada | null>(null)
  const [quantidade, setQuantidade] = useState('')
  const [selectAberto, setSelectAberto] = useState(false)

  // RN-32: situação da busca automática do endereço
  const [buscaEndereco, setBuscaEndereco] = useState<BuscaEndereco>('ociosa')

  // Formulário de categoria
  const [categoriaNome, setCategoriaNome] = useState('')

  // RN-32: 1s depois de parar de digitar, busca o endereço e marca no mapa
  useEffect(() => {
    const texto = fazenda.trim()
    if (texto.length < 3) {
      setBuscaEndereco('ociosa')
      return
    }

    const controle = new AbortController()
    const timer = setTimeout(async () => {
      setBuscaEndereco('buscando')
      try {
        const encontrado = await buscarEndereco(texto, controle.signal)
        if (encontrado) setCoordenada(encontrado)
        setBuscaEndereco(encontrado ? 'encontrado' : 'nao-encontrado')
      } catch {
        if (!controle.signal.aborted) setBuscaEndereco('nao-encontrado')
      }
    }, ESPERA_BUSCA)

    return () => {
      clearTimeout(timer)
      controle.abort()
    }
  }, [fazenda])

  if (!usuario) return <Redirect href="/" />

  const categoriaSelecionada = categorias.find((categoria) => categoria.id === categoriaId)

  function nomeCategoria(id: string) {
    return categorias.find((categoria) => categoria.id === id)?.nome ?? ''
  }

  function totalProdutos(id: string) {
    return produtos.filter((produto) => produto.categoriaId === id).length
  }

  // RN-05 (ID gerado automaticamente no contexto)
  function salvarProduto() {
    if (nome.trim().length < 3) {
      mostrarToast('O nome do produto deve ter no mínimo 3 caracteres!', 'erro')
      return
    }
    if (!categoriaSelecionada) {
      mostrarToast('Selecione uma categoria!', 'erro')
      return
    }
    const valorKg = valorDaMascara(valor)
    if (valorKg <= 0) {
      mostrarToast('Informe um valor unitário positivo!', 'erro')
      return
    }
    if (!fazenda.trim()) {
      mostrarToast('Informe a localização da fazenda!', 'erro')
      return
    }
    // RN-31
    if (!coordenada) {
      mostrarToast('Marque a localização da fazenda no mapa!', 'erro')
      return
    }
    if (!INTEIRO.test(quantidade.trim())) {
      mostrarToast('Informe uma quantidade inteira igual ou maior que 0!', 'erro')
      return
    }

    adicionarProduto({
      nome: nome.trim(),
      categoriaId: categoriaSelecionada.id,
      valorKg,
      fazenda: fazenda.trim(),
      coordenada,
      quantidadeKg: Number(quantidade.trim()),
    })

    setNome('')
    setCategoriaId(null)
    setValor('')
    setFazenda('')
    setCoordenada(null)
    setQuantidade('')
  }

  // RN-12 / RN-13 (ID gerado automaticamente no contexto)
  function salvarCategoria() {
    if (adicionarCategoria(categoriaNome)) {
      setCategoriaNome('')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      <Header />

      <ScrollView
        style={styles.scrollview}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >

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

        {abaAtiva === 'produto' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Cadastrar Novo Produto</Text>

              <View style={styles.campo}>
                <Text style={styles.label}>Nome do Produto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Tomate Italiano Selecionado"
                  placeholderTextColor={colors.slate}
                  value={nome}
                  onChangeText={setNome}
                />
              </View>

              <View style={styles.linha}>
                <View style={[styles.campo, styles.metade]}>
                  <Text style={styles.label}>Categoria</Text>
                  <Pressable style={[styles.input, styles.select]} onPress={() => setSelectAberto(true)}>
                    <Text
                      style={[styles.selectTexto, !categoriaSelecionada && { color: colors.slate }]}
                      numberOfLines={1}
                    >
                      {categoriaSelecionada?.nome ?? 'Selecione...'}
                    </Text>
                    <FontAwesome5 name="chevron-down" size={14} color={colors.inputText} />
                  </Pressable>
                </View>

                <View style={[styles.campo, styles.metade]}>
                  <Text style={styles.label}>Valor Unit. (R$/kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="R$ 0,00"
                    placeholderTextColor={colors.slate}
                    keyboardType="number-pad"
                    value={valor}
                    onChangeText={(texto) => setValor(mascararReais(texto))}
                  />
                </View>
              </View>

              <View style={styles.campo}>
                <Text style={styles.label}>Localização da Fazenda</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Fazenda Santa Luzia - Lote 3"
                  placeholderTextColor={colors.slate}
                  value={fazenda}
                  onChangeText={setFazenda}
                />
              </View>

              {/* RN-31: ponto da fazenda marcado no mapa */}
              <View style={styles.campo}>
                <Text style={styles.label}>Marque a Fazenda no Mapa</Text>
                <MapaFazenda coordenada={coordenada} onSelecionar={setCoordenada} altura={220} />
                <Text style={[styles.dicaMapa, buscaEndereco === 'nao-encontrado' && styles.dicaMapaAviso]}>
                  {dicaDoMapa(buscaEndereco, !!coordenada)}
                </Text>
              </View>

              <View style={styles.campo}>
                <Text style={styles.label}>Quantidade Inicial (Kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="150"
                  placeholderTextColor={colors.slate}
                  keyboardType="number-pad"
                  value={quantidade}
                  onChangeText={setQuantidade}
                />
              </View>

              <Pressable style={styles.botao} onPress={salvarProduto}>
                <Text style={styles.botaoTexto}>ADICIONAR AO ESTOQUE</Text>
              </Pressable>
            </View>

            {/* RN-30: toque no produto abre a tela de detalhes */}
            <ItensCadastrados
              titulo="PRODUTOS CADASTRADOS"
              itens={produtos}
              onPressItem={(id) => router.push({ pathname: '/produto/[id]', params: { id } })}
            />

            <View style={styles.card}>
              <Text style={styles.secaoTitulo}>EXCLUIR PRODUTOS</Text>

              <ScrollView style={styles.listaRolavel} nestedScrollEnabled>
                <View style={styles.lista}>
                  {produtos.map((produto) => (
                    <View key={produto.id} style={styles.item}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitulo}>{produto.nome}</Text>
                        <Text style={styles.itemSub}>
                          {nomeCategoria(produto.categoriaId)} • {formatarKg(produto.quantidadeKg)}
                        </Text>
                      </View>
                      <BotaoLixeira onPress={() => excluirProduto(produto.id)} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Select de categoria */}
            <Modal
              visible={selectAberto}
              transparent
              animationType="fade"
              onRequestClose={() => setSelectAberto(false)}
            >
              <Pressable style={styles.modalFundo} onPress={() => setSelectAberto(false)}>
                {/* Pressable vazio: toque dentro da caixa não fecha o select */}
                <Pressable style={styles.modalCaixa} onPress={() => {}}>
                  <Text style={styles.modalTitulo}>Selecione a Categoria</Text>
                  <ScrollView style={styles.listaRolavel}>
                    {categorias.map((categoria) => {
                      const selecionada = categoria.id === categoriaId

                      return (
                        <Pressable
                          key={categoria.id}
                          style={[styles.modalOpcao, selecionada && styles.modalOpcaoAtiva]}
                          onPress={() => {
                            setCategoriaId(categoria.id)
                            setSelectAberto(false)
                          }}
                        >
                          <Text style={[styles.modalOpcaoTexto, selecionada && styles.modalOpcaoTextoAtivo]}>
                            {categoria.nome}
                          </Text>
                          {selecionada && (
                            <FontAwesome5 name="check" size={14} color={colors.brandDark} />
                          )}
                        </Pressable>
                      )
                    })}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </Modal>
          </>
        )}

        {abaAtiva === 'categoria' && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>Cadastrar Nova Categoria</Text>

              <View style={styles.campo}>
                <Text style={styles.label}>Nome da Categoria</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Tomates para Molho"
                  placeholderTextColor={colors.slate}
                  value={categoriaNome}
                  onChangeText={setCategoriaNome}
                />
              </View>

              <Pressable style={styles.botao} onPress={salvarCategoria}>
                <Text style={styles.botaoTexto}>SALVAR CATEGORIA</Text>
              </Pressable>
            </View>

            <ItensCadastrados titulo="CATEGORIAS CADASTRADAS" itens={categorias} />

            <View style={styles.card}>
              <Text style={styles.secaoTitulo}>EXCLUIR CATEGORIAS</Text>

              <ScrollView style={styles.listaRolavel} nestedScrollEnabled>
                <View style={styles.lista}>
                  {categorias.map((categoria) => (
                    <View key={categoria.id} style={styles.item}>
                      <View style={styles.itemInfo}>
                        <View style={styles.itemTituloLinha}>
                          <Text style={styles.itemTitulo}>{categoria.nome}</Text>
                          <Text style={styles.itemCodigo}>({categoria.id})</Text>
                        </View>
                        <Text style={styles.itemSub}>
                          {totalProdutos(categoria.id)} produto(s) nesta categoria
                        </Text>
                      </View>
                      <BotaoLixeira onPress={() => excluirCategoria(categoria.id)} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </>
        )}

      </ScrollView>

      <BottomNav ativa="adicionar" />

    </SafeAreaView>
  );
}

interface ItensCadastradosProps {
  titulo: string
  itens: { id: string, nome: string }[]
  onPressItem?: (id: string) => void
}

function ItensCadastrados({ titulo, itens, onPressItem }: ItensCadastradosProps) {
  return (
    <View style={styles.card}>
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoTitulo}>{titulo}</Text>
        <View style={styles.contador}>
          <Text style={styles.contadorTexto}>{itens.length}</Text>
        </View>
      </View>
      <View style={styles.tags}>
        {itens.map((item) => (
          <Pressable
            key={item.id}
            style={styles.tag}
            disabled={!onPressItem}
            onPress={() => onPressItem?.(item.id)}
          >
            <FontAwesome5 name="tag" size={11} color={colors.brandGreen} />
            <Text style={styles.tagTexto}>{item.nome}</Text>
            {onPressItem && <FontAwesome5 name="chevron-right" size={10} color={colors.slate} />}
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function BotaoLixeira({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.lixeira} onPress={onPress}>
      <FontAwesome5 name="trash-alt" size={16} color={colors.brandRed} />
    </Pressable>
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
  cardTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  campo: {
    gap: 8,
  },
  linha: {
    flexDirection: 'row',
    gap: 14,
  },
  metade: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray,
  },
  dicaMapa: {
    fontSize: 13,
    color: colors.slate,
  },
  dicaMapaAviso: {
    color: colors.yellow,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    color: colors.inputText,
    backgroundColor: colors.white,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectTexto: {
    fontSize: 15,
    color: colors.inputText,
  },
  botao: {
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.brandGreen,
  },
  botaoTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: colors.brandDark,
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
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagTexto: {
    fontSize: 14,
    color: colors.gray,
  },
  listaRolavel: {
    maxHeight: 290,
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
  modalFundo: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalCaixa: {
    padding: 20,
    gap: 14,
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
  modalOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOpcaoAtiva: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.brandGreen,
  },
  modalOpcaoTexto: {
    fontSize: 15,
    color: colors.gray,
  },
  modalOpcaoTextoAtivo: {
    fontWeight: 'bold',
    color: colors.brandDark,
  },
});
