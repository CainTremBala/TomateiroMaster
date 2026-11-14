import { MapaFazenda } from '@/components/mapa/mapa';
import colors from '@/constants/colors';
import { useApp } from '@/src/context/AppContext';
import { Coordenada, NovaFazenda } from '@/src/types';
import { formatarReais, mascararReais, valorDaMascara } from '@/src/utils/formatar';
import { escolherFoto } from '@/src/utils/foto';
import { buscarEndereco } from '@/src/utils/mapa';
import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

// RN-32
type BuscaEndereco = 'ociosa' | 'buscando' | 'encontrado' | 'nao-encontrado'
const ESPERA_BUSCA = 1000

function dicaDoMapa(busca: BuscaEndereco, temPonto: boolean) {
  if (busca === 'buscando') return 'Buscando endereço no mapa...'
  if (busca === 'nao-encontrado') return 'Endereço não encontrado. Toque no mapa para marcar manualmente.'
  if (temPonto) return 'Ponto marcado. Toque em outro lugar ou arraste o marcador para ajustar.'
  return 'Digite a localização acima ou toque no mapa para marcar a fazenda.'
}

// Item da lista "Produtos Fornecidos" (o valor fica com a máscara R$ enquanto edita)
interface ItemFornecido {
  produtoId: string
  valor: string
  foto?: string
}

interface FazendaFormProps {
  titulo: string
  textoBotao: string
  inicial?: NovaFazenda
  // true = limpa o formulário depois de salvar (cadastro)
  limparAoSalvar?: boolean
  onSalvar: (dados: NovaFazenda) => Promise<boolean>
}

function itensIniciais(inicial?: NovaFazenda): ItemFornecido[] {
  return (inicial?.produtos ?? []).map((item) => ({
    produtoId: item.produtoId,
    valor: formatarReais(item.valorKg),
    foto: item.foto,
  }))
}

// RN-35 / RN-36: formulário de cadastro e de edição da fazenda
export function FazendaForm({ titulo, textoBotao, inicial, limparAoSalvar, onSalvar }: FazendaFormProps) {

  const { produtos, categorias, mostrarToast } = useApp()

  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [localizacao, setLocalizacao] = useState(inicial?.localizacao ?? '')
  const [coordenada, setCoordenada] = useState<Coordenada | null>(inicial?.coordenada ?? null)
  const [itens, setItens] = useState<ItemFornecido[]>(itensIniciais(inicial))
  const [selectAberto, setSelectAberto] = useState(false)
  const [fotoDoItem, setFotoDoItem] = useState<string | null>(null) // produtoId com o menu de foto aberto
  const [salvando, setSalvando] = useState(false)

  // RN-32: só busca depois que o usuário digita (na edição, o ponto salvo é mantido)
  const [digitouLocalizacao, setDigitouLocalizacao] = useState(false)
  const [buscaEndereco, setBuscaEndereco] = useState<BuscaEndereco>('ociosa')

  useEffect(() => {
    const texto = localizacao.trim()
    if (!digitouLocalizacao || texto.length < 3) {
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
  }, [localizacao, digitouLocalizacao])

  // RN-35: o mesmo produto não se repete na mesma fazenda
  const produtosDisponiveis = produtos.filter(
    (produto) => !itens.some((item) => item.produtoId === produto.id)
  )

  function nomeProduto(produtoId: string) {
    return produtos.find((produto) => produto.id === produtoId)?.nome ?? produtoId
  }

  function nomeCategoriaDoProduto(produtoId: string) {
    const categoriaId = produtos.find((produto) => produto.id === produtoId)?.categoriaId
    return categorias.find((categoria) => categoria.id === categoriaId)?.nome ?? ''
  }

  function alterarItem(produtoId: string, mudanca: Partial<ItemFornecido>) {
    setItens((atuais) => atuais.map((item) => (item.produtoId === produtoId ? { ...item, ...mudanca } : item)))
  }

  function adicionarItem(produtoId: string) {
    setItens((atuais) => [...atuais, { produtoId, valor: '' }])
    setSelectAberto(false)
  }

  function removerItem(produtoId: string) {
    setItens((atuais) => atuais.filter((item) => item.produtoId !== produtoId))
  }

  // RN-36: foto opcional do produto desta fazenda
  async function trocarFoto(origem: 'galeria' | 'camera') {
    const produtoId = fotoDoItem
    setFotoDoItem(null)
    if (!produtoId) return

    const uri = await escolherFoto(origem, mostrarToast)
    if (uri) alterarItem(produtoId, { foto: uri })
  }

  function removerFoto() {
    if (fotoDoItem) alterarItem(fotoDoItem, { foto: undefined })
    setFotoDoItem(null)
  }

  async function salvar() {
    if (salvando) return
    setSalvando(true)

    const ok = await onSalvar({
      nome,
      localizacao,
      coordenada,
      produtos: itens.map((item) => ({
        produtoId: item.produtoId,
        valorKg: valorDaMascara(item.valor),
        foto: item.foto,
      })),
    })

    setSalvando(false)
    if (ok && limparAoSalvar) {
      setNome('')
      setLocalizacao('')
      setDigitouLocalizacao(false)
      setCoordenada(null)
      setItens([])
    }
  }

  const itemComMenu = itens.find((item) => item.produtoId === fotoDoItem)

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>{titulo}</Text>

      <View style={styles.campo}>
        <Text style={styles.label}>Nome da Fazenda</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Fazenda Santa Luzia"
          placeholderTextColor={colors.slate}
          value={nome}
          onChangeText={setNome}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Localização da Fazenda</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Fazenda Santa Luzia, Holambra - SP"
          placeholderTextColor={colors.slate}
          value={localizacao}
          onChangeText={(texto) => {
            setLocalizacao(texto)
            setDigitouLocalizacao(true)
          }}
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

      {/* RN-35: produtos que a fazenda vende, com o preço dela */}
      <View style={styles.campo}>
        <Text style={styles.label}>Produtos Fornecidos</Text>

        {itens.length === 0 && (
          <Text style={styles.dicaMapa}>Nenhum produto adicionado.</Text>
        )}

        {itens.map((item) => (
          <View key={item.produtoId} style={styles.item}>
            <Pressable style={styles.foto} onPress={() => setFotoDoItem(item.produtoId)}>
              {item.foto ? (
                <Image source={{ uri: item.foto }} style={styles.fotoImagem} />
              ) : (
                <FontAwesome5 name="camera" size={18} color={colors.slate} />
              )}
            </Pressable>

            <View style={styles.itemInfo}>
              <Text style={styles.itemTitulo} numberOfLines={1}>{nomeProduto(item.produtoId)}</Text>
              <Text style={styles.itemSub} numberOfLines={1}>{nomeCategoriaDoProduto(item.produtoId)}</Text>
              <TextInput
                style={styles.inputValor}
                placeholder="R$ 0,00 / kg"
                placeholderTextColor={colors.slate}
                keyboardType="number-pad"
                value={item.valor}
                onChangeText={(texto) => alterarItem(item.produtoId, { valor: mascararReais(texto) })}
              />
            </View>

            <Pressable style={styles.remover} onPress={() => removerItem(item.produtoId)}>
              <FontAwesome5 name="times" size={16} color={colors.brandRed} />
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.botaoAdicionar} onPress={() => setSelectAberto(true)}>
          <FontAwesome5 name="plus" size={13} color={colors.brandGreen} />
          <Text style={styles.botaoAdicionarTexto}>Adicionar Produto Fornecido</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.botao, salvando && { opacity: 0.6 }]} onPress={salvar}>
        <Text style={styles.botaoTexto}>{textoBotao}</Text>
      </Pressable>

      {/* Select do produto fornecido */}
      <Modal
        visible={selectAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectAberto(false)}
      >
        <Pressable style={styles.modalFundo} onPress={() => setSelectAberto(false)}>
          <Pressable style={styles.modalCaixa} onPress={() => {}}>
            <Text style={styles.modalTitulo}>Selecione o Produto</Text>
            {produtosDisponiveis.length === 0 ? (
              <Text style={styles.itemSub}>
                {produtos.length === 0
                  ? 'Cadastre um produto primeiro.'
                  : 'Todos os produtos já foram adicionados.'}
              </Text>
            ) : (
              <ScrollView style={styles.listaRolavel}>
                {produtosDisponiveis.map((produto) => (
                  <Pressable
                    key={produto.id}
                    style={styles.modalOpcao}
                    onPress={() => adicionarItem(produto.id)}
                  >
                    <Text style={styles.modalOpcaoTexto}>{produto.nome}</Text>
                    <Text style={styles.itemSub}>{nomeCategoriaDoProduto(produto.id)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* RN-36: opções da foto do produto */}
      <Modal
        visible={!!fotoDoItem}
        transparent
        animationType="fade"
        onRequestClose={() => setFotoDoItem(null)}
      >
        <Pressable style={styles.modalFundo} onPress={() => setFotoDoItem(null)}>
          <Pressable style={styles.modalCaixa} onPress={() => {}}>
            <Text style={styles.modalTitulo}>Foto do Produto</Text>

            <Pressable style={styles.modalOpcaoLinha} onPress={() => trocarFoto('galeria')}>
              <FontAwesome5 name="images" size={16} color={colors.brandGreen} />
              <Text style={styles.modalOpcaoTexto}>Escolher da galeria</Text>
            </Pressable>

            <Pressable style={styles.modalOpcaoLinha} onPress={() => trocarFoto('camera')}>
              <FontAwesome5 name="camera" size={16} color={colors.brandGreen} />
              <Text style={styles.modalOpcaoTexto}>Tirar foto</Text>
            </Pressable>

            {itemComMenu?.foto && (
              <Pressable style={styles.modalOpcaoLinha} onPress={removerFoto}>
                <FontAwesome5 name="trash-alt" size={16} color={colors.brandRed} />
                <Text style={[styles.modalOpcaoTexto, { color: colors.brandRed }]}>Remover foto</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
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
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray,
  },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 15,
    color: colors.inputText,
    backgroundColor: colors.white,
  },
  dicaMapa: {
    fontSize: 13,
    color: colors.slate,
  },
  dicaMapaAviso: {
    color: colors.yellow,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foto: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fotoImagem: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTitulo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.white,
  },
  itemSub: {
    fontSize: 13,
    color: colors.slate,
  },
  inputValor: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 15,
    color: colors.inputText,
    backgroundColor: colors.white,
  },
  remover: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.35)',
  },
  botaoAdicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.brandGreen,
  },
  botaoAdicionarTexto: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.brandGreen,
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
  listaRolavel: {
    maxHeight: 290,
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
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOpcaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOpcaoTexto: {
    fontSize: 15,
    color: colors.gray,
  },
});
