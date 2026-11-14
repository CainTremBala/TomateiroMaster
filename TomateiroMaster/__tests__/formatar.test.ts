/// <reference types="jest" />
import { formatarReais, mascararReais, valorDaMascara } from '@/src/utils/formatar';
import { EMAIL_VALIDO } from '@/src/utils/validacao';

// toLocaleString pode usar espaço comum ou espaço fino entre "R$" e o número
const semEspacoEspecial = (texto: string) => texto.replace(/\s/g, ' ')

describe('RN-05: máscara de moeda R$ 0,00', () => {
  test.each([
    ['8', 'R$ 0,08'],
    ['85', 'R$ 0,85'],
    ['850', 'R$ 8,50'],
    ['123450', 'R$ 1.234,50'],
    ['R$ 8,505', 'R$ 85,05'],
  ])('digitar "%s" mostra "%s"', (digitado, esperado) => {
    expect(semEspacoEspecial(mascararReais(digitado))).toBe(esperado)
  })

  test('apagar todos os dígitos deixa o campo vazio', () => {
    expect(mascararReais('')).toBe('')
    expect(mascararReais('R$ ')).toBe('')
  })

  test('lê o valor da máscara', () => {
    expect(valorDaMascara('R$ 1.234,50')).toBe(1234.5)
    expect(valorDaMascara('')).toBe(0)
  })

  test('formata reais', () => {
    expect(semEspacoEspecial(formatarReais(17845))).toBe('R$ 17.845,00')
  })
})

describe('RN-01: formato de e-mail', () => {
  test.each(['usuario@dominio.com', 'caio.pragana@gmail.com'])('%s é válido', (email) => {
    expect(EMAIL_VALIDO.test(email)).toBe(true)
  })

  test.each(['usuario', 'usuario@', '@dominio.com', 'usuario@dominio', 'a b@c.com'])('%s é inválido', (email) => {
    expect(EMAIL_VALIDO.test(email)).toBe(false)
  })
})
