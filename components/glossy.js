import React from 'react'
import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { useTheme, ThemeContext } from '../utils/ThemeContext'
import { TYPE, LIGHT_COLORS, DARK_COLORS, setLiveGlossy } from '../utils/theme'

// The glossy universe of the sign-up, for the screens inside the app (audit
// 2026-10-28; Lita: one model screen first, then the others). Pink glass by day,
// a deep plum version at night (Lita, 2026-10-28). Backgrounds are images, not
// SVG gradients: they render the same on every phone.

const BG = { day: require('../assets/onboarding/bg.jpg'), night: require('../assets/onboarding/bg-night.jpg') }
const BTN = require('../assets/onboarding/btn.png')

// Every colour comes from the charter, utils/theme.js (Lita, 2026-11-06).
const fromCharter = (c, shadow) => ({ ink: c.text, soft: c.textSecondary, mute: c.muted, mauve: c.primary, mauve2: c.accent, line: c.border, bg: c.bg, glass: c.glass, glassLine: c.glassLine, glassOn: c.glassOn, icon: c.primary, iconBg: c.glassIcon, shadow })
// By day the glass casts a soft mauve shadow (the logo mauve), at night a dark one.
export const GLOSS = { day: fromCharter(LIGHT_COLORS, LIGHT_COLORS.accent), night: fromCharter(DARK_COLORS, DARK_COLORS.shadow) }

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

// The glossy backdrop for a page that doesn't use <Screen> (Home, Rekod, Dekod…).
// Its container keeps a solid colour (colors.solid) so the screen below never shows.
export const PageBackdrop = () => {
  const theme = useTheme()
  return theme.glossy ? <GlossyBackdrop night={theme.isDark} /> : null
}

// The glass of the sign-up for any card drawn by a screen (Lita, 2026-11-06):
// see-through white, a white edge and a soft shadow. `colors` from useColors().
export const glassCard = colors => ({
  backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
  shadowColor: colors.shadow, shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3,
})
// An icon sitting in a round glass bubble.
export const glassBubble = colors => ({
  borderWidth: 1.5, borderColor: colors.border, borderRadius: 999,
  shadowColor: colors.shadow, shadowOpacity: 0.16, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2,
})
// The shine of the sign-up's button, laid inside any main button (its style gets overflow hidden).
export const GlossyFill = () => {
  const theme = useTheme()
  if (!theme.glossy) return null
  return <Image source={BTN} pointerEvents="none" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="stretch" />
}

// A round glass icon.
export const GlassIcon = ({ C, size = 40, children }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.iconBg, borderWidth: 1, borderColor: C.glassLine, alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </View>
)

const styles = StyleSheet.create({
  btn: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: LIGHT_COLORS.shadow, shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
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
    shadow: C.shadow,
  }
  setLiveGlossy(colors)
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />
  return <ThemeContext.Provider value={{ ...base, colors, glossy: true, gloss: C }}>{children}</ThemeContext.Provider>
}
