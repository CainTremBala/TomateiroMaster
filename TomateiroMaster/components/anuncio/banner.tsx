import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// RN-42: banner do AdMob com o ID de TESTE do Google.
// O AdMob tem código nativo: não funciona no Expo Go (precisa de development build).
const NO_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient

type ModuloAds = typeof import('react-native-google-mobile-ads')

// Carrega o módulo só fora do Expo Go (importar no Expo Go derruba o app)
function carregarModulo(): ModuloAds | null {
  if (NO_EXPO_GO) return null
  try {
    return require('react-native-google-mobile-ads') as ModuloAds
  } catch {
    return null
  }
}

const ads = carregarModulo()
let iniciado: Promise<unknown> | null = null

export function BannerAnuncio() {
  const [pronto, setPronto] = useState(false)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    if (!ads) return
    iniciado ??= ads.default().initialize()
    iniciado.then(() => setPronto(true)).catch(() => setFalhou(true))
  }, [])

  if (!ads || !pronto || falhou) return null

  const { BannerAd, BannerAdSize, TestIds } = ads
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={TestIds.ADAPTIVE_BANNER}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFalhou(true)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
