import colors from '@/constants/colors';
import React from 'react';
import {
    Pressable,
    PressableProps,
    StyleSheet,
    Text
} from 'react-native';

interface ButtonProps extends PressableProps {
    label: string;
}

export function Button({ label, style, ...rest }: ButtonProps) {
    return (
        <Pressable
            style={(state) => [
                styles.container,
                state.pressed && styles.pressed,
                typeof style === 'function' ? style(state) : style
            ]}
            {...rest}
        >
            <Text style={styles.label}>
                {label}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.green,
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 16
    },
    pressed: {
        opacity: 0.7
    },
    label: {
        color: colors.zinc,
        fontSize: 18,
        fontWeight: 'bold'
    },
});
