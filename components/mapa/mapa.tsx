import colors from '@/constants/colors';
import { Coordenada } from '@/src/types';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

// Região inicial quando ainda não há ponto marcado (interior de SP)
const REGIAO_PADRAO = {
    latitude: -22.5,
    longitude: -47.5,
    latitudeDelta: 3,
    longitudeDelta: 3,
}

const ZOOM_PONTO = 0.05

interface MapaFazendaProps {
    coordenada: Coordenada | null
    // RN-31: quando informado, tocar no mapa (ou arrastar o marcador) marca o ponto
    onSelecionar?: (coordenada: Coordenada) => void
    altura?: number
}

export function MapaFazenda({ coordenada, onSelecionar, altura = 200 }: MapaFazendaProps) {
    const editavel = !!onSelecionar
    const mapa = useRef<MapView>(null)

    // RN-32: quando o ponto muda (ex: endereço encontrado), o mapa vai até ele
    useEffect(() => {
        if (!coordenada) return
        mapa.current?.animateToRegion(
            { ...coordenada, latitudeDelta: ZOOM_PONTO, longitudeDelta: ZOOM_PONTO },
            500
        )
    }, [coordenada])

    const regiaoInicial = coordenada
        ? { ...coordenada, latitudeDelta: ZOOM_PONTO, longitudeDelta: ZOOM_PONTO }
        : REGIAO_PADRAO

    return (
        <View style={[styles.container, { height: altura }]}>
            <MapView
                ref={mapa}
                style={StyleSheet.absoluteFill}
                initialRegion={regiaoInicial}
                scrollEnabled={editavel}
                zoomEnabled={editavel}
                rotateEnabled={false}
                pitchEnabled={false}
                onPress={(evento) => onSelecionar?.(evento.nativeEvent.coordinate)}
            >
                {coordenada && (
                    <Marker
                        coordinate={coordenada}
                        pinColor={colors.brandRed}
                        draggable={editavel}
                        onDragEnd={(evento) => onSelecionar?.(evento.nativeEvent.coordinate)}
                    />
                )}
            </MapView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
});
