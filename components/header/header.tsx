import colors from '@/constants/colors';
import { useApp } from '@/src/context/AppContext';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export function Header() {
    const { usuario } = useApp()

    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={styles.logo}>
                    <Image
                        source={require('@/assets/images/Tomateiros/Tomateiro001.png')}
                        style={styles.logoImagem}
                        resizeMode="contain"
                    />
                </View>
                <View>
                    <Text style={styles.titulo}>
                        <Text style={styles.tituloDestaque}>Tomateiro</Text> Master
                    </Text>
                    <Text style={styles.subtitulo}>Controle de Estoque</Text>
                </View>
            </View>

            <View style={styles.usuario}>
                <Text style={styles.usuarioTexto}>{usuario?.nome}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: colors.cardDark,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logo: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.brandDark2,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    logoImagem: {
        width: 40,
        height: 40,
    },
    titulo: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.white,
    },
    tituloDestaque: {
        color: colors.brandRed,
    },
    subtitulo: {
        fontSize: 13,
        color: colors.slate,
    },
    usuario: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: colors.brandDark,
        borderWidth: 1,
        borderColor: colors.border,
    },
    usuarioTexto: {
        fontSize: 15,
        color: colors.white,
    },
});
