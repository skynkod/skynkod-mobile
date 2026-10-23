import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColors } from './ui'
import FeatureIcon from './FeatureIcon'
import { useT, useLanguage } from '../utils/LanguageContext'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// "Your skin forecast": 3 day tiles (tap one to read it), the advice for that
// day, then what her journal and her Rekod say is coming.
export default function SkinForecast({ forecast, signals = [], style }) {
  const colors = useColors()
  const t = useT()
  const { language } = useLanguage()
  const [day, setDay] = useState(forecast.focus)
  useEffect(() => setDay(forecast.focus), [forecast.focus])

  const labelOf = (i, date) => (i === 0 ? t('Today') : i === 1 ? t('Tomorrow')
    : (() => { const s = new Date(`${date}T12:00:00`).toLocaleDateString(language, { weekday: 'long' }); return s.charAt(0).toUpperCase() + s.slice(1) })())
  const tile = forecast.tiles[day]
  const params = { ...(tile.tip.params || {}), when: labelOf(day, tile.date) }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <View style={styles.tiles}>
        {forecast.tiles.map((d, i) => {
          const on = i === day
          return (
            <Pressable key={d.date} onPress={() => setDay(i)} accessibilityLabel={labelOf(i, d.date)}
              style={[styles.tile, { backgroundColor: on ? colors.primary : colors.primarySoft }]}>
              <Text style={[styles.tileDay, { color: on ? colors.onPrimary : colors.primary }]} numberOfLines={1}>{labelOf(i, d.date)}</Text>
              <Ionicons name={d.tip.icon} size={20} color={on ? colors.onPrimary : colors.primary} />
              <Text style={[styles.tileShort, { color: on ? colors.onPrimary : colors.primary }]} numberOfLines={1}>{t(d.tip.short, d.tip.params)}</Text>
            </Pressable>
          )
        })}
      </View>
      <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.md }]}>{t(tile.tip.head, params)}</Text>
      <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 19 }]}>{t(tile.tip.advice, params)}</Text>
      {signals.length ? (
        <View style={[styles.signals, { borderTopColor: colors.border }]}>
          {signals.map((s, i) => (
            <View key={i} style={styles.signal}>
              <FeatureIcon name={s.icon} size={16} color={colors.primary} style={{ marginTop: 1 }} />
              <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>{t(s.text, Object.fromEntries(Object.entries(s.params || {}).map(([k, v]) => [k, typeof v === 'string' ? t(v) : v])))}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.lg, padding: SPACING.lg },
  tiles: { flexDirection: 'row', gap: SPACING.sm },
  tile: { flex: 1, alignItems: 'center', gap: 4, borderRadius: RADIUS.md, paddingVertical: SPACING.sm },
  tileDay: { fontSize: 12, fontWeight: '600' },
  tileShort: { fontSize: 11 },
  signals: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: SPACING.md, paddingTop: SPACING.md, gap: SPACING.sm },
  signal: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
})
