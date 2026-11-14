import colors from '@/constants/colors';
import { Coordenada } from '@/src/types';
import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface MapaFazendaProps {
    coordenada: Coordenada | null
    onSelecionar?: (coordenada: Coordenada) => void
    altura?: number
}

// react-native-maps não funciona no navegador: o mapa só aparece no celular
export function MapaFazenda({ altura = 200 }: MapaFazendaProps) {
    return (
        <View style={[styles.container, { height: altura }]}>
            <FontAwesome5 name="map-marked-alt" size={28} color={colors.slate} />
            <Text style={styles.texto}>Mapa disponível apenas no app do celular.</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderRadius: 12,
        backgroundColor: colors.brandDark2,
        borderWidth: 1,
        borderColor: colors.border,
    },
    texto: {
        fontSize: 14,
        color: colors.slate,
    },
});
