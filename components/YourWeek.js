import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card, useColors } from './ui'
import FeatureIcon from './FeatureIcon'
import { useT } from '../utils/LanguageContext'
import { WEEK_LABELS } from '../utils/week-audit'
import { SPACING } from '../utils/theme'
import { GTYPE, GFW } from './glossy'

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const ICON = { retinoid: 'rekod', exfoliation: 'sparkles-outline', both: 'alert-circle-outline', recovery: 'leaf-outline' }

// "Your week": each evening at a glance, and what adds up too much.
export default function YourWeek({ audit, style }) {
  const colors = useColors()
  const t = useT()
  if (!audit) return null
  const todayIdx = (new Date().getDay() + 6) % 7
  return (
    <Card style={style}>
      <Text style={[GTYPE.overline, { color: colors.primary }]}>{t('YOUR WEEK')}</Text>
      <View style={styles.row}>
        {audit.week.map((d, i) => {
          const strong = d.kind !== 'recovery'
          const bg = d.kind === 'both' ? colors.warning : strong ? colors.primary : colors.primarySoft
          return (
            <View key={i} style={styles.col}>
              <Text style={[GTYPE.caption, { color: i === todayIdx ? colors.text : colors.muted, ...GFW(i === todayIdx ? '700' : '500'), fontSize: 11 }]}>{t(LETTERS[i])}</Text>
              <View style={[styles.dot, { backgroundColor: bg, borderWidth: i === todayIdx ? 2 : 0, borderColor: colors.text }]}>
                <FeatureIcon name={ICON[d.kind]} size={14} color={strong ? colors.onPrimary : colors.primary} focused={d.kind === 'retinoid'} />
              </View>
            </View>
          )
        })}
      </View>
      <View style={styles.legend}>
        {['retinoid', 'exfoliation', 'recovery'].map(k => (
          <Text key={k} style={[GTYPE.caption, { color: colors.muted, fontSize: 11 }]}>
            {k === 'recovery' ? '○' : '●'} {t(WEEK_LABELS[k])}
          </Text>
        ))}
      </View>
      {audit.notes.map((n, i) => (
        <View key={i} style={styles.note}>
          <FeatureIcon name={n.level === 'warning' ? 'alert-circle-outline' : 'information-circle-outline'} size={16} color={n.level === 'warning' ? colors.warning : colors.primary} style={{ marginTop: 1 }} />
          <Text style={[GTYPE.caption, { color: colors.text, flex: 1, lineHeight: 18 }]}>{t(n.text, n.params)}{n.products ? ` (${n.products.join(', ')})` : ''}</Text>
        </View>
      ))}
      {audit.balanced ? (
        <View style={styles.note}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} style={{ marginTop: 1 }} />
          <Text style={[GTYPE.caption, { color: colors.text, flex: 1, lineHeight: 18 }]}>
            {t('A balanced week: {r} retinoid evenings, {e} exfoliations and {x} recovery evenings.', { r: audit.retinoidNights, e: audit.exfoliations, x: audit.recoveryNights })}
          </Text>
        </View>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  col: { alignItems: 'center', gap: 6 },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm, flexWrap: 'wrap' },
  note: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start', marginTop: SPACING.md },
})
