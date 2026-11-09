import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Card, useColors } from '../components/ui'
import { PremiumBlur, usePremium } from '../components/PremiumLock'
import AskKodaLink from '../components/AskKodaLink'
import ProgressTabs from '../components/ProgressTabs'
import { useAuth } from '../utils/AuthContext'
import { useLanguage } from '../utils/LanguageContext'
import { getSkinTimeline } from '../utils/skin-timeline'
import { logError } from '../utils/errorLogger'
import { SPACING } from '../utils/theme'
import { GTYPE, GFW, glassCard } from '../components/glossy'
import FeatureIcon from '../components/FeatureIcon'

// The Skin Timeline (Lita, 2026-10-24): her skin story, newest first, built
// from what she already does. The timeline is free; the summary on top
// (what worked, what didn't) is Premium.
const KIND = {
  baseline: { icon: 'flag-outline', color: 'primary' },
  started: { icon: 'flask-outline', color: 'primary' },
  stopped: { icon: 'pause-circle-outline', color: 'muted' },
  checkin: { icon: 'pulse-outline', color: 'primary' },
  scan: { icon: 'scan-circle-outline', color: 'primary' },
  'verdict-better': { icon: 'thumbs-up-outline', color: 'success' },
  'verdict-same': { icon: 'remove-outline', color: 'muted' },
  'verdict-worse': { icon: 'thumbs-down-outline', color: 'warning' },
  season: { icon: 'leaf-outline', color: 'primary' },
  rekod: { icon: 'rekod', color: 'primary' },
  better: { icon: 'trending-down', color: 'success' },
  worse: { icon: 'trending-up', color: 'warning' },
}

export default function SkinTimelineScreen() {
  const colors = useColors()
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const premium = usePremium()
  const [data, setData] = useState(null)

  useFocusEffect(useCallback(() => {
    if (!user?.id) return
    getSkinTimeline(user.id).then(setData).catch(error => { logError('Timeline_load', error, {}, 'warn'); setData({ timeline: [], summary: null }) })
  }, [user?.id]))

  if (!data) return <Screen back title={t('My progress')}><ProgressTabs current="SkinTimeline" /><ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.xxl }} /></Screen>
  const fmt = d => new Date(d).toLocaleDateString(language, { day: 'numeric', month: 'short' }).toUpperCase()
  const s = data.summary
  const Line = ({ icon, color, title, list }) => (
    <View style={styles.sumRow}>
      <FeatureIcon name={icon} size={16} color={color} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={[GTYPE.bodyStrong, { color: colors.text }]}>{t(title)}</Text>
        <Text style={[GTYPE.caption, { color: colors.textSecondary, lineHeight: 18 }]}>{list.length ? list.join(', ') : t('Nothing yet')}</Text>
      </View>
    </View>
  )

  return (
    <Screen back title={t('My progress')} subtitle={t('Your skin story, step by step')}>
      <ProgressTabs current="SkinTimeline" />
      {s ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('WHAT WORKED FOR YOU')}</Text>
          <PremiumBlur locked={premium === false} title="What worked for your skin" text="What helped, what didn’t and what you stopped, from your own history.">
            <Card>
              <Line icon="checkmark-circle" color={colors.success} title="What worked" list={s.worked} />
              <Line icon="close-circle" color={colors.warning} title="What didn’t" list={s.didnt} />
              <Line icon="pause-circle" color={colors.muted} title="What you stopped" list={s.stopped} />
              <View style={styles.sumRow}>
                <Ionicons name="swap-horizontal" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                <Text style={[GTYPE.caption, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>
                  {t('{n} changes to your products in the last 3 months.', { n: s.changes })}{s.changes > 3 ? ` ${t('Fewer changes make it easier to see what works.')}` : ''}
                </Text>
              </View>
            </Card>
          </PremiumBlur>
        </>
      ) : null}

      <AskKodaLink pill label="Ask Koda what worked for my skin" returnTo="SkinTimeline"
        prefill={s && (s.worked.length || s.didnt.length)
          ? t('What worked for my skin: {worked}. What didn’t: {didnt}. What should I keep and change?', { worked: s.worked.join(', ') || t('nothing yet'), didnt: s.didnt.join(', ') || t('nothing yet') })
          : t('Looking at my skin history, what has worked for my skin and what should I change?')} />

      <Text style={[styles.section, { color: colors.muted }]}>{t('TIMELINE')}</Text>
      {!data.timeline.length ? (
        <Card>
          <Text style={[GTYPE.caption, { color: colors.textSecondary, lineHeight: 18 }]}>{t('Your timeline fills itself as you use Skynkod: products you start, skin reviews, scans and how your skin changes.')}</Text>
        </Card>
      ) : (
        <View>
          {data.timeline.map((e, i) => {
            const k = KIND[e.kind] || KIND.started
            const last = i === data.timeline.length - 1
            return (
              <View key={`${e.kind}-${e.date}-${i}`} style={styles.event}>
                <Text style={[styles.date, { color: colors.muted }]}>{fmt(e.date)}</Text>
                <View style={styles.rail}>
                  <View style={[styles.node, { ...glassCard(colors), borderColor: colors[k.color] }]}>
                    <FeatureIcon name={k.icon} size={13} color={colors[k.color]} />
                  </View>
                  {!last ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
                </View>
                <Text style={[GTYPE.body, { color: colors.text, flex: 1, paddingBottom: SPACING.lg }]}>
                  {e.emoji ? `${e.emoji} ` : ''}{t(e.text, e.params ? Object.fromEntries(Object.entries(e.params).map(([key, v]) => [key, key === 'concern' || key === 'overall' ? t(v) : v])) : undefined)}
                </Text>
              </View>
            )
          })}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { fontSize: 12, ...GFW('700'), letterSpacing: 1.1, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  sumRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start', marginBottom: SPACING.md },
  event: { flexDirection: 'row', gap: SPACING.sm },
  date: { width: 54, fontSize: 11, ...GFW('700'), marginTop: 4 },
  rail: { alignItems: 'center', width: 26 },
  node: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginVertical: 2 },
})
