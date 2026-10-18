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
  const icon = match.tone === 'warning' ? 'alert-circle' : match.tone === 'success' ? 'checkmark-circle' : 'ellipse-outline'
  const tint = match.tone === 'warning' ? colors.warning : match.tone === 'success' ? colors.success : colors.muted
  return (
    <View style={styles.wrap}>
      <MatchBadge tone={match.tone} label={`${match.score}% · ${t(match.label)}`} />
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
