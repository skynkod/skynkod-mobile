import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useColors } from './ui'

// Green / grey / orange pill saying how well something suits the user's skin.
export default function MatchBadge({ tone = 'neutral', label, size = 'sm' }) {
  const colors = useColors()
  const palette = {
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    neutral: { bg: colors.surface, fg: colors.textSecondary },
  }[tone] || { bg: colors.surface, fg: colors.textSecondary }
  return (
    <View style={[styles.pill, size === 'lg' && styles.lg, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, size === 'lg' && styles.lgText, { color: palette.fg }]} numberOfLines={1}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  lg: { paddingHorizontal: 14, paddingVertical: 7 },
  text: { fontSize: 11, fontWeight: '700' },
  lgText: { fontSize: 14 },
})
