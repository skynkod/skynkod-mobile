import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColors } from './ui'
import MatchBadge from './MatchBadge'
import { useT } from '../utils/LanguageContext'
import { productMatch, matchReason } from '../utils/ingredients-guide'
import { TYPE } from '../utils/theme'

// "Does this suit me?" for a product: badge plus the main reason, from the
// user's skin type and concerns.
export default function ProductVerdict({ product, profile }) {
  const colors = useColors()
  const t = useT()
  const match = productMatch(product, profile)
  // Her current skin state can say "not right now" for a product that suits her.
  const tone = match.notNow && match.tone !== 'danger' ? 'warning' : match.tone
  const icon = match.notNow && match.tone !== 'danger' ? 'time-outline' : { danger: 'close-circle', warning: 'flask', watch: 'eye-outline', success: 'checkmark-circle' }[tone] || 'help-circle-outline'
  const tint = { danger: colors.danger, warning: colors.warning, watch: colors.caution, success: colors.success }[tone] || colors.muted
  return (
    <View style={styles.wrap}>
      <MatchBadge tone={tone} label={match.notNow && match.tone !== 'danger' ? t('Not right now') : match.tone === 'success' ? `${match.score}% · ${t(match.label)}` : t(match.label)} />
      <View style={styles.reason}>
        <Ionicons name={icon} size={13} color={tint} style={{ marginTop: 1 }} />
        <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1 }]} numberOfLines={2}>{t(matchReason(match, profile))}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4, gap: 4 },
  reason: { flexDirection: 'row', gap: 5, alignItems: 'flex-start' },
})
