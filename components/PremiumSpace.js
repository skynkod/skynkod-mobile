import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import FeatureIcon from './FeatureIcon'
import { useNavigation } from '@react-navigation/native'
import * as Haptics from 'expo-haptics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SPACING, livePalette, liveStyles } from '../utils/theme'
import { GTYPE, GFW, PageBackdrop, GlossyFill } from './glossy'

// The space shared by Skynkod's Premium features (same look as Rekod): light
// and calm like the rest of the app, deep plum for what is Premium, a close
// button on every screen (Lita, 2026-10-23).
export const P = livePalette({ plum: ['#5E3F56', '#E8D6E1'], warn: ['#C98422', '#E8AA4E'] })

export const tap = () => { Haptics.selectionAsync().catch(() => {}) }

export function PremiumShell({ label, overline, title, subtitle, footer, children, onBack, scroll = true }) {
  const navigation = useNavigation()
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: P.solid || P.bg }}>
      <PageBackdrop />
      <View style={styles.topBar}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={P.text} />
          </Pressable>
        ) : <View style={{ width: 26 }} />}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name="diamond" size={12} color={P.plum} />
          <Text style={[GTYPE.overline, { color: P.plum }]}>{label}</Text>
        </View>
        {/* Always a way out, back to where she came from */}
        <Pressable onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={P.text} />
        </Pressable>
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {overline ? <Text style={[GTYPE.overline, { color: P.primary }]}>{overline}</Text> : null}
          {title ? <Text style={[styles.title, { color: P.text }]}>{title}</Text> : null}
          {subtitle ? <Text style={[GTYPE.body, { color: P.muted, marginTop: 4, lineHeight: 22 }]}>{subtitle}</Text> : null}
          {children}
        </ScrollView>
      ) : <View style={[styles.scroll, { flex: 1 }]}>{children}</View>}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  )
}

export function PButton({ title, onPress, loading, disabled, outline, icon, style }) {
  const fg = outline ? P.primary : P.onPrimary
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" style={({ pressed }) => [
      styles.button, outline ? { borderWidth: 1, borderColor: P.primary } : { backgroundColor: P.primary, overflow: 'hidden' },
      (pressed || disabled) && { opacity: 0.6 }, style,
    ]}>
      {outline ? null : <GlossyFill />}
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon ? <FeatureIcon name={icon} size={17} color={fg} /> : null}
          <Text style={{ color: fg, ...GFW('700'), fontSize: 15 }}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

export const PLoading = ({ label }) => (
  <View style={{ flex: 1, backgroundColor: P.solid || P.bg, alignItems: 'center', justifyContent: 'center', gap: SPACING.md }}>
    <ActivityIndicator color={P.primary} size="large" />
    {label ? <Text style={[GTYPE.caption, { color: P.muted }]}>{label}</Text> : null}
  </View>
)

// Swipeable intro: [{ icon, title, text }].
export function Carousel({ slides }) {
  const [page, setPage] = useState(0)
  const [width, setWidth] = useState(0)
  return (
    <View style={{ flex: 1 }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => { const p = Math.round(e.nativeEvent.contentOffset.x / Math.max(width, 1)); if (p !== page) { tap(); setPage(p) } }}>
        {slides.map(s => (
          <View key={s.title} style={[styles.slide, { width }]}>
            <View style={styles.slideIcon}><FeatureIcon name={s.icon} size={44} color={P.primary} /></View>
            <Text style={[styles.slideTitle, { color: P.text }]}>{s.title}</Text>
            <Text style={[GTYPE.body, { color: P.textSecondary, textAlign: 'center', marginTop: SPACING.md, lineHeight: 22 }]}>{s.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {slides.map((_, i) => <View key={i} style={[styles.dot, { backgroundColor: i === page ? P.primary : P.border, width: i === page ? 20 : 8 }]} />)}
      </View>
    </View>
  )
}

const styles = liveStyles(() => StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl },
  footer: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.md, gap: SPACING.sm },
  title: { ...GFW('700'), letterSpacing: -0.4, fontSize: 30, lineHeight: 36, marginTop: SPACING.xs },
  button: { height: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: SPACING.lg },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  slideIcon: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(226,198,218,0.12)', marginBottom: SPACING.xxl },
  slideTitle: { ...GFW('700'), letterSpacing: -0.4, fontSize: 32, lineHeight: 38, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: SPACING.md },
  dot: { height: 8, borderRadius: 4 },
}))

// "Don't show again" for the intro of a Premium feature, per user.
const introKey = (feature, userId) => `intro_hidden_${feature}_${userId}`
export const isIntroHidden = async (feature, userId) => (await AsyncStorage.getItem(introKey(feature, userId)).catch(() => null)) === '1'
export const hideIntro = (feature, userId) => AsyncStorage.setItem(introKey(feature, userId), '1').catch(() => {})
export const showIntroAgain = (feature, userId) => AsyncStorage.removeItem(introKey(feature, userId)).catch(() => {})
