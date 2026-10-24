import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Animated, Alert, Linking } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import Svg, { Path, Defs, ClipPath, Rect, Circle } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Card, useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { getWaterToday, setWaterToday, waterGoal, WATER_SOURCE } from '../utils/water'
import { logError } from '../utils/errorLogger'
import { SPACING, TYPE } from '../utils/theme'

// The water glass on Home (Lita, 2026-10-24): one tap, one glass. It fills up
// towards the day's goal (8 glasses, 10 when it's hot).
const AnimatedRect = Animated.createAnimatedComponent(Rect)
const H = 64
const GLASS = 'M6 4 H40 L35 60 Q34.5 63 31.5 63 H14.5 Q11.5 63 11 60 Z'

export default function WaterGlass({ userId, tempMax, style }) {
  const colors = useColors()
  const t = useT()
  const [glasses, setGlasses] = useState(null)
  const goal = waterGoal(tempMax)
  const fill = useRef(new Animated.Value(0)).current

  useFocusEffect(useCallback(() => {
    if (userId) getWaterToday(userId).then(setGlasses).catch(() => setGlasses(0))
  }, [userId]))
  useEffect(() => {
    Animated.spring(fill, { toValue: Math.min(1, (glasses || 0) / goal), useNativeDriver: false, friction: 7 }).start()
  }, [glasses, goal])

  const change = async (delta) => {
    const next = Math.max(0, (glasses || 0) + delta)
    setGlasses(next)
    if (delta > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    try { await setWaterToday(userId, next) } catch (error) { logError('Water_save', error, {}, 'warn') }
  }
  const why = () => Alert.alert(
    t('Water and your skin'),
    t('Drinking enough helps your skin stay hydrated, most of all if you usually drink little. It isn’t a miracle cure: your moisturizer does the rest. Your journal will show whether your skin is better on days you drink enough.'),
    [{ text: t('Source') , onPress: () => Linking.openURL(WATER_SOURCE.url) }, { text: 'OK', style: 'cancel' }]
  )

  if (glasses === null) return null
  const done = glasses >= goal
  const y = fill.interpolate({ inputRange: [0, 1], outputRange: [H, 4] })
  return (
    <Card style={[styles.card, style]}>
      <Pressable onPress={() => change(1)} accessibilityRole="button" accessibilityLabel={t('Add a glass of water')} hitSlop={6}>
        <Svg width={46} height={H + 2} viewBox={`0 0 46 ${H + 2}`}>
          <Defs><ClipPath id="glass"><Path d={GLASS} /></ClipPath></Defs>
          <AnimatedRect x="0" y={y} width="46" height={H} fill="#8EC5E8" opacity={0.85} clipPath="url(#glass)" />
          {done ? <Circle cx="23" cy="34" r="3" fill="#FFFFFF" opacity={0.7} /> : null}
          <Path d={GLASS} fill="none" stroke={colors.primary} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('{n} of {goal} glasses', { n: glasses, goal })}</Text>
          <Pressable onPress={why} hitSlop={8} accessibilityLabel={t('Why water?')}><Ionicons name="information-circle-outline" size={16} color={colors.muted} /></Pressable>
        </View>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {done ? t('Goal reached, well done 💧') : goal > 8 ? t('Hot day: aim for {goal} glasses.', { goal }) : t('Tap the glass for each glass you drink.')}
        </Text>
      </View>
      {glasses > 0 ? (
        <Pressable onPress={() => change(-1)} hitSlop={8} accessibilityLabel={t('Remove a glass')} style={[styles.small, { borderColor: colors.border }]}>
          <Ionicons name="remove" size={16} color={colors.muted} />
        </Pressable>
      ) : null}
      <Pressable onPress={() => change(1)} hitSlop={8} accessibilityLabel={t('Add a glass of water')} style={[styles.add, { backgroundColor: colors.primary }]}>
        <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>+1</Text>
      </Pressable>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  small: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  add: { height: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
})
