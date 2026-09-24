import colors from '@/constants/colors';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View
} from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
}

export function Input({ label, placeholder, value, onChangeText, ...rest }: InputProps) {
    return (
        <View>
            <Text style={styles.label}>
                {label}
            </Text>
            <TextInput
                placeholder={placeholder}
                placeholderTextColor={colors.slate}
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                {...rest}
            />
        </View>
    )
}



const styles = StyleSheet.create({
    label: {
        color: colors.gray,
        marginBottom: 8,
        fontSize: 16,
        fontWeight: '500'
    },
    input: {
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 18,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.inputText,
        backgroundColor: colors.white
    }
});