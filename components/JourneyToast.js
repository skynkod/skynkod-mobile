import React, { useEffect, useRef, useState } from 'react'
import { Text, Pressable, StyleSheet, Animated, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { onJourneyNews } from '../utils/journey'
import { useLanguage } from '../utils/LanguageContext'

// A small, elegant notice when a badge is earned or a level is reached.
// The badge itself stays a surprise until the Koda box on Monday.
export default function JourneyToast({ onOpen }) {
  const { t } = useLanguage()
  const insets = useSafeAreaInsets()
  const [news, setNews] = useState(null)
  const y = useRef(new Animated.Value(-160)).current
  const timer = useRef(null)

  useEffect(() => onJourneyNews(n => {
    setNews(n)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    Animated.spring(y, { toValue: 0, friction: 8, useNativeDriver: true }).start()
    clearTimeout(timer.current)
    timer.current = setTimeout(hide, 5000)
  }), [])

  const hide = () => Animated.timing(y, { toValue: -160, duration: 260, useNativeDriver: true }).start(() => setNews(null))

  if (!news) return null
  const count = news.badges.length
  const title = count
    ? (count > 1 ? t('{n} new badges earned ✨', { n: count }) : t('New badge earned ✨'))
    : t('Level {n} · {name}', { n: news.levelUp.level, name: t(news.levelUp.name) })
  const sub = count ? t('It’s waiting in your Koda box on Monday.') : t('Your skin journey goes on.')

  return (
    <Animated.View style={[styles.wrap, { top: insets.top + 8, transform: [{ translateY: y }] }]} pointerEvents="box-none">
      <Pressable onPress={() => { hide(); onOpen?.() }} style={styles.toast} accessibilityRole="button">
        <View style={styles.icon}><Ionicons name={count ? 'gift-outline' : 'trending-up'} size={20} color="#E9CF9A" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#BFA9B7" />
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 50 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#24131F', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(233,207,154,0.35)', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3D1B2E', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#F6EEF2', fontSize: 15, fontWeight: '600' },
  sub: { color: '#BFA9B7', fontSize: 12, marginTop: 2 },
})
