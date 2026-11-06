import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { isPremiumUser } from '../utils/premium'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useColors } from './ui'
import { SPACING, RADIUS } from '../utils/theme'
import { GTYPE, GFW, glassCard } from './glossy'

const PLUM = '#5E3F56'

// Premium or not, read again each time the screen shows (the team's Free /
// Premium switch applies at once). undefined while loading.
export const usePremium = () => {
  const { user } = useAuth()
  const [premium, setPremium] = useState(undefined)
  useFocusEffect(useCallback(() => {
    if (user?.id) isPremiumUser(user.id).then(setPremium).catch(() => setPremium(false))
  }, [user?.id]))
  return premium
}

// The button that opens the Premium page, with the diamond.
export function UnlockButton({ label, style }) {
  const t = useT()
  const navigation = useNavigation()
  return (
    <Pressable onPress={() => navigation.navigate('Premium')} accessibilityRole="button"
      style={({ pressed }) => [styles.unlock, { opacity: pressed ? 0.85 : 1 }, style]}>
      <Ionicons name="diamond" size={14} color="#C5A8BB" />
      <Text style={styles.unlockText}>{t(label || 'Unlock with Premium')}</Text>
    </Pressable>
  )
}

// Shows the content blurred behind a soft Premium card: she sees there is
// something for her, and one tap explains Premium. Never used for safety info.
export function PremiumBlur({ locked, title, text, children, style }) {
  const colors = useColors()
  const t = useT()
  if (!locked) return children
  return (
    <View style={[styles.wrap, { borderColor: colors.border }, style]}>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{children}</View>
      <BlurView intensity={36} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.overlay}>
        <View style={[styles.card, { ...glassCard(colors) }]}>
          <Ionicons name="diamond" size={18} color={PLUM} />
          {title ? <Text style={[GTYPE.bodyStrong, { color: colors.text, textAlign: 'center', marginTop: SPACING.xs }]}>{t(title)}</Text> : null}
          {text ? <Text style={[GTYPE.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 18 }]}>{t(text)}</Text> : null}
          <UnlockButton style={{ marginTop: SPACING.md }} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderRadius: RADIUS.lg, overflow: 'hidden', minHeight: 170 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  card: { alignItems: 'center', borderRadius: RADIUS.lg, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.lg, maxWidth: 300, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  unlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PLUM, borderRadius: 999, paddingVertical: 11, paddingHorizontal: SPACING.lg },
  unlockText: { color: '#FFFFFF', ...GFW('700'), fontSize: 14 },
})
