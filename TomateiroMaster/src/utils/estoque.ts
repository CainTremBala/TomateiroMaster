// Regras de cálculo do estoque, sem dependência de React (testadas em __tests__/estoque.test.ts)

// Arredonda para evitar sobras de ponto flutuante (ex: 0,1 + 0,2)
export function arredondar(valor: number, casas: number) {
  const fator = 10 ** casas
  return Math.round(valor * fator) / fator
}

// RN-07: entrada pelo preço da fazenda, recalculando o custo médio ponderado
export function calcularEntrada(quantidadeKg: number, custoMedioKg: number, entradaKg: number, precoKg: number) {
  const novaQuantidade = quantidadeKg + entradaKg
  const custoMedio = (quantidadeKg * custoMedioKg + entradaKg * precoKg) / novaQuantidade
  return {
    quantidadeKg: arredondar(novaQuantidade, 3),
    custoMedioKg: arredondar(custoMedio, 4),
  }
}

// RN-07 / RN-08: saída pelo custo médio (não muda), nunca abaixo de 0 kg
export function calcularSaida(quantidadeKg: number, saidaKg: number) {
  return arredondar(Math.max(0, quantidadeKg - saidaKg), 3)
}

// RN-07: quantidade digitada maior que 0, com vírgula ou ponto. Inválida → NaN
export function lerQuantidade(texto: string) {
  const normalizado = texto.trim().replace(',', '.')
  const quantidade = /^\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : NaN
  return quantidade > 0 ? quantidade : NaN
}
