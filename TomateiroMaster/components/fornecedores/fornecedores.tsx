import colors from '@/constants/colors';
import { Fazenda } from '@/src/types';
import { formatarReais } from '@/src/utils/formatar';
import { FontAwesome5 } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

export interface Fornecedor {
  fazenda: Fazenda
  valorKg: number
  foto?: string
}

interface FornecedoresProps {
  fornecedores: Fornecedor[]
  mostrarLocalizacao?: boolean
}

// RN-35 / RN-36: fazendas que fornecem o produto, com foto e preço atual de cada uma
export function Fornecedores({ fornecedores, mostrarLocalizacao }: FornecedoresProps) {
  if (fornecedores.length === 0) {
    return <Text style={styles.vazio}>Nenhuma fazenda fornece este produto.</Text>
  }

  return (
    <View style={styles.lista}>
      {fornecedores.map(({ fazenda, valorKg, foto }) => (
        <View key={fazenda.id} style={styles.item}>
          <View style={styles.foto}>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.fotoImagem} />
            ) : (
              <FontAwesome5 name="seedling" size={14} color={colors.slate} />
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.nome} numberOfLines={1}>{fazenda.nome}</Text>
            {mostrarLocalizacao && (
              <View style={styles.localizacao}>
                <FontAwesome5 name="map-marker-alt" size={11} color={colors.brandRed} />
                <Text style={styles.localizacaoTexto} numberOfLines={1}>{fazenda.localizacao}</Text>
              </View>
            )}
          </View>

          <Text style={styles.preco}>{formatarReais(valorKg)}/kg</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  vazio: {
    fontSize: 14,
    color: colors.slate,
  },
  lista: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  foto: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandDark2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fotoImagem: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nome: {
    fontSize: 15,
    color: colors.gray,
  },
  localizacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  localizacaoTexto: {
    flex: 1,
    fontSize: 13,
    color: colors.slate,
  },
  preco: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.brandGreen,
  },
});
