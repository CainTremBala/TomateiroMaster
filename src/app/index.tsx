import { Input } from '@/components/input/input';
import colors from "@/constants/colors";
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Login() {

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  return (
    <ScrollView style={styles.scrollview}>
      <View style={styles.container}>

        <View style={styles.header}>

          <View style={styles.img_view}>
            <Image
              source={require('@/assets/images/Tomateiros/Tomateiro001.png')}
              style={styles.imagem}
            />
          </View>

          <Text style={styles.slogan}>
            O Melhor App de gestão de <Text style={styles.subSlogan}>Tomate</Text> do meu bairro!!
          </Text>

        </View>


        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Digite seu email aqui..."
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Senha"
            placeholder="Digite sua senha aqui..."
            value={senha}
            onChangeText={setEmail}
          />

        </View>




      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollview: {
    backgroundColor: colors.zinc,
  },
  container: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
  },
  header: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
  },
  img_view: {
    padding: 10,
    borderRadius: 150,
    backgroundColor: colors.zinc2,
    alignSelf: 'flex-start',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  imagem: {
    width: 300,
    height: 300,
    marginLeft: -20,
  },
  slogan: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  subSlogan: {
    fontSize: 30,
    color: colors.red,
  },
  form: {
    paddingHorizontal: 25,
    flex: 1,
    marginTop: 20,
    width: '100%'
  }
});
