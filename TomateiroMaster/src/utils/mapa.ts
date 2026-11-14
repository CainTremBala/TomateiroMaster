import { Coordenada } from '@/src/types';
import { Linking } from 'react-native';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

// RN-31: abre o ponto no app de mapas do celular (Google Maps ou navegador)
export function abrirNoMaps({ latitude, longitude }: Coordenada) {
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)
}

async function consultar(texto: string, signal: AbortSignal): Promise<Coordenada | null> {
  const url = `${NOMINATIM}?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(texto)}`
  const resposta = await fetch(url, {
    signal,
    headers: {
      'Accept-Language': 'pt-BR',
      'User-Agent': 'TomateiroMaster/1.0 (projeto academico)',
    },
  })
  if (!resposta.ok) return null

  const [resultado] = await resposta.json()
  if (!resultado) return null
  return { latitude: Number(resultado.lat), longitude: Number(resultado.lon) }
}

// RN-32: busca o endereço digitado (OpenStreetMap / Nominatim).
// Se o texto completo não for encontrado, tenta só a parte antes do " - " (ex: sem o "Lote 3").
export async function buscarEndereco(texto: string, signal: AbortSignal): Promise<Coordenada | null> {
  const completo = texto.trim()
  const semDetalhe = completo.split(' - ')[0].trim()

  const encontrado = await consultar(completo, signal)
  if (encontrado || semDetalhe === completo) return encontrado
  return consultar(semDetalhe, signal)
}
