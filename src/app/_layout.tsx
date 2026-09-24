import { ToastNotificacao } from "@/components/toast/toast";
import { AppProvider } from "@/src/context/AppContext";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function MainLayout() {
    return (
        <AppProvider>
            <View style={styles.container}>
                <Stack>
                    <Stack.Screen
                        name='index'
                        options={{ headerShown: false }}
                    />

                    <Stack.Screen
                        name='(auth)/signup/page'
                        options={{ headerShown: false }}
                    />

                    <Stack.Screen
                        name='(panel)/estoque/page'
                        options={{ headerShown: false }}
                    />

                    <Stack.Screen
                        name='(panel)/adicionar/page'
                        options={{ headerShown: false }}
                    />

                    <Stack.Screen
                        name='(panel)/profile/page'
                        options={{ headerShown: false }}
                    />
                </Stack>

                {/* Toast acima de qualquer tela (Módulo 6) */}
                <ToastNotificacao />
            </View>
        </AppProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
