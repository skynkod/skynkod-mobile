import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, LoadingView, useColors } from '../components/ui'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { SITUATIONS, getSituation } from '../utils/emergency-plans'
import { getActivePlan, startPlan, endPlan } from '../utils/emergency-state'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const PAUSE_LABELS = {
  retinoid: 'Retinol', acid: 'Acids', exfoliant: 'Exfoliants', vitaminC: 'Vitamin C',
  fragrance: 'Fragranced products', scrub: 'Scrubs', mask: 'Masks', newest: 'Your newest product',
}

// Emergency mode from the mockup: pick what's going on, preview the 7-day
// plan, start it. While it runs, the plan pauses some products in the routine.
export default function EmergencyScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const [active, setActive] = useState(undefined) // undefined = loading
  const [preview, setPreview] = useState(null) // situation being previewed
  const [openDay, setOpenDay] = useState(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    const plan = await getActivePlan(user.id)
    setActive(plan)
    setOpenDay(plan ? plan.dayIndex : null)
  }, [user?.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  // Opened with a situation (from the Journal or Koda): go straight to it.
  useEffect(() => {
    const s = getSituation(route?.params?.situation)
    if (s) {
      setPreview(s)
      setOpenDay(0)
    }
  }, [route?.params?.situation, route?.params?.openedAt])

  if (active === undefined) return <LoadingView />

  const start = async () => {
    const begin = async () => {
      await startPlan(user.id, preview.id)
      setPreview(null)
      navigation.setParams({ situation: undefined })
      load()
    }
    if (!active) return begin()
    Alert.alert(t('Replace your current plan?'), t('You already have a plan running. Starting this one ends it.'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Start new plan'), onPress: begin },
    ])
  }

  const stop = () =>
    Alert.alert(t('End this plan?'), t('Your usual routine comes back straight away.'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('End plan'), style: 'destructive', onPress: async () => { await endPlan(user.id); load() } },
    ])

  const DayList = ({ situation, current }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {situation.days.map((day, i) => {
        const isOpen = openDay === i
        const isToday = current === i
        const past = current !== undefined && current !== null && i < current
        return (
          <Pressable
            key={i}
            onPress={() => setOpenDay(isOpen ? null : i)}
            style={[styles.dayRow, i < 6 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, isToday && { backgroundColor: colors.primarySoft }]}
          >
            <View style={styles.dayHead}>
              <Ionicons name={past ? 'checkmark-circle' : day.icon} size={20} color={past ? colors.success : isToday ? colors.primary : colors.textSecondary} />
              <Text style={[TYPE.bodyStrong, { color: colors.text, width: 62 }]}>{t('Day {n}', { n: i + 1 })}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1 }]}>{t(day.title)}</Text>
              {isToday ? <Text style={[styles.today, { color: colors.primary }]}>{t('TODAY')}</Text> : null}
            </View>
            {isOpen ? (
              <View style={styles.dayBody}>
                <Text style={[TYPE.body, { color: colors.text }]}>{t(day.focus)}</Text>
                <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 6 }]}>
                  <Text style={{ fontWeight: '700' }}>{t('Avoid')}: </Text>{t(day.avoid)}
                </Text>
                {day.needs?.length ? (
                  <Pressable
                    onPress={() => navigation.navigate('Suggestions', { situation: situation.id, day: i })}
                    style={[styles.suggest, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <Ionicons name="sparkles-outline" size={15} color={colors.primary} />
                    <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Suggest products for this day')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )

  // ---------- A plan is running ----------
  if (active && !preview) {
    const s = active.situation
    return (
      <Screen back title={t('Emergency Mode')}>
        <Text style={[styles.planTitle, { color: colors.primary }]}>{t('Your 7-Day Plan')}</Text>
        <Text style={[TYPE.body, { color: colors.textSecondary }]}>
          {t(s.title)} · {t('Day {n} of 7', { n: active.dayIndex + 1 })}
        </Text>
        <DayList situation={s} current={active.dayIndex} />

        <View style={[styles.note, { backgroundColor: colors.surface }]}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Paused in your routine')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
            {s.pause.map(p => t(PAUSE_LABELS[p])).join(' · ')}
          </Text>
          <Text style={[TYPE.caption, { color: colors.muted, marginTop: 6 }]}>{t('Your Home routine already leaves them out until the plan ends.')}</Text>
        </View>

        <Pressable onPress={stop} style={{ alignSelf: 'center', padding: SPACING.lg }}>
          <Text style={[TYPE.bodyStrong, { color: colors.textSecondary }]}>{t('End plan')}</Text>
        </Pressable>
      </Screen>
    )
  }

  // ---------- Preview of a plan before starting ----------
  if (preview) {
    return (
      <Screen back title={t('Emergency Mode')}>
        <Pressable onPress={() => { setPreview(null); navigation.setParams({ situation: undefined }) }} hitSlop={8} style={{ marginBottom: SPACING.sm }}>
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>← {t('Choose another situation')}</Text>
        </Pressable>
        <Text style={[styles.planTitle, { color: colors.primary }]}>{t('Your 7-Day Plan')}</Text>
        <Text style={[TYPE.body, { color: colors.textSecondary }]}>{t(preview.title)}</Text>
        <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.md }]}>{t(preview.intro)}</Text>

        {preview.urgent ? (
          <View style={[styles.note, { backgroundColor: colors.dangerSoft, marginTop: SPACING.md }]}>
            <Text style={[TYPE.caption, { color: colors.danger, fontWeight: '700', lineHeight: 18 }]}>{t(preview.urgent)}</Text>
          </View>
        ) : null}

        <DayList situation={preview} current={null} />

        <View style={[styles.note, { backgroundColor: colors.surface }]}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('What changes in your routine')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
            {t('Paused for 7 days:')} {preview.pause.map(p => t(PAUSE_LABELS[p])).join(' · ')}
          </Text>
        </View>

        <Pressable onPress={start} style={({ pressed }) => [styles.primary, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={styles.primaryText}>{t('Start plan')}</Text>
        </Pressable>
      </Screen>
    )
  }

  // ---------- Choose what's going on ----------
  return (
    <Screen back title={t('Emergency Mode')}>
      <Text style={[TYPE.heading, { color: colors.text }]}>{t("What's going on?")}</Text>
      <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: 4 }]}>{t('Choose what best describes your situation.')}</Text>
      <View style={styles.grid}>
        {SITUATIONS.map(s => (
          <Pressable
            key={s.id}
            onPress={() => { setPreview(s); setOpenDay(0) }}
            style={({ pressed }) => [styles.tile, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name={s.icon} size={24} color={colors.primary} />
            <Text style={[TYPE.caption, { color: colors.text, fontWeight: '600', flex: 1 }]}>{t(s.label)}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => navigation.navigate('Koda', { returnTo: 'Emergency', prefill: t("My skin isn't doing well and I'm not sure why. Can you help?") })}
          style={({ pressed }) => [styles.tile, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.primary} />
          <Text style={[TYPE.caption, { color: colors.text, fontWeight: '600', flex: 1 }]}>{t('Other')}</Text>
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.xl },
  tile: { width: '47%', flexGrow: 1, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.lg },
  planTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  card: { borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, marginTop: SPACING.lg, overflow: 'hidden' },
  dayRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  dayBody: { marginTop: SPACING.sm, marginLeft: 32 },
  suggest: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: SPACING.md },
  today: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  note: { borderRadius: RADIUS.md, padding: SPACING.lg, marginTop: SPACING.lg },
  primary: { height: 54, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl, marginBottom: SPACING.md },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})
