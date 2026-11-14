// Ex: 1965 -> "1.965 kg"
export function formatarKg(valor: number) {
  return `${valor.toLocaleString('pt-BR')} kg`
}

// Ex: 17845 -> "R$ 17.845,00"
export function formatarReais(valor: number) {
  const numero = valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `R$ ${numero}`
}

// Máscara de moeda enquanto digita (os dígitos entram pelos centavos)
// Ex: "8" -> "R$ 0,08", "850" -> "R$ 8,50", "" -> ""
export function mascararReais(texto: string) {
  const digitos = texto.replace(/\D/g, '').replace(/^0+/, '')
  if (!digitos) return ''
  return formatarReais(Number(digitos) / 100)
}

// Ex: "R$ 1.234,50" -> 1234.5
export function valorDaMascara(texto: string) {
  const digitos = texto.replace(/\D/g, '')
  return digitos ? Number(digitos) / 100 : 0
}
