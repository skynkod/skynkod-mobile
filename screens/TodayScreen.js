import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, RefreshControl, Animated, Dimensions, AppState, Alert, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import FeatureIcon from '../components/FeatureIcon'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Haptics from 'expo-haptics'
import { syncSoon } from '../utils/journey'
import { useJourney } from '../utils/useJourney'
import ProfileAvatar from '../components/ProfileAvatar'
import Svg, { Circle, Line, Path } from 'react-native-svg'
import { supabase, getUserProfile } from '../utils/supabase'
import { useAuth } from '../utils/AuthContext'
import { useLanguage, useT } from '../utils/LanguageContext'
import { useFirstName } from '../utils/useFirstName'
import { useTheme } from '../utils/ThemeContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { getUserRoutines } from '../utils/routines-service'
import { todaySteps, activesOf, daysOf } from '../utils/routine-checks'
import { currentSkinState, isReactiveState, stateLabel } from '../utils/skin-state'
import SkinStateChips from '../components/SkinStateChips'
import { logStep, syncTodayTicks, localDay, getDayProgress } from '../utils/routine-log'
import { MOODS, MOOD_MESSAGES, saveDay, saveSleep, SLEEP_QUALITY, SLEEP_HOURS } from '../utils/journal-day'
import { tipOfTheMoment } from '../utils/daily-tips'
import { productMatch } from '../utils/ingredients-guide'
import { getRekodPlan, NIGHTS, nightInfo, goalsTitle, weekOf, planWeeks, rekodKey, refreshRekodRoutine, patternFromRoutine } from '../utils/rekod'
import { getWeatherNow, getForecastWeather } from '../utils/skin-weather'
import { getEnvironment } from '../utils/environment'
import { buildForecast, personalSignals, rekodSignals, periodSignal } from '../utils/skin-forecast'
import { readHealth, nextPeriod } from '../utils/apple-health'
import { getSkinPatterns } from '../utils/journal-day'
import SkinForecast from '../components/SkinForecast'
import { usePremium } from '../components/PremiumLock'
import { isPremiumUser } from '../utils/premium'
import { syncSmartReminders } from '../utils/notifications'
import { spacingState, spaceActives, restoreActives, dismissSpacing } from '../utils/active-spacing'
import { currentSeason, SEASONS } from '../utils/seasons'
import * as Location from 'expo-location'
import { getActivePlan, RETURN_LABELS } from '../utils/emergency-state'
import { currentRoutine, withPauses, withLipsStep } from '../utils/current-routine'
import { takeNewThanks } from '../utils/contributions'
import { skinDay, sunriseOn } from '../utils/skin-day'
import { getProductsByIds, getNewestProductId } from '../utils/catalog'
import { logError } from '../utils/errorLogger'
import { getWeekRecap, recapWeekKey } from '../utils/progress'
import { getCheckInStatus } from '../utils/skin-tracking'
import { getPausedProducts } from '../utils/paused-products'
import { track } from '../utils/analytics'
import { useColors } from '../components/ui'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// "My skin day", like a food diary: three things to do each day (morning
// routine, check-in, evening routine), a ring that fills up and a streak.

const doneKey = (userId, period) => `routine_day_${userId}_${period}_${skinDay().toDateString()}`
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

// On Home there is nothing "below" to tick: point to the journal instead.
const HOME_MOOD_MESSAGES = {
  bad: 'Sorry your skin isn’t at its best. Tap here to note what’s going on and get a few simple tips.',
  terrible: 'Rough day for your skin. Keep it simple and gentle today, and tap here to note what’s going on.',
}

// The day starts at the real sunrise where she is (5 am when we don't know
// the place): the greeting turns to Good morning and the skin check-in resets.
const sameSkinDay = (date, coords) => !!date && new Date(date).toDateString() === skinDay(new Date(), coords).toDateString()
// A mood picked last night after midnight sits on today's date but was set
// before this morning's sunrise: it doesn't count for today.
const pickedToday = (entry, coords) => {
  if (!entry?.mood || !sameSkinDay(entry.date, coords)) return false
  const touched = entry.updated_at || entry.created_at
  return !touched || new Date(touched) >= sunriseOn(skinDay(new Date(), coords), coords)
}

export default function TodayScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const insets = useSafeAreaInsets()
  const { language } = useLanguage()
  const { user } = useAuth()
  const journey = useJourney(user?.id)
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
  const [forecastDays, setForecastDays] = useState(null)
  // Far from home in another climate (or just back): the routine adapts.
  const [environment, setEnvironment] = useState(null)
  const [envClosed, setEnvClosed] = useState(false)
  const [patterns, setPatterns] = useState(null)
  const premium = usePremium()
  // Her skin today (check-in or journal), and the products of her routines, so
  // strong actives wait while the skin is irritated (Lita, 2026-10-24).
  const [skinState, setSkinState] = useState(null)
  const [routineProducts, setRoutineProducts] = useState({})
  const strongFace = p => p && !['eye care', 'lip care'].includes(p.category) && (activesOf(p).retinoid || activesOf(p).exfoliant || activesOf(p).benzoyl)
  const refreshSkinState = useCallback(async (eveningSteps, products) => {
    if (!user?.id) return
    const nights = new Set((eveningSteps || []).filter(st => strongFace(products[st.product_id])).flatMap(st => daysOf(st)))
    setSkinState(await currentSkinState(user.id, { strongNights: nights.size }).catch(() => null))
  }, [user?.id])
  // Reactions this week with actives in the routine: offer to space them.
  const [spacing, setSpacing] = useState(null)
  const [momentsOpen, setMomentsOpen] = useState(false)
  // Once today's check-in is done, Home shows one line (Lita, 2026-10-24); it
  // stays open right after picking, so she can add how her skin feels.
  const [checkinOpen, setCheckinOpen] = useState(false)
  // "How did you sleep?" each morning (Lita, 2026-10-25), one line once answered.
  const [sleepOpen, setSleepOpen] = useState(false)
  useFocusEffect(useCallback(() => { setCheckinOpen(false); setSleepOpen(false) }, []))
  // "Not now" on the reacting card: hidden for the rest of the day.
  const [reactDismissed, setReactDismissed] = useState(false)
  useFocusEffect(useCallback(() => {
    if (user?.id) AsyncStorage.getItem(`react_dismissed_${user.id}`).then(d => setReactDismissed(d === new Date().toDateString())).catch(() => {})
  }, [user?.id]))
  const dismissReacting = () => {
    setReactDismissed(true)
    AsyncStorage.setItem(`react_dismissed_${user.id}`, new Date().toDateString()).catch(() => {})
    if (spacing?.kind === 'offer') onSpacing('dismiss')
  }
  useFocusEffect(useCallback(() => { if (user?.id) spacingState(user.id).then(setSpacing).catch(() => setSpacing(null)) }, [user?.id]))
  const onSpacing = async (action) => {
    try {
      if (action === 'space') {
        const spaced = await spaceActives(user.id)
        if (!spaced) {
          Alert.alert(t('Nothing to space'), t('Your evening routine has no retinol or acids. Keep it gentle: cleanser, moisturizer, and sunscreen in the morning.'))
          return
        }
        setReactDismissed(true)
        AsyncStorage.setItem(`react_dismissed_${user.id}`, new Date().toDateString()).catch(() => {})
      }
      else if (action === 'restore') await restoreActives(user.id)
      else await dismissSpacing(user.id)
      setSpacing(null)
      if (action !== 'dismiss') load()
    } catch (error) {
      logError('Today_spacing', error)
      Alert.alert(t('Error'), t("Couldn't save your routine. Try again."))
    }
  }
  // Pregnancy mode, re-read on focus so a change in "Your skin right now" shows at once.
  const [pregnancy, setPregnancy] = useState(null)
  useFocusEffect(useCallback(() => { if (user?.id) getUserProfile(user.id).then(r => setPregnancy(r?.pregnancy || null)).catch(() => {}) }, [user?.id]))
  const [refreshing, setRefreshing] = useState(false)
  // A 7-day skin plan (Emergency) pauses strong products while it runs.
  const [sos, setSos] = useState({ plan: null, products: {}, newest: null })
  // The weekly recap: the week that just ended, until she closes it.
  const [recap, setRecap] = useState(null)
  // Products she paused herself (after a reaction): left out of the routine.
  const [pausedProducts, setPausedProducts] = useState([])
  useFocusEffect(useCallback(() => { if (user?.id) getPausedProducts(user.id).then(setPausedProducts) }, [user?.id]))
  useFocusEffect(useCallback(() => {
    if (!user?.id) return
    const key = `recap_seen_${user.id}_${recapWeekKey()}`
    AsyncStorage.getItem(key).then(seen => {
      if (seen) return setRecap(null)
      getWeekRecap(user.id).then(r => setRecap(r.empty ? null : { ...r, key })).catch(() => setRecap(null))
    }).catch(() => {})
  }, [user?.id]))
  // A product she proposed from the scanner was accepted: thank her, once.
  useFocusEffect(useCallback(() => {
    if (!user?.id) return
    takeNewThanks(user.id).then(fresh => {
      if (!fresh.length) return
      syncSoon(user.id, 500)
      Alert.alert(t('Thank you! 🌿'), fresh.length > 1
        ? t('{n} products you proposed are now in Skynkod. You earned points towards the Official Contributor badge.', { n: fresh.length })
        : t('A product you proposed is now in Skynkod. You earned points towards the Official Contributor badge.'))
    }).catch(() => {})
  }, [user?.id]))
  // The check-in every 2 weeks: a small card on Home when it's due.
  const [checkIn, setCheckIn] = useState(null)
  useFocusEffect(useCallback(() => {
    if (user?.id) getCheckInStatus(user.id).then(st => setCheckIn(st.due ? st : null)).catch(() => setCheckIn(null))
  }, [user?.id]))
  const closeRecap = () => { AsyncStorage.setItem(recap.key, '1').catch(() => {}); setRecap(null) }

  const rebuilding = useRef(null)
  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      const [res, m, e, p] = await Promise.all([
        getUserRoutines(user.id),
        AsyncStorage.getItem(doneKey(user.id, 'morning')).catch(() => null),
        AsyncStorage.getItem(doneKey(user.id, 'evening')).catch(() => null),
        getRekodPlan(user.id).catch(() => null),
      ])
      const morning = res.success ? currentRoutine(res.data, 'morning') : null
      const evening = res.success ? currentRoutine(res.data, 'evening') : null
      setRoutines({ morning, evening })
      // Ticks saved online count too (e.g. done on another phone).
      const online = await getDayProgress(user.id).catch(() => null)
      const withOnline = (local, set) => ({ ...Object.fromEntries([...(set || [])].map(i => [i, true])), ...local })
      setDone({ morning: withOnline(JSON.parse(m || '{}'), online?.morning), evening: withOnline(JSON.parse(e || '{}'), online?.evening) })
      setPlan(p)
      // A new week, level or the end of a rest week changes the Rekod nights:
      // the routine follows at once, without opening Rekod (audit 2026-10-25).
      // Premium only: without it, her routine stays as it is (Rekod audit 2).
      if (p && p.builtKey !== rekodKey(p) && rebuilding.current !== rekodKey(p) && await isPremiumUser(user.id).catch(() => false)) {
        rebuilding.current = rekodKey(p)
        refreshRekodRoutine(user.id, p).then(() => { syncSmartReminders(user.id); load() }).catch(error => logError('Today_rekodRefresh', error, {}, 'warn'))
      }
      const ids = [...(morning?.steps || []), ...(evening?.steps || [])].map(x => x.product_id).filter(Boolean)
      const rows = ids.length ? await getProductsByIds(ids).catch(() => []) : []
      const byId = Object.fromEntries(rows.map(x => [x.id, x]))
      setRoutineProducts(byId)
      refreshSkinState(evening?.steps || [], byId)
      syncTodayTicks(user.id, { morning: morning?.id, evening: evening?.id })
      const active = await getActivePlan(user.id)
      if (active) {
        const ids = [...(morning?.steps || []), ...(evening?.steps || [])].map(x => x.product_id).filter(Boolean)
        const [products, newest] = await Promise.all([
          getProductsByIds(ids).catch(() => []),
          active.situation.pause.includes('newest') ? getNewestProductId(user.id).catch(() => null) : null,
        ])
        setSos({ plan: active, products: Object.fromEntries(products.map(x => [x.id, x])), newest })
      } else setSos({ plan: null, products: {}, newest: null })

      // Today's check-in and the streak (last 60 days of routine steps and check-ins).
      const since = new Date(Date.now() - 60 * 86400000)
      const [{ data: ticks }, { data: entries }] = await Promise.all([
        supabase.from('routine_completions').select('date').eq('user_id', user.id).gte('date', localDay(since)),
        supabase.from('journal_entries').select('id, date, mood, skin_conditions, skin_state, notes, sleep_hours, sleep_quality, created_at, updated_at').eq('user_id', user.id).gte('date', since.toISOString()).order('date', { ascending: false }),
      ])
      const today = (entries || []).find(x => sameSkinDay(x.date, coords))
      setEntry(today || null)
      setStreak(streakFrom([...(ticks || []).map(x => x.date), ...(entries || []).filter(x => x.mood).map(x => localDay(new Date(x.date)))]))
    } catch (error) {
      await logError('Today_load', error, {}, 'warn')
    }
  }, [user?.id, coords?.latitude, coords?.longitude])
  useFocusEffect(useCallback(() => { load() }, [load]))
  // Her journal patterns, for the forecast's personal signals.
  useFocusEffect(useCallback(() => { if (user?.id) getSkinPatterns(user.id).then(setPatterns).catch(() => {}) }, [user?.id]))
  // Apple Health (real app only): when her next period should start.
  const [period, setPeriod] = useState(null)
  useFocusEffect(useCallback(() => { readHealth().then(h => setPeriod(h ? nextPeriod(h.periodDays) : null)).catch(() => {}) }, []))
  // Coming back to the app (e.g. the next morning): reload, so yesterday's
  // skin check-in and ticks don't stay on screen.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => { if (state === 'active') load() })
    return () => sub.remove()
  }, [load])
  // Left open overnight: reload at sunrise so the new day starts fresh.
  useEffect(() => {
    let next = sunriseOn(new Date(), coords)
    if (next <= new Date()) { const d = new Date(); d.setDate(d.getDate() + 1); next = sunriseOn(d, coords) }
    const timer = setTimeout(() => load(), next - new Date() + 5000)
    return () => clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (!coords) return
    getWeatherNow(coords).then(setWeather).catch(() => {})
    getForecastWeather(coords).then(days => { setForecastDays(days); return getEnvironment(user?.id, coords, days?.[0]) }).then(setEnvironment).catch(() => {})
  }, [coords?.latitude, coords?.longitude])

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const reactive = isReactiveState(skinState?.states)
  const adjustedOf = period => {
    const plain = withPauses(todaySteps(withLipsStep(routines[period]?.steps || [])), { plan: sos.plan, products: sos.products, newest: sos.newest, pausedIds: pausedProducts.map(p => p.id) })
    // A product her profile says to avoid (pregnancy, breastfeeding, an allergy)
    // waits, even in a routine made before (integration audit, 2026-10-25).
    const avoid = plain.steps.filter(st => routineProducts[st.product_id] && profile && productMatch(routineProducts[st.product_id], profile).avoid.length)
    const base = { steps: plain.steps.filter(st => !avoid.includes(st)), paused: [...plain.paused, ...avoid.map(step => ({ step, reason: 'avoid' }))] }
    if (!reactive) return base
    // Irritated, red, damaged barrier or over-exfoliated: strong actives wait.
    const waiting = base.steps.filter(st => strongFace(routineProducts[st.product_id]))
    return { steps: base.steps.filter(st => !waiting.includes(st)), paused: [...base.paused, ...waiting.map(step => ({ step, reason: 'skin state' }))] }
  }
  const saveStates = async (next) => {
    try {
      const current = sameSkinDay(entry?.date, coords) ? entry : null
      const day = skinDay(new Date(), coords)
      const id = await saveDay(user.id, day, { mood: current?.mood || null, tags: current?.skin_conditions || [], notes: current?.notes || '', states: next }, current?.id)
      setEntry({ ...(current || {}), id, skin_state: next, date: current?.date || day.toISOString() })
      refreshSkinState(routines.evening?.steps || [], routineProducts)
      // Tonight's reminder follows her skin (reacting: a gentle evening).
      syncSmartReminders(user.id)
    } catch (error) {
      logError('Today_states', error)
    }
  }
  const stepsOf = period => adjustedOf(period).steps
  const countOf = period => {
    const steps = stepsOf(period)
    // An empty step (no product yet) can't be ticked: it doesn't count.
    return { total: steps.filter(s => s.product).length, done: steps.filter((s, i) => s.product && done[period][i]).length }
  }
  const morning = countOf('morning')
  const evening = countOf('evening')
  const part = c => (c.total ? c.done / c.total : 0)
  // Today's mood only: yesterday's never stays on screen.
  const todayMood = pickedToday(entry, coords) ? entry.mood : null
  const progress = (part(morning) + (todayMood ? 1 : 0) + part(evening)) / 3

  const toggle = async (period, idx) => {
    tap()
    const next = { ...done[period], [idx]: !done[period][idx] }
    setDone(d => ({ ...d, [period]: next }))
    await AsyncStorage.setItem(doneKey(user.id, period), JSON.stringify(next)).catch(() => {})
    logStep({ userId: user.id, routineId: routines[period]?.id, type: period, stepIndex: idx, done: !!next[idx] })
    track('routine_step', { period })
    syncSoon(user.id, 2500)
    const steps = stepsOf(period)
    if (next[idx] && steps.every((s, i) => !s.product || next[i])) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      track('routine_done', { period })
      setOpen(null)
      setStreak(s => Math.max(s, 1))
    }
  }

  const pickMood = async (mood) => {
    setCheckinOpen(true)
    tap()
    try {
      // Only today's entry is updated; an older one on screen is never touched.
      const current = sameSkinDay(entry?.date, coords) ? entry : null
      const day = skinDay(new Date(), coords)
      const id = await saveDay(user.id, day, { mood, tags: current?.mood === mood ? current?.skin_conditions || [] : [], notes: current?.notes || '' }, current?.id)
      setEntry({ ...(current || {}), id, mood, date: current?.date || day.toISOString(), updated_at: new Date().toISOString() })
      if (!entry?.mood) track('checkin_done')
      // Straight to the journal: a tip for the day, and room to say what's going on.
      navigation.navigate('Journal', { openNew: Date.now() })
    } catch (error) {
      await logError('Today_mood', error)
    }
  }

  // Last night's sleep, saved on today's entry; read by the journal patterns.
  const todayEntry = sameSkinDay(entry?.date, coords) ? entry : null
  const sleepDone = todayEntry?.sleep_hours != null && !!todayEntry?.sleep_quality
  const pickSleep = async (change) => {
    tap()
    const next = { hours: todayEntry?.sleep_hours ?? null, quality: todayEntry?.sleep_quality ?? null, ...change }
    try {
      const day = skinDay(new Date(), coords)
      const id = await saveSleep(user.id, day, next, todayEntry?.id)
      const noon = new Date(day)
      noon.setHours(12, 0, 0, 0)
      setEntry({ skin_conditions: [], ...(todayEntry || {}), id, date: todayEntry?.date || noon.toISOString(), sleep_hours: next.hours, sleep_quality: next.quality })
      if (next.hours != null && next.quality) { setSleepOpen(false); if (!sleepDone) track('sleep_logged') }
    } catch (error) {
      logError('Today_sleep', error)
    }
  }

  const hour = new Date().getHours()
  const afterSunrise = new Date() >= sunriseOn(new Date(), coords)
  const greeting = afterSunrise && hour < 12 ? t('Good morning') : hour >= 12 && hour < 18 ? t('Good afternoon') : t('Good evening')
  // The routine due now: morning from 5 am to 3 pm, then the evening one.
  const now = afterSunrise && hour < 15 ? 'morning' : 'evening'
  const [compact, setCompact] = useState(false)
  // The top (date, greeting, tip) is either fully shown or fully gone: a small
  // scroll snaps it away and the small bar takes its place, with no empty gap.
  const scrollY = useRef(new Animated.Value(0)).current
  const [topBottom, setTopBottom] = useState(220)
  const [barHeight, setBarHeight] = useState(insets.top + 56)
  const swapAt = Math.max(40, topBottom - barHeight)
  const bigFade = scrollY.interpolate({ inputRange: [0, swapAt * 0.6], outputRange: [1, 0], extrapolate: 'clamp' })
  const smallFade = scrollY.interpolate({ inputRange: [swapAt * 0.5, swapAt], outputRange: [0, 1], extrapolate: 'clamp' })
  // Tonight as her saved routine has it, so Home never announces another night (Rekod audit 2).
  const nightOn = (p, date = new Date()) => patternFromRoutine(routines.evening?.steps || [])[[1, 2, 3, 4, 5, 6, 0].indexOf(date.getDay())]
  const tonight = plan ? nightInfo(plan, nightOn(plan)) : null
  const forecast = buildForecast({ days: forecastDays, profile })
  // Local weather is off: ask again, or open the phone's settings if iOS won't ask.
  const enableLocation = async () => {
    const permission = await Location.getForegroundPermissionsAsync().catch(() => null)
    if (permission && !permission.granted && !permission.canAskAgain) return Linking.openSettings()
    updateLocation?.()
  }
  const whenNight = i => (i === 0 ? t('tonight') : i === 1 ? t('tomorrow night')
    : t('on {day}', { day: new Date(Date.now() + i * 86400000).toLocaleDateString(language, { weekday: 'long' }) }))
  const forecastSignals = [
    periodSignal(period, patterns),
    ...personalSignals(patterns, { premium: !!premium }),
    ...rekodSignals(plan, { nightOf: nightOn, nights: NIGHTS, info: nightInfo }).map(s => ({ ...s, params: { ...s.params, when: whenNight(s.day) } })),
  ].filter(Boolean)

  const Row = ({ period, icon, title, count }) => {
    const complete = count.total > 0 && count.done === count.total
    const isOpen = !complete
    // No products in this routine: add hers, or get one made for her skin.
    if (!routines[period]) {
      return (
        <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border, gap: SPACING.md }]}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('No products in your {period} routine yet', { period: period === 'morning' ? t('morning') : t('evening') })}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, lineHeight: 18 }]}>{t('Add the products you already use, or let us build a routine made for your skin.')}</Text>
          <Pressable onPress={() => navigation.navigate('RoutineBuilder', { period, startedAt: Date.now() })} style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
            <Text style={[TYPE.bodyStrong, { color: colors.onPrimary }]}>{t('Add my products')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Rekod')} style={[styles.emptyBtn, { backgroundColor: '#33202E', flexDirection: 'row', gap: 8 }]}>
            <FeatureIcon name="rekod" size={18} color="#FFFFFF" />
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
            {/* The neck too (Lita, 2026-10-24) */}
            <Text style={[TYPE.caption, { color: colors.muted, marginBottom: SPACING.xs }]}>{t('On your face and neck, then your eyes and lips.')}</Text>
            {stepsOf(period).map((s, i) => (
              <View key={`${s.key}-${i}`} style={[styles.stepRow, { borderTopColor: colors.border }]}>
                {s.product ? (
                  <Pressable onPress={() => toggle(period, i)} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: !!done[period][i] }}
                    style={[styles.check, { borderColor: done[period][i] ? colors.primary : colors.border, backgroundColor: done[period][i] ? colors.primary : 'transparent' }]}>
                    {done[period][i] ? <Ionicons name="checkmark" size={14} color={colors.onPrimary} /> : null}
                  </Pressable>
                ) : (
                  <View style={[styles.check, { borderColor: colors.primary, borderStyle: 'dashed' }]}><Ionicons name="add" size={14} color={colors.primary} /></View>
                )}
                {/* A step without a product (Lips in an older routine): pick one in the builder */}
                <Pressable onPress={() => (s.product_id ? navigation.navigate('Product', { id: s.product_id })
                  : !s.product && navigation.navigate('RoutineBuilder', { period, startedAt: Date.now(), editSteps: withLipsStep(routines[period]?.steps || []) }))} style={{ flex: 1 }}>
                  <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '700' }]}>{t(s.action)}</Text>
                  <Text style={[TYPE.body, { color: s.product_id ? colors.primary : colors.text, textDecorationLine: done[period][i] ? 'line-through' : 'none' }]} numberOfLines={1}>{s.product || t('Pick a product')}</Text>
                </Pressable>
              </View>
            ))}
            {/* Same words everywhere: her skin today says "Not right now"; a plan or
                her own choice says "Paused". */}
            {adjustedOf(period).paused.filter(x => x.reason === 'skin state').length ? (
              <Text style={[TYPE.caption, { color: colors.muted, paddingTop: SPACING.sm }]}>
                {t('Not right now:')} {adjustedOf(period).paused.filter(x => x.reason === 'skin state').map(x => x.step.product).join(', ')}
              </Text>
            ) : null}
            {adjustedOf(period).paused.filter(x => x.reason === 'avoid').length ? (
              <Text style={[TYPE.caption, { color: colors.warning, paddingTop: SPACING.sm }]}>
                {['pregnant', 'breastfeeding'].includes(pregnancy) ? t('Not during pregnancy or breastfeeding:') : t('Not for you (your allergies):')} {adjustedOf(period).paused.filter(x => x.reason === 'avoid').map(x => x.step.product).join(', ')}
              </Text>
            ) : null}
            {adjustedOf(period).paused.filter(x => x.reason !== 'skin state' && x.reason !== 'avoid').length ? (
              <Text style={[TYPE.caption, { color: colors.muted, paddingTop: SPACING.sm }]}>
                {t('Paused for now:')} {adjustedOf(period).paused.filter(x => x.reason !== 'skin state' && x.reason !== 'avoid').map(x => x.step.product).join(', ')}
              </Text>
            ) : null}
            <Pressable onPress={() => (plan ? navigation.navigate('Rekod') : navigation.navigate('Routines', { tab: period }))} style={{ paddingTop: SPACING.sm }}>
              <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('See my whole routine')} ›</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    )
  }

  // The reacting-skin card: her skin picked as irritated or red, or reactions in the journal.
  const reactingShown = !sos.plan && (spacing?.kind === 'restore' || (!reactDismissed && (reactive || spacing?.kind === 'offer' || !!route?.params?.reacting)))
  const keyed = (key, node) => (node ? React.cloneElement(node, { key }) : null)
  const moments = [
    keyed('reacting', reactingShown ? (
        <View style={[styles.recap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Ionicons name={spacing?.kind === 'restore' ? 'leaf-outline' : 'pulse-outline'} size={16} color={colors.primary} />
            <Text style={[styles.recapKicker, { color: colors.primary, flex: 1 }]}>{spacing?.kind === 'restore' ? t('TWO CALMER WEEKS') : t('YOUR SKIN IS REACTING')}</Text>
            {spacing?.kind !== 'restore' ? <Pressable onPress={dismissReacting} hitSlop={12} accessibilityLabel={t('Not now')}><Ionicons name="close" size={18} color={colors.muted} /></Pressable> : null}
          </View>
          {spacing?.kind === 'restore' ? (
            <>
              <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, lineHeight: 21 }]}>{t('Your actives have been spaced for 2 weeks. Bring your usual schedule back?')}</Text>
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                <Pressable onPress={() => onSpacing('restore')} style={[styles.emptyBtn, { flex: 1, backgroundColor: colors.primary }]}>
                  <Text style={[TYPE.bodyStrong, { color: colors.onPrimary }]}>{t('Bring them back')}</Text>
                </Pressable>
                <Pressable onPress={() => onSpacing('dismiss')} style={[styles.emptyBtn, { flex: 1, borderWidth: 1, borderColor: colors.border }]}>
                  <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Keep spaced')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, lineHeight: 21 }]}>
                {reactive
                  ? t('Your skin is {state} today: strong actives wait, and products that could irritate it say “Not right now”.', { state: t(stateLabel(skinState.states.find(x => ['irritated', 'red', 'barrier', 'overexfoliated'].includes(x)))).toLowerCase() })
                  : t('Redness, itching or peeling on {n} days this week.', { n: spacing?.days || 2 })}
              </Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm }]}>{t('To calm it down, choose one:')}</Text>
              <Pressable onPress={() => onSpacing('space')} style={[styles.reactOption, { borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Space my actives for 2 weeks')}</Text>
                  <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('Retinol on Monday and Thursday, acids on Saturday.')}</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Emergency')} style={[styles.reactOption, { borderColor: colors.border }]}>
                <Ionicons name="medkit-outline" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('7-day calm plan')} <Ionicons name="diamond" size={12} color={colors.primary} /></Text>
                  <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('A gentle routine day by day, then your products back one by one.')}</Text>
                </View>
              </Pressable>
            </>
          )}
        </View>
      ) : null),
    keyed('review', checkIn ? (
        <Pressable onPress={() => navigation.navigate('SkinCheckIn', { week: checkIn.week })} style={[styles.recap, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Ionicons name="pulse-outline" size={16} color={colors.primary} />
            <Text style={[styles.recapKicker, { color: colors.primary, flex: 1 }]}>{t('WEEK {n} · SKIN REVIEW', { n: checkIn.week })}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
          <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.sm }]}>{t('How is your skin doing?')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t('10 seconds to see your progress.')}</Text>
        </Pressable>
      ) : null),
    keyed('environment', environment && !envClosed ? (
        <View style={[styles.recap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Ionicons name={environment.kind === 'back' ? 'home-outline' : 'airplane-outline'} size={16} color={colors.primary} />
            <Text style={[styles.recapKicker, { color: colors.primary, flex: 1 }]}>{t('YOUR ENVIRONMENT CHANGED')}</Text>
            <Pressable onPress={() => setEnvClosed(true)} hitSlop={12} accessibilityLabel={t('Close')}><Ionicons name="close" size={18} color={colors.muted} /></Pressable>
          </View>
          {environment.kind === 'back' ? (
            <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, lineHeight: 21 }]}>{t('You’re back home: your usual routine fits again.')}</Text>
          ) : (
            <>
              <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.sm, lineHeight: 21 }]}>
                {t('You’re somewhere {what} than home.', { what: environment.labels.map(l => t(l)).join(t(' and ')) })}
              </Text>
              {[['Morning', environment.morning], ['Evening', environment.evening]].map(([label, list]) => list.length ? (
                <View key={label} style={{ marginTop: SPACING.sm }}>
                  <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '700' }]}>{t(label).toUpperCase()}</Text>
                  {list.map(a => <Text key={a} style={[TYPE.caption, { color: colors.text, lineHeight: 19 }]}>→ {t(a)}</Text>)}
                </View>
              ) : null)}
            </>
          )}
        </View>
      ) : null),
    keyed('tip', recap ? (
        <Pressable onPress={() => navigation.navigate('Progress')} style={[styles.recap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
            <Text style={[styles.recapKicker, { color: colors.primary, flex: 1 }]}>{t('YOUR TIP FOR THE WEEK')}</Text>
            <Pressable onPress={closeRecap} hitSlop={12} accessibilityLabel={t('Close')}><Ionicons name="close" size={18} color={colors.muted} /></Pressable>
          </View>
          <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, lineHeight: 21 }]}>{t(recap.tip)}</Text>
        </Pressable>
      ) : null),
  ].filter(Boolean)

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
    <Animated.ScrollView style={{ flex: 1 }} snapToOffsets={[0, swapAt]} snapToEnd={false} decelerationRate="fast" contentContainerStyle={{ paddingTop: insets.top + SPACING.xl, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl * 2, minHeight: Dimensions.get('window').height + swapAt }}
      scrollEventThrottle={32}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true, listener: e => { const down = e.nativeEvent.contentOffset.y > swapAt * 0.75; if (down !== compact) setCompact(down) } })}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
      {/* 1 · Header: date and weather, greeting, today's skin tip */}
      <Animated.View style={{ opacity: bigFade }} onLayout={e => setTopBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
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
        {/* Profile lives here now that Rekod and Dekod have the bottom bar */}
        <Pressable onPress={() => navigation.navigate('More')} hitSlop={10} accessibilityLabel={t('Profile')} style={{ marginLeft: SPACING.sm, marginRight: 6 }}>
          <ProfileAvatar name={firstName} level={journey?.level.level} size={40} color={colors.primary} textColor={colors.onPrimary} />
        </Pressable>
      </View>
      {/* The greeting with a tiny brand-coloured sun or crescent, like an emoji */}
      <View>
        {firstName ? <Text style={[styles.hello, { color: colors.text, marginTop: SPACING.xxl }]}>{greeting},</Text> : null}
        <View style={[styles.helloRow, firstName && { marginTop: 0 }]}>
          <Text style={[styles.hello, { color: colors.text }]}>{firstName || greeting}</Text>
          <View style={styles.glyph}>{afterSunrise && hour < 18 ? <SunGlyph /> : <MoonGlyph />}</View>
        </View>
      </View>
      {/* The life mode that's on (pregnancy first, then reacting skin), like Flo's stage */}
      {['pregnant', 'breastfeeding'].includes(pregnancy) || sos.plan ? (
        <Pressable onPress={() => navigation.navigate('LifeModes')} style={[styles.modeChip, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={sos.plan && !['pregnant', 'breastfeeding'].includes(pregnancy) ? 'flame-outline' : 'heart-outline'} size={14} color={colors.primary} />
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>
            {pregnancy === 'pregnant' ? t('Pregnancy mode') : pregnancy === 'breastfeeding' ? t('Breastfeeding mode') : t('My skin is reacting')}
          </Text>
        </Pressable>
      ) : null}
      </Animated.View>

      {/* Today's skin weather, and one thing her journal or Rekod says */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('Skin weather today')}</Text>
      <SkinForecast forecast={forecast} now={weather} season={SEASONS[currentSeason(new Date(), coords?.latitude ?? null).id]}
        signals={forecastSignals} onEnableLocation={enableLocation} />

      {/* Check any product, right under the skin weather (Lita, 2026-10-25) */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('Check a product')}</Text>
      {/* Searching without the product in hand is Premium: a free account gets the
          scan first, and the search says it's Premium (full audit, 2026-10-25). */}
      <View style={styles.searchRow}>
        {premium === false ? (
          <Pressable onPress={() => { tap(); navigation.navigate('Scanner') }} accessibilityLabel={t('Scan a product')}
            style={({ pressed }) => [styles.scanBtn, { flex: 1, justifyContent: 'center', backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <Ionicons name="scan-outline" size={20} color={colors.onPrimary} />
            <Text style={[TYPE.bodyStrong, { color: colors.onPrimary }]}>{t('Scan a product')}</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={() => navigation.navigate('Search')} style={[styles.search, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <Text style={[TYPE.body, { color: colors.muted, flex: 1 }]} numberOfLines={1}>{t('Search a product')}</Text>
            </Pressable>
            <Pressable onPress={() => { tap(); navigation.navigate('Scanner') }} accessibilityLabel={t('Scan a product')}
              style={({ pressed }) => [styles.scanBtn, { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
              <Ionicons name="scan-outline" size={20} color={colors.onPrimary} />
              <Text style={[TYPE.bodyStrong, { color: colors.onPrimary }]}>{t('Scan')}</Text>
            </Pressable>
          </>
        )}
      </View>
      {premium === false ? (
        <Pressable onPress={() => navigation.navigate('Search')} hitSlop={6} style={styles.learnLink}>
          <Ionicons name="search" size={14} color={colors.primary} />
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Search without the product')} <Ionicons name="diamond" size={11} color={colors.primary} /></Text>
        </Pressable>
      ) : null}


      {/* One card of the moment, the most important first (Lita's audit, 2026-10-24) */}
      {moments.length ? (
        <View>
          {moments[0]}
          {momentsOpen ? moments.slice(1) : moments.length > 1 ? (
            <Pressable onPress={() => setMomentsOpen(true)} hitSlop={6} style={{ alignSelf: 'center', marginTop: SPACING.sm }}>
              <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('{n} more', { n: moments.length - 1 })}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* 2 · The routine due now */}
      <Text style={[styles.section, { color: colors.muted }]}>{now === 'morning' ? t('This morning') : t('Tonight')}</Text>
      {now === 'morning'
        ? <Row period="morning" icon="sunny-outline" title={t('Morning routine')} count={morning} />
        : <Row period="evening" icon="moon-outline" title={tonight ? t(tonight.label) : t('Evening routine')} count={evening} />}
      {sos.plan ? (
        <Pressable onPress={() => navigation.navigate('Emergency')} style={[styles.sosLine, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name={sos.plan.situation.icon} size={16} color={colors.primary} />
          <Text style={[TYPE.caption, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {sos.plan.phase === 'return'
              ? (sos.plan.comingBack
                ? t('Gradual return · today, {what} comes back', { what: t(RETURN_LABELS[sos.plan.comingBack]).toLowerCase() })
                : t('Gradual return · day {day} of {total}', { day: sos.plan.returnDay, total: sos.plan.returnDays }))
              : t('Day {day} of 7 · {title}', { day: sos.plan.dayIndex + 1, title: t(sos.plan.situation.title) })}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.muted} />
        </Pressable>
      ) : null}

      {/* One tip a day: water and sun by day, sleep at night (Lita, 2026-10-25) */}
      {(() => {
        const tip = tipOfTheMoment({ period: afterSunrise && hour < 18 ? 'day' : 'evening', sleptHours: todayEntry?.sleep_hours ?? null })
        return (
          <View style={[styles.tip, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={afterSunrise && hour < 18 ? 'water-outline' : 'bed-outline'} size={16} color={colors.primary} />
            <Text style={[TYPE.caption, { color: colors.text, flex: 1, lineHeight: 18 }]}>{t(tip.text, tip.params)}</Text>
          </View>
        )
      })()}

      {/* 3 · Today's check-in (one line once done) */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('Your skin today')}</Text>
      {/* Last night's sleep, in the morning only */}
      {now === 'morning' ? (sleepDone && !sleepOpen ? (
        <Pressable onPress={() => setSleepOpen(true)} style={[styles.logCard, styles.logRow, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: SPACING.sm }]}>
          <View style={[styles.logIcon, { backgroundColor: colors.successSoft }]}><Ionicons name="bed-outline" size={20} color={colors.success} /></View>
          <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{t('Slept {n} h · {how}', { n: todayEntry.sleep_hours, how: t(SLEEP_QUALITY.find(q => q.value === todayEntry.sleep_quality)?.label).toLowerCase() })}</Text>
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Edit')}</Text>
        </Pressable>
      ) : (
        <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: SPACING.sm }]}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('How did you sleep?')}</Text>
          <View style={[styles.chipsRow, { marginTop: SPACING.md }]}>
            {SLEEP_QUALITY.map(q => {
              const on = todayEntry?.sleep_quality === q.value
              return (
                <Pressable key={q.value} onPress={() => pickSleep({ quality: q.value })} accessibilityState={{ selected: on }}
                  style={[styles.sleepChip, { flex: 1, backgroundColor: on ? colors.primary : colors.primarySoft }]}>
                  <MaterialCommunityIcons name={q.icon} size={18} color={on ? colors.onPrimary : colors.primary} />
                  <Text style={[TYPE.caption, { color: on ? colors.onPrimary : colors.primary, fontWeight: '700' }]}>{t(q.label)}</Text>
                </Pressable>
              )
            })}
          </View>
          <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.md }]}>{t('How many hours?')}</Text>
          <View style={[styles.chipsRow, { marginTop: SPACING.sm }]}>
            {SLEEP_HOURS.map(h => {
              const on = todayEntry?.sleep_hours != null && Number(todayEntry.sleep_hours) === h
              return (
                <Pressable key={h} onPress={() => pickSleep({ hours: h })} accessibilityState={{ selected: on }}
                  style={[styles.sleepChip, { flex: 1, backgroundColor: on ? colors.primary : colors.primarySoft }]}>
                  <Text style={[TYPE.caption, { color: on ? colors.onPrimary : colors.primary, fontWeight: '700' }]}>{h === 4 ? '≤4' : h === 9 ? '9+' : h}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      )) : null}
      {todayMood && !checkinOpen ? (
        <Pressable onPress={() => setCheckinOpen(true)} style={[styles.logCard, styles.logRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.logIcon, { backgroundColor: colors.successSoft }]}><Ionicons name="checkmark" size={20} color={colors.success} /></View>
          <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{t('Checked in · {mood}', { mood: t(MOODS.find(m => m.value === todayMood)?.label).toLowerCase() })}</Text>
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Edit')}</Text>
        </Pressable>
      ) : (
      <Pressable onPress={() => navigation.navigate('Journal', { openNew: Date.now() })} style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.logRow}>
          <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>
            {todayMood ? t('Today: {mood}', { mood: t(MOODS.find(m => m.value === todayMood)?.label).toLowerCase() }) : t('How does your skin feel?')}
          </Text>
          {todayMood ? (
            <Pressable onPress={() => navigation.navigate('Journal', { openNew: Date.now() })} hitSlop={8}>
              <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Add details')}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.moods}>
          {MOODS.map(m => {
            const on = todayMood === m.value
            return (
              <Pressable key={m.value} onPress={() => pickMood(m.value)} accessibilityLabel={t(m.label)}
                style={({ pressed }) => [styles.mood, { backgroundColor: on ? colors.primary : colors.primarySoft, transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
                <MaterialCommunityIcons name={m.icon} size={24} color={on ? colors.onPrimary : colors.primary} />
              </Pressable>
            )
          })}
        </View>
        <SkinStateChips value={sameSkinDay(entry?.date, coords) ? entry?.skin_state || [] : []} onChange={saveStates} style={{ marginTop: SPACING.md }} />
        {todayMood && MOOD_MESSAGES[todayMood] ? (
          <Text style={[styles.moodMessage, { color: colors.textSecondary }]}>{t(HOME_MOOD_MESSAGES[todayMood] || MOOD_MESSAGES[todayMood])}</Text>
        ) : null}
      </Pressable>
      )}
      <Pressable onPress={() => navigation.navigate('Skyncyclopedia')} hitSlop={6} style={styles.learnLink}>
        <Ionicons name="library-outline" size={15} color={colors.primary} />
        <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Learn about your skin: issues, ingredients, the basics')} ›</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Progress')} style={[styles.progressLink, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Ionicons name="trending-up-outline" size={18} color={colors.primary} />
        <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1, fontSize: 14 }]}>{t('See my progress')}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </Pressable>

      {/* 5 · The programme */}
      <Text style={[styles.section, { color: colors.muted }]}>{plan ? t('My Rekod') : t('Go further')}</Text>
      <Pressable onPress={() => navigation.navigate('Rekod')} style={({ pressed }) => [styles.programme, { opacity: pressed ? 0.9 : 1 }]}>
        <View style={styles.programmeIcon}><FeatureIcon name="rekod" size={22} color="#FFFFFF" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.programmeKicker}>{plan ? t('WEEK {n} OF {total}', { n: Math.min(weekOf(plan), planWeeks(plan)), total: planWeeks(plan) }) : t('PREMIUM · REKOD')}</Text>
          <Text style={styles.programmeTitle} numberOfLines={1}>{plan ? goalsTitle(plan) : t('Rekod: your skin programme, made for you')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#E2C6DA" />
      </Pressable>
    </Animated.ScrollView>

    {/* Fades in as the big greeting fades out: date, weather and greeting */}
    {(
      <Animated.View onLayout={e => setBarHeight(e.nativeEvent.layout.height)} pointerEvents={compact ? 'auto' : 'none'} style={[styles.sticky, { opacity: smallFade }, { paddingTop: insets.top + SPACING.xs, backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
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
        <Pressable onPress={() => navigation.navigate('More')} hitSlop={10} accessibilityLabel={t('Profile')} style={{ marginLeft: SPACING.md, marginRight: 4 }}>
          <ProfileAvatar name={firstName} level={journey?.level.level} size={30} color={colors.primary} textColor={colors.onPrimary} />
        </Pressable>
      </Animated.View>
    )}
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

const styles = StyleSheet.create({
  chipsRow: { flexDirection: 'row', gap: SPACING.sm },
  sleepChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 38, borderRadius: 999 },
  learnLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm },
  reactOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderRadius: 14, padding: SPACING.md, marginTop: SPACING.sm },
  modeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 5, paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  sticky: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.md },
  date: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  hello: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7, lineHeight: 38 },
  sosLine: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth },
  moodMessage: { fontSize: 13, lineHeight: 18, marginTop: SPACING.md },
  avatarSmall: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginLeft: SPACING.md },
  progressLink: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm, borderWidth: 1, borderRadius: 16, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  recap: { borderWidth: 1, borderRadius: 20, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, marginTop: SPACING.xxl },
  recapKicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  emptyBtn: { height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  helloRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xxl },
  glyph: { marginTop: 4 },
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
