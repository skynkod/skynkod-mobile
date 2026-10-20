import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Animated, Modal, Easing } from 'react-native'
import Svg, { Defs, RadialGradient, Stop, Circle, Path, G } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import { onJourneyNews } from '../utils/journey'
import { useLanguage } from '../utils/LanguageContext'
import { BadgeImage, LevelEmblem, TierPill } from './Badge'

// "New badge!": a dark, glowing screen the moment a badge is earned (one
// after another if several), and a short note when a level is reached.
export default function JourneyToast({ onOpen }) {
  const { t } = useLanguage()
  const [queue, setQueue] = useState([])
  const [level, setLevel] = useState(null)
  const pop = useRef(new Animated.Value(0)).current
  const spin = useRef(new Animated.Value(0)).current
  const reveal = useRef(new Animated.Value(0)).current

  useEffect(() => onJourneyNews(n => {
    if (n.badges.length) setQueue(q => [...q, ...n.badges])
    if (n.levelUp) setLevel(n.levelUp)
  }), [])

  const current = queue[0] || null
  useEffect(() => {
    if (!current) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    if (current.tier === 'legendary' || current.tier === 'epic') setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 380)
    // The silhouette appears, then turns into the real art.
    pop.setValue(0)
    reveal.setValue(0)
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }),
      Animated.delay(450),
      Animated.timing(reveal, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start()
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 1000)
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true }))
    loop.start()
    return () => loop.stop()
  }, [current?.id])

  const next = () => setQueue(q => q.slice(1))
  const seeAll = () => { setQueue([]); setLevel(null); onOpen?.() }

  if (current) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={next}>
        <View style={styles.back}>
          {/* Glow and sparkles behind the badge */}
          <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[styles.glow, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]} pointerEvents="none">
            <Svg width={360} height={360} viewBox="0 0 360 360">
              <Defs>
                <RadialGradient id="g" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#F6D9FF" stopOpacity="0.75" />
                  <Stop offset="0.35" stopColor="#B07CD8" stopOpacity="0.35" />
                  <Stop offset="1" stopColor="#1E141D" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx="180" cy="180" r="180" fill="url(#g)" />
              <G fill="#F3D9A0">
                {[[60, 70, 1], [300, 90, 0.8], [40, 250, 0.7], [310, 270, 1], [180, 24, 0.6], [110, 320, 0.8], [250, 330, 0.6]].map(([x, y, k], i) => (
                  <Path key={i} d={`M${x} ${y - 7 * k} L${x + 2 * k} ${y - 2 * k} L${x + 7 * k} ${y} L${x + 2 * k} ${y + 2 * k} L${x} ${y + 7 * k} L${x - 2 * k} ${y + 2 * k} L${x - 7 * k} ${y} L${x - 2 * k} ${y - 2 * k}z`} />
                ))}
              </G>
            </Svg>
          </Animated.View>
            <Animated.View style={{ alignItems: 'center', opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }}>
              <Animated.View style={{ opacity: reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }}>
                <BadgeImage badge={current} size={200} locked />
              </Animated.View>
              <Animated.View style={{ position: 'absolute', opacity: reveal, transform: [{ scale: reveal.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.85, 1.08, 1] }) }] }}>
                <BadgeImage badge={current} size={200} />
              </Animated.View>
            </Animated.View>
          </View>
          <Text style={styles.title}>{t('New badge!')}</Text>
          <TierPill tier={current.tier} style={{ marginTop: 10 }} />
          <Text style={styles.name}>{t(current.name)}</Text>
          <Text style={styles.text}>{t(current.description)}</Text>
          <Text style={styles.koda}>“{t(current.koda)}” · Koda</Text>
          <Pressable onPress={next} style={styles.button} accessibilityRole="button">
            <Text style={styles.buttonText}>{t('Continue')}</Text>
          </Pressable>
          <Pressable onPress={seeAll} hitSlop={10} accessibilityRole="button">
            <Text style={styles.link}>{t('See all my badges')}</Text>
          </Pressable>
          {queue.length > 1 ? <Text style={styles.more}>{t('{n} more', { n: queue.length - 1 })}</Text> : null}
        </View>
      </Modal>
    )
  }

  if (level) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setLevel(null)}>
        <View style={styles.back}>
          <Text style={styles.kicker}>{t(level.tier.name).toUpperCase()}</Text>
          <View style={{ marginTop: 18 }}><LevelEmblem level={level.level} size={210} /></View>
          <Text style={styles.title}>{t('New level!')}</Text>
          <Text style={styles.name}>{t('Level {n}', { n: level.level })} · {t(level.name)}</Text>
          <Text style={styles.text}>{t(level.description)}</Text>
          <Pressable onPress={() => setLevel(null)} style={styles.button} accessibilityRole="button">
            <Text style={styles.buttonText}>{t('Continue')}</Text>
          </Pressable>
          <Pressable onPress={seeAll} hitSlop={10} accessibilityRole="button">
            <Text style={styles.link}>{t('See my journey')}</Text>
          </Pressable>
        </View>
      </Modal>
    )
  }
  return null
}

const styles = StyleSheet.create({
  back: { flex: 1, backgroundColor: '#1E141D', alignItems: 'center', justifyContent: 'center', padding: 28 },
  glow: { position: 'absolute', left: -80, top: -80 },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '600', marginTop: 18, textAlign: 'center' },
  kicker: { color: '#E9CF9A', fontSize: 12, letterSpacing: 2.4, fontWeight: '600' },
  name: { color: '#F6EEF2', fontSize: 18, fontWeight: '600', marginTop: 12 },
  text: { color: '#CDBCC8', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6, maxWidth: 300 },
  koda: { color: '#B9A6B4', fontSize: 13, fontStyle: 'italic', lineHeight: 19, textAlign: 'center', marginTop: 12, maxWidth: 300 },
  button: { marginTop: 28, alignSelf: 'stretch', maxWidth: 320, width: '100%', backgroundColor: '#E7D2F0', borderRadius: 999, paddingVertical: 15, alignItems: 'center' },
  buttonText: { color: '#3B2140', fontSize: 16, fontWeight: '600' },
  link: { color: '#E7D2F0', fontSize: 14, marginTop: 18, textDecorationLine: 'underline' },
  more: { color: '#8F7D8B', fontSize: 12, marginTop: 10 },
})
