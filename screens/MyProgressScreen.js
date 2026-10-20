import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path, Circle, Line } from 'react-native-svg'
import { Screen, Card, useColors } from '../components/ui'
import { useAuth } from '../utils/AuthContext'
import { useLanguage } from '../utils/LanguageContext'
import { getProgress, moodLabel } from '../utils/progress'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const TREND = {
  better: 'Your skin is doing better than last month 🌸',
  steady: 'Your skin is steady: keep going.',
  harder: 'A harder couple of weeks, that’s normal. Keep your routine gentle.',
  start: 'Your first weeks: keep checking in to see your trend.',
}
const LEVEL = { none: 'None', light: 'Light', visible: 'Visible' }

// My progress: the reward for the daily effort. Mood over 4 weeks, routine
// regularity, the problems that come back, and Dekod if she scans.
export default function MyProgressScreen({ navigation }) {
  const colors = useColors()
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [data, setData] = useState(null)

  useFocusEffect(useCallback(() => {
    if (!user?.id) return
    getProgress(user.id).then(setData).catch(error => { logError('Progress_load', error, {}, 'warn'); setData({ hasData: false, weeks: [], calendar: [], concerns: [] }) })
  }, [user?.id]))

  if (!data) return <Screen back title={t('My progress')}><ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.xxl }} /></Screen>

  // Mood curve: 4 weekly points, 1 (terrible) to 5 (great).
  const W = 300, H = 120, PAD = 14
  const pts = data.weeks.map((w, i) => (w.mood === null ? null : { x: PAD + (i * (W - 2 * PAD)) / 3, y: PAD + ((5 - w.mood) / 4) * (H - 2 * PAD) }))
  const real = pts.filter(Boolean)
  const path = real.map((p, i) => {
    if (!i) return `M${p.x},${p.y}`
    const prev = real[i - 1]
    const cx = (prev.x + p.x) / 2
    return `C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`
  }).join(' ')

  return (
    <Screen back title={t('My progress')} subtitle={t('Your last 4 weeks')}>
      {!data.hasData ? (
        <Card style={{ marginTop: SPACING.md }}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Your progress starts here')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
            {t('Tick your routines and tell your journal how your skin feels: your progress will show here after a few days.')}
          </Text>
        </Card>
      ) : null}

      {/* 1 · Skin mood */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('YOUR SKIN MOOD')}</Text>
      <Card>
        {data.moodTrend ? <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(TREND[data.moodTrend])}</Text> : <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('No check-ins yet.')}</Text>}
        <View style={{ marginTop: SPACING.md, alignItems: 'center' }}>
          <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            {[1, 3, 5].map(v => <Line key={v} x1={PAD} x2={W - PAD} y1={PAD + ((5 - v) / 4) * (H - 2 * PAD)} y2={PAD + ((5 - v) / 4) * (H - 2 * PAD)} stroke={colors.border} strokeWidth={1} />)}
            {real.length > 1 ? <Path d={path} stroke={colors.primary} strokeWidth={3} fill="none" strokeLinecap="round" /> : null}
            {real.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={5} fill={colors.card} stroke={colors.primary} strokeWidth={2.5} />)}
          </Svg>
          <View style={styles.weekLabels}>
            {data.weeks.map((w, i) => (
              <Text key={i} style={[TYPE.caption, { color: colors.muted, fontSize: 11 }]}>
                {i === 3 ? t('This week') : new Date(w.from).toLocaleDateString(language, { day: 'numeric', month: 'short' })}
                {w.mood !== null ? `\n${t(moodLabel(w.mood))}` : ''}
              </Text>
            ))}
          </View>
        </View>
      </Card>

      {/* 2 · Regularity */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('YOUR ROUTINES')}</Text>
      <Card>
        <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('{n} routines done in 4 weeks', { n: data.routinesDone })}</Text>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t('Full dot: morning and evening · half: one of them')}</Text>
        <View style={styles.grid}>
          {data.calendar.map(d => {
            const both = d.morning && d.evening
            const one = d.morning !== d.evening
            return (
              <View key={d.date} style={[styles.dot, { borderColor: colors.primary, backgroundColor: both ? colors.primary : 'transparent' }]}>
                {one ? <View style={[styles.half, { backgroundColor: colors.primary }]} /> : null}
              </View>
            )
          })}
        </View>
      </Card>

      {/* 3 · Problems that come back */}
      {data.concerns.length ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('YOUR SKIN CONCERNS')}</Text>
          <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
            {data.concerns.map((c, i) => {
              const better = c.now < c.before
              const worse = c.now > c.before
              return (
                <View key={c.tag} style={[styles.row, i < data.concerns.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                  <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(c.tag)}</Text>
                  <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('{n} times', { n: c.now })}</Text>
                  {better || worse ? <Ionicons name={better ? 'arrow-down' : 'arrow-up'} size={16} color={better ? colors.success : colors.warning} /> : <View style={{ width: 16 }} />}
                </View>
              )
            })}
          </Card>
          <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>{t('Compared with the 4 weeks before.')}</Text>
        </>
      ) : null}

      {/* 4 · Dekod, if she scans */}
      {data.dekod ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>DEKOD</Text>
          <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
            {data.dekod.rows.map((r, i) => (
              <View key={r.key} style={[styles.row, i < data.dekod.rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(r.label)}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: r.trend === 'better' ? colors.success : r.trend === 'worse' ? colors.warning : colors.muted }}>
                  {t(LEVEL[r.from])} → {t(LEVEL[r.to])}
                </Text>
              </View>
            ))}
          </Card>
          <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>
            {t('From {from} to {to}', { from: new Date(data.dekod.from).toLocaleDateString(language, { day: 'numeric', month: 'short' }), to: new Date(data.dekod.to).toLocaleDateString(language, { day: 'numeric', month: 'short' }) })}
          </Text>
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginTop: SPACING.xxl, marginBottom: SPACING.sm },
  weekLabels: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING.md },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, overflow: 'hidden' },
  half: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
})
