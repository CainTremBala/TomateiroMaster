import colors from '@/constants/colors';
import { useApp } from '@/src/context/AppContext';
import { FontAwesome6 } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Módulo 6: notificação flutuante no topo da tela (RN-25 / RN-26)
export function ToastNotificacao() {
    const { toast } = useApp()
    const insets = useSafeAreaInsets()
    const opacidade = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (!toast) return
        opacidade.setValue(0)
        Animated.timing(opacidade, { toValue: 1, duration: 200, useNativeDriver: true }).start()
    }, [toast, opacidade])

    if (!toast) return null

    const sucesso = toast.tipo === 'sucesso'
    const cor = sucesso ? colors.brandGreen : colors.brandRed

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.toast,
                {
                    top: insets.top + 10,
                    borderColor: cor,
                    opacity: opacidade,
                    transform: [{ translateY: opacidade.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
                },
            ]}
        >
            <FontAwesome6
                name={sucesso ? 'circle-check' : 'circle-exclamation'}
                size={20}
                color={cor}
                solid
            />
            <Text style={styles.mensagem}>{toast.mensagem}</Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 1000,
        elevation: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        backgroundColor: colors.cardDark,
        shadowColor: colors.black,
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    mensagem: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: colors.white,
    },
});
