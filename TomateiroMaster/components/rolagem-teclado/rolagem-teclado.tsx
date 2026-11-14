import { useIsFocused } from 'expo-router';
import { ComponentRef, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  TextInput,
} from 'react-native';

// Espaço que fica entre o input e o topo do teclado
const MARGEM = 24

// ScrollView que rola sozinha para deixar visível o input que está sendo digitado.
// Usar no lugar da ScrollView em toda tela que tem campo de texto.
export function ScrollViewTeclado({
  contentContainerStyle,
  onScroll,
  onTouchEnd,
  children,
  ...props
}: ScrollViewProps) {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null)
  const scrollY = useRef(0)
  const topoTeclado = useRef<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [alturaTeclado, setAlturaTeclado] = useState(0)
  // As telas do Stack ficam montadas por baixo: só a tela aberta reage ao teclado
  const focada = useIsFocused()

  function rolarAteInput() {
    const topo = topoTeclado.current
    const input = TextInput.State.currentlyFocusedInput()
    if (topo === null || !input) return

    input.measureInWindow((_x, y, _largura, altura) => {
      const escondido = y + altura + MARGEM - topo
      if (escondido > 0) {
        ref.current?.scrollTo({ y: scrollY.current + escondido, animated: true })
      }
    })
  }

  // Espera o espaço extra do teclado entrar no layout antes de rolar
  function agendarRolagem(atraso: number) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(rolarAteInput, atraso)
  }

  useEffect(() => {
    if (!focada) return

    const eventoAbrir = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const eventoFechar = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const abrir = Keyboard.addListener(eventoAbrir, (e: KeyboardEvent) => {
      topoTeclado.current = e.endCoordinates.screenY
      setAlturaTeclado(e.endCoordinates.height)
      agendarRolagem(100)
    })
    const fechar = Keyboard.addListener(eventoFechar, () => {
      topoTeclado.current = null
      setAlturaTeclado(0)
    })

    return () => {
      abrir.remove()
      fechar.remove()
      if (timer.current) clearTimeout(timer.current)
      topoTeclado.current = null
      setAlturaTeclado(0)
    }
  }, [focada])

  function aoRolar(e: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollY.current = e.nativeEvent.contentOffset.y
    onScroll?.(e)
  }

  // Com o teclado já aberto, tocar em outro input não dispara o evento do teclado
  function aoTocar(e: Parameters<NonNullable<ScrollViewProps['onTouchEnd']>>[0]) {
    if (topoTeclado.current !== null) agendarRolagem(250)
    onTouchEnd?.(e)
  }

  const estilo = StyleSheet.flatten(contentContainerStyle) ?? {}
  const paddingBase = Number(estilo.paddingBottom ?? estilo.paddingVertical ?? estilo.padding ?? 0)

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      {...props}
      ref={ref}
      contentContainerStyle={[
        contentContainerStyle,
        alturaTeclado > 0 && { paddingBottom: paddingBase + alturaTeclado },
      ]}
      onScroll={aoRolar}
      onTouchEnd={aoTocar}
      scrollEventThrottle={16}
    >
      {children}
    </ScrollView>
  )
}
