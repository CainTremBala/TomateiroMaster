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
                placeholderTextColor={colors.zinc}
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
        color: colors.white,
        marginBottom: 10,
        fontSize: 18
    },
    input: {
        borderWidth: 1,
        borderColor: colors.gray,
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 8,
        paddingTop: 14,
        paddingBottom: 14,
        backgroundColor: colors.white
    }
});