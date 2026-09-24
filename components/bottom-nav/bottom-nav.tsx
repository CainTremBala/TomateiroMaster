import colors from '@/constants/colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Aba = 'estoque' | 'adicionar' | 'perfil';

interface BottomNavProps {
    ativa: Aba;
}

const itens = [
    { aba: 'estoque', label: 'Estoque', icone: 'boxes', rota: '/estoque/page' },
    { aba: 'adicionar', label: 'Adicionar', icone: 'plus-circle', rota: '/adicionar/page' },
    { aba: 'perfil', label: 'Perfil', icone: 'user-alt', rota: '/profile/page' },
] as const

export function BottomNav({ ativa }: BottomNavProps) {
    return (
        <View style={styles.nav}>
            {itens.map((item) => {
                const cor = item.aba === ativa ? colors.brandGreen : colors.slate

                return (
                    <Pressable
                        key={item.aba}
                        style={styles.navItem}
                        onPress={() => item.aba !== ativa && router.replace(item.rota)}
                    >
                        <FontAwesome5 name={item.icone} size={20} color={cor} />
                        <Text style={[styles.navTexto, { color: cor }]}>{item.label}</Text>
                    </Pressable>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    nav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        paddingBottom: 20,
        backgroundColor: colors.cardDark,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
    },
    navTexto: {
        fontSize: 13,
    },
});
