import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import { supabase } from '../utils/supabase'
import { useAuth } from '../utils/AuthContext'
import { useLanguage, useT } from '../utils/LanguageContext'
import { useFirstName } from '../utils/useFirstName'
import { useTheme } from '../utils/ThemeContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { getUserRoutines } from '../utils/routines-service'
import { todaySteps } from '../utils/routine-checks'
import { logStep, syncTodayTicks, localDay } from '../utils/routine-log'
import { MOODS, saveDay } from '../utils/journal-day'
import { getRekodPlan, tonightNight, NIGHTS, goalOf, goalsTitle, weekOf } from '../utils/rekod'
import { getSkinWeather, pickSkinTips, getWeatherNow } from '../utils/skin-weather'
import { seasonDailyTip, currentSeason } from '../utils/seasons'
import { logError } from '../utils/errorLogger'
import { track } from '../utils/analytics'
import { useColors } from '../components/ui'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// "My skin day", like a food diary: three things to do each day (morning
// routine, check-in, evening routine), a ring that fills up and a streak.

const doneKey = (userId, period) => `routine_done_${userId}_${period}_${new Date().toDateString()}`
const tap = () => { Haptics.selectionAsync().catch(() => {}) }

// Days in a row with something logged (a routine step or a check-in). Today
// counts once done; until then the streak runs up to yesterday.
const streakFrom = (days) => {
  const set = new Set(days)
  let n = 0
  const d = new Date()
  if (!set.has(localDay(d))) d.setDate(d.getDate() - 1)
  while (set.has(localDay(d))) { n += 1; d.setDate(d.getDate() - 1) }
  return n
}

export default function TodayScreen({ navigation }) {
  const colors = useColors()
  const t = useT()
  const insets = useSafeAreaInsets()
  const { language } = useLanguage()
  const { user } = useAuth()
  const firstName = useFirstName(user?.id)
  const profile = useSkinProfile(user?.id)
  const { coords, updateLocation } = useTheme()
  useEffect(() => { updateLocation?.() }, [])

  const [routines, setRoutines] = useState({ morning: null, evening: null })
  const [done, setDone] = useState({ morning: {}, evening: {} })
  const [entry, setEntry] = useState(null)
  const [streak, setStreak] = useState(0)
  const [plan, setPlan] = useState(null)
  const [open, setOpen] = useState(null) // 'morning' | 'evening'
  const [weather, setWeather] = useState(null)
  const [sky, setSky] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      const [res, m, e, p] = await Promise.all([
        getUserRoutines(user.id),
        AsyncStorage.getItem(doneKey(user.id, 'morning')).catch(() => null),
        AsyncStorage.getItem(doneKey(user.id, 'evening')).catch(() => null),
        getRekodPlan(user.id).catch(() => null),
      ])
      const latest = type => (res.success ? (res.data || []).find(r => r.type === type && Array.isArray(r.steps) && r.steps.some(x => x.product)) : null)
      const morning = latest('morning')
      const evening = latest('evening')
      setRoutines({ morning, evening })
      setDone({ morning: JSON.parse(m || '{}'), evening: JSON.parse(e || '{}') })
      setPlan(p)
      syncTodayTicks(user.id, { morning: morning?.id, evening: evening?.id })

      // Today's check-in and the streak (last 60 days of routine steps and check-ins).
      const since = new Date(Date.now() - 60 * 86400000)
      const [{ data: ticks }, { data: entries }] = await Promise.all([
        supabase.from('routine_completions').select('date').eq('user_id', user.id).gte('date', localDay(since)),
        supabase.from('journal_entries').select('id, date, mood, skin_conditions').eq('user_id', user.id).gte('date', since.toISOString()).order('date', { ascending: false }),
      ])
      const today = (entries || []).find(x => new Date(x.date).toDateString() === new Date().toDateString())
      setEntry(today || null)
      setStreak(streakFrom([...(ticks || []).map(x => x.date), ...(entries || []).filter(x => x.mood).map(x => localDay(new Date(x.date)))]))
    } catch (error) {
      await logError('Today_load', error, {}, 'warn')
    }
  }, [user?.id])
  useFocusEffect(useCallback(() => { load() }, [load]))

  useEffect(() => {
    if (!coords) return
    getWeatherNow(coords).then(setWeather).catch(() => {})
    getSkinWeather(coords).then(setSky).catch(() => {})
  }, [coords?.latitude, coords?.longitude])

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const stepsOf = period => todaySteps(routines[period]?.steps || [])
  const countOf = period => {
    const steps = stepsOf(period)
    return { total: steps.length, done: steps.filter((_, i) => done[period][i]).length }
  }
  const morning = countOf('morning')
  const evening = countOf('evening')
  const part = c => (c.total ? c.done / c.total : 0)
  const progress = (part(morning) + (entry?.mood ? 1 : 0) + part(evening)) / 3

  const toggle = async (period, idx) => {
    tap()
    const next = { ...done[period], [idx]: !done[period][idx] }
    setDone(d => ({ ...d, [period]: next }))
    await AsyncStorage.setItem(doneKey(user.id, period), JSON.stringify(next)).catch(() => {})
    logStep({ userId: user.id, routineId: routines[period]?.id, type: period, stepIndex: idx, done: !!next[idx] })
    track('routine_step', { period })
    const steps = stepsOf(period)
    if (next[idx] && steps.every((_, i) => next[i])) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      track('routine_done', { period })
      setOpen(null)
      setStreak(s => Math.max(s, 1))
    }
  }

  const pickMood = async (mood) => {
    tap()
    try {
      const id = await saveDay(user.id, new Date(), { mood, tags: entry?.skin_conditions || [], notes: '' }, entry?.id)
      setEntry({ ...(entry || {}), id, mood })
      if (!entry?.mood) track('checkin_done')
    } catch (error) {
      await logError('Today_mood', error)
    }
  }

  const hour = new Date().getHours()
  const greeting = hour >= 5 && hour < 12 ? t('Good morning') : hour >= 12 && hour < 18 ? t('Good afternoon') : t('Good evening')
  // The routine due now: morning from 5 am to 3 pm, then the evening one.
  const now = hour >= 5 && hour < 15 ? 'morning' : 'evening'
  const [compact, setCompact] = useState(false)
  const helloBottom = useRef(200) // bottom of the greeting, so the sticky header waits until it is gone
  const tips = sky ? pickSkinTips(sky.weather, profile, sky.city) : []
  const seasonTip = seasonDailyTip(currentSeason(new Date(), coords?.latitude ?? null).id)
  // Mornings: the day's weather tip (UV, heat…). Evenings: sleep, the skin's repair time.
  const sleepTip = { icon: 'bed-outline', text: 'Aim for 7 to 9 hours of sleep tonight: your skin repairs itself while you sleep.' }
  const dayTip = tips[0] || (typeof seasonTip === 'string' ? { icon: 'leaf-outline', text: seasonTip } : seasonTip) || { icon: 'leaf-outline', text: 'Drink water and keep your sunscreen on.' }
  const tip = (hour >= 5 && hour < 15) ? dayTip : sleepTip
  const tonight = plan ? NIGHTS[tonightNight(plan)] : null

  const Row = ({ period, icon, title, count }) => {
    const complete = count.total > 0 && count.done === count.total
    const isOpen = !complete
    // No products in this routine: add hers, or get one made for her skin.
    if (!count.total) {
      return (
        <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border, gap: SPACING.md }]}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('No products in your {period} routine yet', { period: period === 'morning' ? t('morning') : t('evening') })}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, lineHeight: 18 }]}>{t('Add the products you already use, or let us build a routine made for your skin.')}</Text>
          <Pressable onPress={() => navigation.navigate('RoutineBuilder', { period, startedAt: Date.now() })} style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
            <Text style={[TYPE.bodyStrong, { color: colors.onPrimary }]}>{t('Add my products')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Rekod')} style={[styles.emptyBtn, { backgroundColor: '#33202E', flexDirection: 'row', gap: 8 }]}>
            <Ionicons name="diamond-outline" size={16} color="#FFFFFF" />
            <Text style={[TYPE.bodyStrong, { color: '#FFFFFF' }]}>{t('Get a routine made for me')}</Text>
          </Pressable>
        </View>
      )
    }
    return (
      <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable disabled={!!count.total && !complete} onPress={() => { tap(); count.total ? (plan ? navigation.navigate('Rekod') : navigation.navigate('Routines', { tab: period })) : navigation.navigate('RoutineBuilder', { period, startedAt: Date.now() }) }} style={styles.logRow}>
          <View style={[styles.logIcon, { backgroundColor: complete ? colors.successSoft : colors.primarySoft }]}>
            <Ionicons name={complete ? 'checkmark' : icon} size={20} color={complete ? colors.success : colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{title}</Text>
            <Text style={[TYPE.caption, { color: colors.muted }]}>
              {count.total ? (complete ? (period === 'morning' ? t('Done · see you tonight') : t('Done · sleep well')) : t('{done} of {total} steps', { done: count.done, total: count.total })) : t('Set up my routine')}
            </Text>
          </View>
          {count.total ? (
            <View style={[styles.miniTrack, { backgroundColor: colors.border }]}>
              <View style={{ width: `${Math.round(part(count) * 100)}%`, height: '100%', backgroundColor: complete ? colors.success : colors.primary, borderRadius: 3 }} />
            </View>
          ) : null}
          {!isOpen ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
        </Pressable>
        {isOpen ? (
          <View style={{ marginTop: SPACING.sm }}>
            {stepsOf(period).map((s, i) => (
              <View key={`${s.key}-${i}`} style={[styles.stepRow, { borderTopColor: colors.border }]}>
                <Pressable onPress={() => toggle(period, i)} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: !!done[period][i] }}
                  style={[styles.check, { borderColor: done[period][i] ? colors.primary : colors.border, backgroundColor: done[period][i] ? colors.primary : 'transparent' }]}>
                  {done[period][i] ? <Ionicons name="checkmark" size={14} color={colors.onPrimary} /> : null}
                </Pressable>
                <Pressable onPress={() => s.product_id && navigation.navigate('Product', { id: s.product_id })} style={{ flex: 1 }}>
                  <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '700' }]}>{t(s.action)}</Text>
                  <Text style={[TYPE.body, { color: s.product_id ? colors.primary : colors.text, textDecorationLine: done[period][i] ? 'line-through' : 'none' }]} numberOfLines={1}>{s.product || t('Pick a product')}</Text>
                </Pressable>
              </View>
            ))}
            <Pressable onPress={() => (plan ? navigation.navigate('Rekod') : navigation.navigate('Routines', { tab: period }))} style={{ paddingTop: SPACING.sm }}>
              <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('See my whole routine')} ›</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top + SPACING.xl, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl * 2 }}
      scrollEventThrottle={32}
      onScroll={e => { const down = e.nativeEvent.contentOffset.y > helloBottom.current - insets.top - 56; if (down !== compact) setCompact(down) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      {/* 1 · Header: date and weather, greeting, today's skin tip */}
      <View style={styles.top}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Text style={[styles.date, { color: colors.primary }]} numberOfLines={1}>
            {new Date().toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          {weather ? (
            <>
              <Text style={[styles.date, { color: colors.accent }]}>·</Text>
              <Ionicons name={weather.icon} size={13} color={colors.primary} />
              <Text style={[styles.date, { color: colors.primary }]}>{weather.temp}°</Text>
            </>
          ) : null}
        </View>
        <Pressable onPress={() => navigation.navigate('Alerts')} hitSlop={10} accessibilityLabel={t('Notifications')} style={[styles.bell, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="notifications-outline" size={19} color={colors.text} />
        </Pressable>
      </View>
      {/* The greeting with a tiny brand-coloured sun or crescent, like an emoji */}
      {firstName ? <Text style={[styles.hello, { color: colors.text, marginTop: SPACING.xxl }]}>{greeting},</Text> : null}
      <View style={[styles.helloRow, firstName && { marginTop: 0 }]} onLayout={e => { helloBottom.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height }}>
        <Text style={[styles.hello, { color: colors.text }]}>{firstName || greeting}</Text>
        <View style={styles.glyph}>{hour >= 5 && hour < 18 ? <SunGlyph /> : <MoonGlyph />}</View>
      </View>
      <View style={styles.tipLine}>
        <Ionicons name={tip.icon} size={14} color={colors.muted} />
        <Text style={{ color: colors.muted, flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '300', fontStyle: 'italic' }}>{t(tip.text)}</Text>
      </View>

      {/* 2 · Check any product: the heart of the app */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('Check a product')}</Text>
      <View style={styles.searchRow}>
        <Pressable onPress={() => navigation.navigate('Search')} style={[styles.search, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <Text style={[TYPE.body, { color: colors.muted, flex: 1 }]} numberOfLines={1}>{t('Search a product')}</Text>
        </Pressable>
        <Pressable onPress={() => { tap(); navigation.navigate('Scanner') }} accessibilityLabel={t('Scan a product')}
          style={({ pressed }) => [styles.scanBtn, { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
          <Ionicons name="scan-outline" size={20} color={colors.onPrimary} />
          <Text style={[TYPE.bodyStrong, { color: colors.onPrimary }]}>{t('Scan')}</Text>
        </Pressable>
      </View>

      {/* 2 · The routine due now */}
      <Text style={[styles.section, { color: colors.muted }]}>{now === 'morning' ? t('This morning') : t('Tonight')}</Text>
      {now === 'morning'
        ? <Row period="morning" icon="sunny-outline" title={t('Morning routine')} count={morning} />
        : <Row period="evening" icon="moon-outline" title={tonight ? t(tonight.label) : t('Evening routine')} count={evening} />}

      {/* 3 · Today's check-in */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('Your skin today')}</Text>
      <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.logRow}>
          <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>
            {entry?.mood ? t('Today: {mood}', { mood: t(MOODS.find(m => m.value === entry.mood)?.label).toLowerCase() }) : t('How does your skin feel?')}
          </Text>
          {entry?.mood ? (
            <Pressable onPress={() => navigation.navigate('Journal')} hitSlop={8}>
              <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Add details')}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.moods}>
          {MOODS.map(m => {
            const on = entry?.mood === m.value
            return (
              <Pressable key={m.value} onPress={() => pickMood(m.value)} accessibilityLabel={t(m.label)}
                style={({ pressed }) => [styles.mood, { backgroundColor: on ? colors.primary : colors.primarySoft, transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
                <MaterialCommunityIcons name={m.icon} size={24} color={on ? colors.onPrimary : colors.primary} />
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* 5 · The programme */}
      <Text style={[styles.section, { color: colors.muted }]}>{plan ? t('My programme') : t('Go further')}</Text>
      <Pressable onPress={() => navigation.navigate('Rekod')} style={({ pressed }) => [styles.programme, { opacity: pressed ? 0.9 : 1 }]}>
        <View style={styles.programmeIcon}><Ionicons name="diamond-outline" size={20} color="#FFFFFF" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.programmeKicker}>{plan ? t('WEEK {n} OF {total}', { n: Math.min(weekOf(plan), goalOf(plan.goal).weeks), total: goalOf(plan.goal).weeks }) : t('PREMIUM · SKIN PROGRAMME')}</Text>
          <Text style={styles.programmeTitle} numberOfLines={1}>{plan ? goalsTitle(plan) : t('Your skin programme, made for you')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#E2C6DA" />
      </Pressable>
    </ScrollView>

    {/* Once the greeting scrolls away: a solid header with the date, weather and greeting */}
    {compact ? (
      <View style={[styles.sticky, { paddingTop: insets.top + SPACING.xs, backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.date, { color: colors.primary }]} numberOfLines={1}>{new Date().toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            {weather ? <><Ionicons name={weather.icon} size={12} color={colors.primary} /><Text style={[styles.date, { color: colors.primary }]}>{weather.temp}°</Text></> : null}
          </View>
          <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: 2 }]} numberOfLines={1}>{greeting}{firstName ? `, ${firstName}` : ''}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Alerts')} hitSlop={10} accessibilityLabel={t('Notifications')}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
        </Pressable>
      </View>
    ) : null}
    </View>
  )
}

// Tiny custom "emoji" in the brand colours (mauve and plum).
function MoonGlyph({ size = 24 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15.5 3.2a8.8 8.8 0 1 0 5.3 15.4A7.2 7.2 0 0 1 15.5 3.2Z" fill="#C5A8BB" />
      <Path d="M19.2 4.2l.45 1.15 1.15.45-1.15.45-.45 1.15-.45-1.15-1.15-.45 1.15-.45Z" fill="#8A6380" />
    </Svg>
  )
}

function SunGlyph({ size = 24 }) {
  const rays = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {rays.map((a, i) => (
        <Line key={i} x1={12 + Math.cos(a) * 7.6} y1={12 + Math.sin(a) * 7.6} x2={12 + Math.cos(a) * 10.6} y2={12 + Math.sin(a) * 10.6} stroke="#8A6380" strokeWidth={1.8} strokeLinecap="round" />
      ))}
      <Circle cx={12} cy={12} r={5} fill="#C5A8BB" />
    </Svg>
  )
}

function Ring({ progress, colors }) {
  const size = 96, stroke = 10, r = (size - stroke) / 2, c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, progress))
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.primarySoft} strokeWidth={stroke} fill="none" />
        {p > 0 ? <Circle cx={size / 2} cy={size / 2} r={r} stroke={p >= 1 ? colors.success : colors.primary} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - p)} /> : null}
      </Svg>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{Math.round(p * 100)}%</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  sticky: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  date: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  hello: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7, lineHeight: 38 },
  emptyBtn: { height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  helloRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xxl },
  glyph: { marginTop: 4 },
  tipLine: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.lg },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase', marginTop: SPACING.xxxl, marginBottom: SPACING.md },
  bell: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  programmeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  today: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, borderWidth: 1, borderRadius: 24, padding: SPACING.lg, marginTop: SPACING.lg },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  logCard: { borderWidth: 1, borderRadius: 20, padding: SPACING.lg },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  logIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  miniTrack: { width: 44, height: 6, borderRadius: 3, overflow: 'hidden' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm, borderTopWidth: StyleSheet.hairlineWidth },
  check: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  moods: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  mood: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', gap: SPACING.sm },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 52, borderRadius: 999, paddingHorizontal: SPACING.lg },
  search: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderRadius: 999, paddingHorizontal: SPACING.lg, height: 52 },
  programme: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: '#33202E', borderRadius: 22, padding: SPACING.lg },
  programmeKicker: { color: '#E2C6DA', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  programmeTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: 2 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.md },
})
