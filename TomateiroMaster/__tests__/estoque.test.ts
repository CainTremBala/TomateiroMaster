/// <reference types="jest" />
import { calcularEntrada, calcularSaida, lerQuantidade } from '@/src/utils/estoque';

describe('RN-07: entrada com custo médio ponderado', () => {
  test('100 kg a R$ 7,00 + 50 kg a R$ 9,00 = 150 kg a R$ 7,67', () => {
    const resultado = calcularEntrada(100, 7, 50, 9)
    expect(resultado.quantidadeKg).toBe(150)
    expect(resultado.custoMedioKg).toBeCloseTo(7.6667, 4)
  })

  test('estoque vazio assume o preço da fazenda', () => {
    expect(calcularEntrada(0, 0, 25, 8.5)).toEqual({ quantidadeKg: 25, custoMedioKg: 8.5 })
  })

  test('sem sobras de ponto flutuante', () => {
    expect(calcularEntrada(0.1, 5, 0.2, 5).quantidadeKg).toBe(0.3)
  })
})

describe('RN-07 / RN-08: saída', () => {
  test('subtrai a quantidade', () => {
    expect(calcularSaida(150, 30)).toBe(120)
  })

  test('nunca fica abaixo de 0 kg', () => {
    expect(calcularSaida(5, 10)).toBe(0)
  })
})

describe('RN-07: quantidade digitada', () => {
  test.each([
    ['25', 25],
    ['12,5', 12.5],
    ['0.75', 0.75],
    [' 10 ', 10],
  ])('"%s" vale %d', (texto, esperado) => {
    expect(lerQuantidade(texto)).toBe(esperado)
  })

  test.each(['', '0', '0,0', '-5', 'abc', '1,2,3', '12,'])('"%s" é inválida', (texto) => {
    expect(lerQuantidade(texto)).toBeNaN()
  })
})
