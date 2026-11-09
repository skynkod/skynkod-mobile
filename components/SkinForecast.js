import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColors } from './ui'
import FeatureIcon from './FeatureIcon'
import { skyKind, SKY_LABEL } from './WeatherArt'
import { GlossyIcon } from './FeatureIcon'
import { useT } from '../utils/LanguageContext'
import { SPACING, RADIUS } from '../utils/theme'
import { GTYPE, GFW, glassCard, GlossyFill } from './glossy'

// "Your skin forecast" (Lita, 2026-10-24: "just today is enough"): the weather
// now with its drawing and a small season chip, today's advice, and the one
// thing her journal or her Rekod says.
// Without location: the season, and a button to turn local weather on.
export default function SkinForecast({ forecast, now, season, signals = [], onEnableLocation, style }) {
  const colors = useColors()
  const t = useT()

  const seasonChip = season ? (
    <View style={[styles.season, { backgroundColor: colors.primarySoft }]}>
      <FeatureIcon name={season.icon} size={13} color={colors.primary} />
      <Text style={[styles.seasonText, { color: colors.primary }]}>{t(season.label)}</Text>
    </View>
  ) : null

  if (!forecast) {
    return (
      <View style={[styles.card, { ...glassCard(colors), borderColor: colors.border }, style]}>
        <View style={styles.nowRow}>
          <GlossyIcon name="forecast" size={44} />
          <View style={{ flex: 1 }}>
            <Text style={[GTYPE.bodyStrong, { color: colors.text }]}>{t('See your local skin weather')}</Text>
            <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>{t('UV, dry air and heat today, with what your skin will need.')}</Text>
          </View>
          {seasonChip}
        </View>
        <Pressable onPress={onEnableLocation} style={[styles.enable, { backgroundColor: colors.primary, overflow: 'hidden' }]}><GlossyFill />
          <Ionicons name="location-outline" size={16} color={colors.onPrimary} />
          <Text style={[GTYPE.bodyStrong, { color: colors.onPrimary }]}>{t('Turn on local weather')}</Text>
        </Pressable>
      </View>
    )
  }

  const tile = forecast.tiles[0]
  const params = { ...(tile.tip.params || {}), when: t('Today') }
  const nowKind = now ? skyKind(now.code, now.isDay) : skyKind(forecast.tiles[0].code)

  return (
    <View style={[styles.card, { ...glassCard(colors), borderColor: colors.border }, style]}>
      {/* The weather right now, and the season */}
      <View style={styles.nowRow}>
        {/* The skin weather's own glossy icon, whatever the sky (Lita, 2026-11-06); the sky is in the words. */}
        <GlossyIcon name="forecast" size={50} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.temp, { color: colors.text }]}>{now ? now.temp : forecast.tiles[0].temp}°</Text>
          <Text style={[GTYPE.caption, { color: colors.primary }]} numberOfLines={1}>
            {[t(SKY_LABEL[nowKind]), now ? `UV ${now.uv}` : null, now ? t('Air {n}%', { n: now.humidity }) : null].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {seasonChip}
      </View>

      <Text style={[GTYPE.bodyStrong, { color: colors.text, marginTop: SPACING.md }]}>{t(tile.tip.head, params)}</Text>
      <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 19 }]}>{t(tile.tip.advice, params)}</Text>
      {signals.length ? (
        <View style={[styles.signals, { borderTopColor: colors.border }]}>
          {signals.slice(0, 1).map((s, i) => (
            <View key={i} style={styles.signal}>
              <FeatureIcon name={s.icon} size={16} color={colors.primary} style={{ marginTop: 1 }} />
              <Text style={[GTYPE.caption, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>{t(s.text, Object.fromEntries(Object.entries(s.params || {}).map(([k, v]) => [k, typeof v === 'string' ? t(v) : v])))}</Text>
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
  temp: { fontSize: 26, ...GFW('600'), letterSpacing: -0.5 },
  season: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  seasonText: { fontSize: 12, ...GFW('600') },
  enable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderRadius: 999, height: 44, marginTop: SPACING.md },
  signals: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: SPACING.md, paddingTop: SPACING.md, gap: SPACING.sm },
  signal: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
})
