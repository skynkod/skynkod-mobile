import React from 'react'
import { Text, Pressable, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useColors } from './ui'
import FeatureIcon from './FeatureIcon'
import { useT } from '../utils/LanguageContext'
import { SPACING } from '../utils/theme'
import { usePremium } from './PremiumLock'

// "Ask Koda" where the question comes up (Lita, 2026-10-24), with the question
// already written from what she's looking at.
export default function AskKodaLink({ label, prefill, returnTo, pill = false, style }) {
  const colors = useColors()
  const t = useT()
  const navigation = useNavigation()
  // Without Premium, Koda answers 3 questions a week: said before the tap (full audit, 2026-10-25).
  const premium = usePremium()
  return (
    <Pressable onPress={() => navigation.navigate('Koda', { prefill, returnTo })} hitSlop={6} accessibilityRole="button"
      style={({ pressed }) => [styles.link, pill && [styles.pill, { borderColor: colors.border }], { opacity: pressed ? 0.7 : 1 }, style]}>
      <FeatureIcon name="koda" size={pill ? 16 : 13} color={colors.primary} />
      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: pill ? 14 : 12 }}>{t(label)}</Text>
      {premium === false ? <Text style={{ color: colors.muted, fontSize: pill ? 12 : 11 }}>· {t('3 free a week')}</Text> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  pill: { alignSelf: 'stretch', justifyContent: 'center', borderWidth: 1, borderRadius: 999, height: 44, marginTop: SPACING.lg },
})
