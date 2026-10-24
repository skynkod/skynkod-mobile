import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// "Should I buy this?" on a product she doesn't own (Lita, 2026-10-24).
const ANSWER = {
  yes: { label: 'Yes', icon: 'checkmark-circle', tone: 'success', soft: 'successSoft' },
  probablyNot: { label: 'Probably not', icon: 'remove-circle', tone: 'warning', soft: 'warningSoft' },
  no: { label: 'No', icon: 'close-circle', tone: 'danger', soft: 'dangerSoft' },
  yourCall: { label: 'Your call', icon: 'help-circle', tone: 'primary', soft: 'primarySoft' },
}

export default function BuyAdvice({ verdict, premium, style }) {
  const colors = useColors()
  const t = useT()
  const navigation = useNavigation()
  if (!verdict) return null
  const a = ANSWER[verdict.answer]
  const locked = !verdict.free && premium === false
  return (
    <View style={[styles.card, { backgroundColor: colors[a.soft] }, style]}>
      <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '800', letterSpacing: 0.6 }]}>{t('SHOULD I BUY THIS?')}</Text>
      <View style={styles.head}>
        <Ionicons name={a.icon} size={26} color={colors[a.tone]} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{t(a.label)}</Text>
      </View>
      {locked ? (
        <Pressable onPress={() => navigation.navigate('Premium')} style={styles.lock} hitSlop={6}>
          <Ionicons name="diamond" size={13} color={colors.primary} />
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('See why with Premium')}</Text>
        </Pressable>
      ) : premium === undefined && !verdict.free ? null : (
        <>
          <Text style={[TYPE.body, { color: colors.text, marginTop: 4, lineHeight: 21 }]}>{t(verdict.text, verdict.params)}</Text>
          {verdict.save ? <Text style={[TYPE.bodyStrong, { color: colors[a.tone], marginTop: 4 }]}>{t('Save your money.')}</Text> : null}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 6 },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm },
})
