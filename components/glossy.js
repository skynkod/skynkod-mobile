import React from 'react'
import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { useTheme, ThemeContext } from '../utils/ThemeContext'
import { TYPE } from '../utils/theme'

// The glossy universe of the sign-up, for the screens inside the app (audit
// 2026-10-28; Lita: one model screen first, then the others). Pink glass by day,
// a deep plum version at night (Lita, 2026-10-28). Backgrounds are images, not
// SVG gradients: they render the same on every phone.

const BG = { day: require('../assets/onboarding/bg.jpg'), night: require('../assets/onboarding/bg-night.jpg') }
const BTN = require('../assets/onboarding/btn.png')

export const GLOSS = {
  day: { ink: '#2F2230', soft: '#6E5F6B', mute: '#A0909B', mauve: '#8E6688', mauve2: '#A57B9C', line: '#EADCE5', bg: '#FBF4F8', glass: 'rgba(255,255,255,0.62)', glassLine: 'rgba(255,255,255,0.9)', glassOn: 'rgba(255,255,255,0.88)', icon: '#94557F', iconBg: 'rgba(255,255,255,0.75)', shadow: '#AA789B' },
  night: { ink: '#F6EDF3', soft: '#D3C2CE', mute: '#9F8C9B', mauve: '#E2B6D6', mauve2: '#C996BD', line: 'rgba(255,255,255,0.12)', bg: '#1B131E', glass: 'rgba(255,255,255,0.07)', glassLine: 'rgba(255,255,255,0.14)', glassOn: 'rgba(201,150,189,0.16)', icon: '#E2B6D6', iconBg: 'rgba(255,255,255,0.08)', shadow: '#000000' },
}

// Colours and Inter for the time of day the app shows.
export const useGlossy = () => {
  const { isDark } = useTheme()
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold })
  const F = loaded
    ? { r: { fontFamily: 'Inter_400Regular' }, m: { fontFamily: 'Inter_500Medium' }, s: { fontFamily: 'Inter_600SemiBold' }, b: { fontFamily: 'Inter_700Bold' } }
    : { r: {}, m: { fontWeight: '500' }, s: { fontWeight: '600' }, b: { fontWeight: '700' } }
  return { C: isDark ? GLOSS.night : GLOSS.day, night: !!isDark, F }
}

export const GlossyBackdrop = ({ night }) => (
  <Image source={night ? BG.night : BG.day} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" />
)

// A glass card.
export const Glass = ({ C, night, style, children }) => (
  <View style={[{
    backgroundColor: C.glass, borderWidth: 1.5, borderColor: C.glassLine, borderRadius: 18,
    shadowColor: C.shadow, shadowOpacity: night ? 0.35 : 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3,
  }, style]}>
    {children}
  </View>
)

// The glossy button of the sign-up.
export const GlossyButton = ({ title, onPress, disabled, loading, icon = 'arrow-forward', F }) => (
  <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button"
    style={({ pressed }) => [styles.btn, { opacity: disabled || loading ? 0.55 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
    <Image source={BTN} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', borderRadius: 26 }]} resizeMode="stretch" />
    <Text style={[F?.s, styles.btnText]}>{loading ? '…' : title}</Text>
    {icon ? <Ionicons name={icon} size={18} color="#fff" style={styles.btnArrow} /> : null}
  </Pressable>
)

// A round glass icon.
export const GlassIcon = ({ C, size = 40, children }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.iconBg, borderWidth: 1, borderColor: C.glassLine, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </View>
)

const styles = StyleSheet.create({
  btn: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#86607F', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  btnText: { color: '#fff', fontSize: 16 },
  btnArrow: { position: 'absolute', right: 22 },
})

// Inter by weight: one family per weight (iOS ignores fontWeight on these fonts).
const FAMILY = { 400: 'Inter_400Regular', normal: 'Inter_400Regular', 500: 'Inter_500Medium', 600: 'Inter_600SemiBold', 700: 'Inter_700Bold', 800: 'Inter_700Bold', 900: 'Inter_700Bold', bold: 'Inter_700Bold' }
export const GFW = w => ({ fontFamily: FAMILY[w] || FAMILY[400] })
// The app's type scale, in Inter.
export const GTYPE = Object.fromEntries(Object.entries(TYPE).map(([k, { fontWeight, ...rest }]) => [k, { ...rest, ...GFW(fontWeight) }]))

// Wraps a screen in the glossy universe: the shared components (Screen, Card,
// Button, Input…) read these colours and draw glass, the photo-like backdrop
// and the glossy button. The screen's own content stays as it is.
export const GlossyScope = ({ children }) => {
  const base = useTheme()
  const [loaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold })
  const C = base.isDark ? GLOSS.night : GLOSS.day
  const colors = {
    ...base.colors,
    bg: 'transparent',
    surface: base.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
    card: C.glass,
    border: C.glassLine,
    primary: base.isDark ? C.mauve : C.mauve2,
    primarySoft: C.glassOn,
    text: C.ink,
    textSecondary: C.soft,
    muted: C.mute,
    solid: C.bg,
  }
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />
  return <ThemeContext.Provider value={{ ...base, colors, glossy: true, gloss: C }}>{children}</ThemeContext.Provider>
}
