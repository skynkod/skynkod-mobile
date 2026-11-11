import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { View, Text, Image, Animated, Easing, StyleSheet } from 'react-native'
import { LIGHT_COLORS } from '../utils/theme'
import { GFW } from './glossy'

// Koda, the skin coach's face (Lita, 2026-11-09): the five expressions of the
// sign-up, now in the app too: in the chat, after what she does, in empty
// screens, during waits, on the tip card and with her badges.
export const KODA_FACES = {
  happy: require('../assets/koda/koda-happy.png'),
  wink: require('../assets/koda/koda-wink.png'),
  joy: require('../assets/koda/koda-joy.png'),
  calm: require('../assets/koda/koda-calm.png'),
  curious: require('../assets/koda/koda-curious.png'),
}

// Koda's face; `float` makes it bob gently, as in the sign-up.
export function KodaFace({ mood = 'happy', size = 40, float = false, style }) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!float) return undefined
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]))
    loop.start()
    return () => loop.stop()
  }, [float])
  const lift = v.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.12] })
  return (
    <Animated.View style={[style, float && { transform: [{ translateY: lift }] }]}>
      <Image source={KODA_FACES[mood] || KODA_FACES.happy} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  )
}

// Koda's little word after something she did: shows a few seconds above the tab
// bar, then leaves by itself. Never blocks a tap (pointerEvents none).
const KodaSayContext = createContext(() => {})
export const useKodaSay = () => useContext(KodaSayContext)

// `bottom`: where the word sits, just above the tab bar.
export function KodaSayProvider({ children, bottom = 96 }) {
  const [word, setWord] = useState(null)
  const v = useRef(new Animated.Value(0)).current
  const timer = useRef(null)
  const say = useCallback((text, mood = 'happy') => {
    clearTimeout(timer.current)
    setWord({ text, mood })
    v.setValue(0)
    Animated.timing(v, { toValue: 1, duration: 280, useNativeDriver: true }).start()
    timer.current = setTimeout(() => Animated.timing(v, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => setWord(null)), Math.max(2800, text.length * 55))
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <KodaSayContext.Provider value={say}>
      {children}
      {word ? (
        <Animated.View pointerEvents="none" style={[styles.say, { bottom, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
          <KodaFace mood={word.mood} size={42} />
          <View style={styles.bubble}>
            <Text style={[styles.text, GFW('500')]}>{word.text}</Text>
          </View>
        </Animated.View>
      ) : null}
    </KodaSayContext.Provider>
  )
}

const styles = StyleSheet.create({
  say: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubble: {
    flexShrink: 1, backgroundColor: LIGHT_COLORS.glassOn, borderWidth: 1, borderColor: LIGHT_COLORS.glassLine, borderRadius: 16,
    paddingVertical: 8, paddingHorizontal: 12, shadowColor: LIGHT_COLORS.shadow, shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  text: { fontSize: 13, lineHeight: 18, color: LIGHT_COLORS.text },
})
