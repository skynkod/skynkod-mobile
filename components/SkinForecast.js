import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColors } from './ui'
import FeatureIcon from './FeatureIcon'
import WeatherArt, { skyKind, SKY_LABEL } from './WeatherArt'
import { useT, useLanguage } from '../utils/LanguageContext'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// "Your skin forecast" (redesign approved by Lita, 2026-10-23): the weather now
// with its drawing and a small season chip, 3 day tiles (tap one to read it),
// the advice for that day, then what her journal and her Rekod say.
// Without location: the season, and a button to turn local weather on.
export default function SkinForecast({ forecast, now, season, signals = [], onEnableLocation, style }) {
  const colors = useColors()
  const t = useT()
  const { language } = useLanguage()
  const [day, setDay] = useState(forecast?.focus ?? 0)
  useEffect(() => setDay(forecast?.focus ?? 0), [forecast?.focus])

  const seasonChip = season ? (
    <View style={[styles.season, { backgroundColor: colors.primarySoft }]}>
      <Ionicons name={season.icon} size={13} color={colors.primary} />
      <Text style={[styles.seasonText, { color: colors.primary }]}>{t(season.label)}</Text>
    </View>
  ) : null

  if (!forecast) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
        <View style={styles.nowRow}>
          <WeatherArt kind="partly" width={52} />
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('See your local skin weather')}</Text>
            <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>{t('UV, dry air and heat for the next 3 days, with what your skin will need.')}</Text>
          </View>
          {seasonChip}
        </View>
        <Pressable onPress={onEnableLocation} style={[styles.enable, { backgroundColor: colors.primary }]}>
          <Ionicons name="location-outline" size={16} color={colors.onPrimary} />
          <Text style={[TYPE.bodyStrong, { color: colors.onPrimary }]}>{t('Turn on local weather')}</Text>
        </Pressable>
      </View>
    )
  }

  const labelOf = (i, date) => (i === 0 ? t('Today') : i === 1 ? t('Tomorrow')
    : (() => { const s = new Date(`${date}T12:00:00`).toLocaleDateString(language, { weekday: 'long' }); return s.charAt(0).toUpperCase() + s.slice(1) })())
  const tile = forecast.tiles[day]
  const params = { ...(tile.tip.params || {}), when: labelOf(day, tile.date) }
  const nowKind = now ? skyKind(now.code, now.isDay) : skyKind(forecast.tiles[0].code)

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {/* The weather right now, and the season */}
      <View style={styles.nowRow}>
        <WeatherArt kind={nowKind} width={60} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.temp, { color: colors.text }]}>{now ? now.temp : forecast.tiles[0].temp}°</Text>
          <Text style={[TYPE.caption, { color: colors.primary }]} numberOfLines={1}>
            {[t(SKY_LABEL[nowKind]), now ? `UV ${now.uv}` : null, now ? t('Air {n}%', { n: now.humidity }) : null].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {seasonChip}
      </View>

      <View style={styles.tiles}>
        {forecast.tiles.map((d, i) => {
          const on = i === day
          return (
            <Pressable key={d.date} onPress={() => setDay(i)} accessibilityLabel={labelOf(i, d.date)}
              style={[styles.tile, { backgroundColor: on ? colors.primary : colors.primarySoft }]}>
              <Text style={[styles.tileDay, { color: on ? colors.onPrimary : colors.primary }]} numberOfLines={1}>{labelOf(i, d.date)}</Text>
              <WeatherArt kind={skyKind(d.code)} width={36} />
              <Text style={[styles.tileShort, { color: on ? colors.onPrimary : colors.primary }]} numberOfLines={1}>
                {d.tip.short.includes('°') ? t(d.tip.short, d.tip.params) : `${d.temp}° · ${t(d.tip.short, d.tip.params)}`}
              </Text>
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
  nowRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  temp: { fontSize: 26, fontWeight: '600', letterSpacing: -0.5 },
  season: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  seasonText: { fontSize: 12, fontWeight: '600' },
  tiles: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  tile: { flex: 1, alignItems: 'center', gap: 2, borderRadius: RADIUS.md, paddingVertical: SPACING.sm },
  tileDay: { fontSize: 12, fontWeight: '600' },
  tileShort: { fontSize: 11 },
  enable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderRadius: 999, height: 44, marginTop: SPACING.md },
  signals: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: SPACING.md, paddingTop: SPACING.md, gap: SPACING.sm },
  signal: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
})
