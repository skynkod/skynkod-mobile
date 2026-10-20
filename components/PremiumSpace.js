import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { SPACING, TYPE } from '../utils/theme'

// The deep plum space shared by Skynkod's Premium features (same look as
// Rekod): full plum screen, a small top label with a diamond, pill buttons.
export const P = {
  bg: '#33202E', card: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.78)', muted: 'rgba(255,255,255,0.55)',
  primary: '#E2C6DA', primarySoft: 'rgba(226,198,218,0.16)', onPrimary: '#33202E',
  success: '#A8E2BC', warn: '#F2B37A',
}

export const tap = () => { Haptics.selectionAsync().catch(() => {}) }

export function PremiumShell({ label, overline, title, subtitle, footer, children, onBack, scroll = true }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: P.bg }}>
      <View style={styles.topBar}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={P.text} />
          </Pressable>
        ) : <View style={{ width: 26 }} />}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name="diamond-outline" size={14} color={P.primary} />
          <Text style={[TYPE.overline, { color: P.primary }]}>{label}</Text>
        </View>
        <View style={{ width: 26 }} />
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {overline ? <Text style={[TYPE.overline, { color: P.primary }]}>{overline}</Text> : null}
          {title ? <Text style={[styles.title, { color: P.text }]}>{title}</Text> : null}
          {subtitle ? <Text style={[TYPE.body, { color: P.muted, marginTop: 4, lineHeight: 22 }]}>{subtitle}</Text> : null}
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
      styles.button, outline ? { borderWidth: 1, borderColor: P.primary } : { backgroundColor: P.primary },
      (pressed || disabled) && { opacity: 0.6 }, style,
    ]}>
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon ? <Ionicons name={icon} size={17} color={fg} /> : null}
          <Text style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

export const PLoading = ({ label }) => (
  <View style={{ flex: 1, backgroundColor: P.bg, alignItems: 'center', justifyContent: 'center', gap: SPACING.md }}>
    <ActivityIndicator color={P.primary} size="large" />
    {label ? <Text style={[TYPE.caption, { color: P.muted }]}>{label}</Text> : null}
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
            <View style={styles.slideIcon}><Ionicons name={s.icon} size={44} color={P.primary} /></View>
            <Text style={[styles.slideTitle, { color: P.text }]}>{s.title}</Text>
            <Text style={[TYPE.body, { color: P.textSecondary, textAlign: 'center', marginTop: SPACING.md, lineHeight: 22 }]}>{s.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {slides.map((_, i) => <View key={i} style={[styles.dot, { backgroundColor: i === page ? P.primary : P.border, width: i === page ? 20 : 8 }]} />)}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl },
  footer: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.md, gap: SPACING.sm },
  title: { fontWeight: '700', letterSpacing: -0.4, fontSize: 30, lineHeight: 36, marginTop: SPACING.xs },
  button: { height: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: SPACING.lg },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  slideIcon: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(226,198,218,0.12)', marginBottom: SPACING.xxl },
  slideTitle: { fontWeight: '700', letterSpacing: -0.4, fontSize: 32, lineHeight: 38, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: SPACING.md },
  dot: { height: 8, borderRadius: 4 },
})
