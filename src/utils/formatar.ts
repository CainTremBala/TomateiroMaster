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
