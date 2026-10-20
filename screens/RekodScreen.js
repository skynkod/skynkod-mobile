import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Platform, Alert, Image, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Svg, { Circle } from 'react-native-svg'
import { useAuth } from '../utils/AuthContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { getUserRoutines } from '../utils/routines-service'
import { describeDays } from '../utils/routine-checks'
import { logError } from '../utils/errorLogger'
import { track } from '../utils/analytics'
import { searchProducts, getMyProducts } from '../utils/catalog'
import { getUserProfile, updateUserProfile } from '../utils/supabase'
import { SPACING, RADIUS, TYPE } from '../utils/theme'
import { getDekodResults, recentScan, goalsFromDekod, compareScans, checkInFromDekod } from '../utils/dekod'
import { isIntroHidden, hideIntro } from '../components/PremiumSpace'
import { getActivePlan } from '../utils/emergency-state'
import { syncSmartReminders } from '../utils/notifications'
import {
  GOALS, NIGHTS, goalOf, goalsTitle, weekOf, weekPattern, tonightNight, checkInDue,
  buildRekodRoutine, getRekodPlan, startRekod, recordCheckIn, leaveRekod, isReactive,
  findSafeAlternative, stepWithProduct, replaceRoutineStep, refreshRekodRoutine,
  decideStep, stepId, saveRekodPlan, projectRekod, programmeFinished, startMaintenance,
} from '../utils/rekod'

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' })
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const LEVEL_LABEL = { none: 'None', light: 'Light', visible: 'Visible' }
const REACTIVE = ['Rosacea', 'Eczema', 'Perioral dermatitis', 'Sensitivity']

// Premium features live in a deep plum space, like a members' area.
const C = {
  bg: '#33202E', card: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.78)', muted: 'rgba(255,255,255,0.55)',
  primary: '#E2C6DA', primarySoft: 'rgba(226,198,218,0.16)', onPrimary: '#33202E',
  success: '#A8E2BC', successSoft: 'rgba(168,226,188,0.14)',
}

function Shell({ navigation, overline, title, subtitle, footer, children, onBack, scroll = true }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.topBar}>
        {/* Rekod is a tab now: a back arrow only inside its own steps */}
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={26} color={C.text} />
          </Pressable>
        ) : <View style={{ width: 26 }} />}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name="diamond-outline" size={14} color={C.primary} />
          <Text style={[TYPE.overline, { color: C.primary }]}>Rekod · Skin programme</Text>
        </View>
        <View style={{ width: 26 }} />
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {overline ? <Text style={[TYPE.overline, { color: C.primary }]}>{overline}</Text> : null}
          {title ? <Text style={[styles.title, { color: C.text }]}>{title}</Text> : null}
          {subtitle ? <Text style={[TYPE.body, { color: C.muted, marginTop: 4 }]}>{subtitle}</Text> : null}
          {children}
        </ScrollView>
      ) : <View style={[styles.scroll, { flex: 1 }]}>{children}</View>}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  )
}

function RButton({ title, onPress, loading, disabled, outline, small, style }) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" style={({ pressed }) => [
      styles.rbutton, small && { height: 40 },
      outline ? { borderWidth: 1, borderColor: C.primary } : { backgroundColor: C.primary },
      (pressed || disabled) && { opacity: 0.7 }, style,
    ]}>
      {loading ? <ActivityIndicator color={outline ? C.primary : C.onPrimary} /> : <Text style={[TYPE.bodyStrong, { color: outline ? C.primary : C.onPrimary, fontWeight: '700', fontSize: small ? 13 : 15 }]}>{title}</Text>}
    </Pressable>
  )
}

const Loading = ({ label }) => (
  <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: SPACING.md }}>
    <ActivityIndicator color={C.primary} size="large" />
    {label ? <Text style={[TYPE.caption, { color: C.muted }]}>{label}</Text> : null}
  </View>
)

// Evidence badge shown on a routine step (see docs/rekod/regles-rekod.html).
const PROVEN = ['SPF 50', 'Retinol', 'Exfoliate', 'Azelaic acid']

export default function RekodScreen({ navigation }) {
  const colors = C
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const [plan, setPlan] = useState(undefined)
  const [routine, setRoutine] = useState(null)
  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState('intro') // intro | sensitive | experience | priority | preview
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [own, setOwn] = useState(null) // { period, index } while choosing her own product
  const [sheet, setSheet] = useState(null) // { period, idx }: a step's details
  const [checkOpen, setCheckOpen] = useState(false)
  const [scans, setScans] = useState([]) // Dekod scans, newest first
  const [fullOpen, setFullOpen] = useState(false) // the whole programme, week by week
  const [sos, setSos] = useState(null) // a 7-day plan (Emergency mode) running alongside
  const [olderDay0, setOlderDay0] = useState(null) // an older Dekod scan she chose as Day 0
  const [draft, setDraft] = useState(null) // the plan being previewed, before joining
  // The explanation shows until she hides it; then Rekod opens on the goals.
  const [introHidden, setIntroHidden] = useState(false)
  React.useEffect(() => { if (user?.id) isIntroHidden('rekod', user.id).then(setIntroHidden) }, [user?.id])

  // A changed step goes into the saved routine (members) or the preview (before joining).
  const applyStep = async (period, index, step) => {
    if (plan) {
      const steps = await replaceRoutineStep(user.id, period, index, step)
      setRoutine(r => ({ ...r, [period]: steps }))
    } else {
      setPreview(pv => ({ ...pv, [period]: pv[period].map((s, i) => (i === index ? step : s)) }))
    }
  }
  const currentStep = (period, index) => (plan ? routine : preview)?.[period]?.[index]

  const findAlternative = async (period, index) => {
    const step = currentStep(period, index)
    try {
      const alt = await findSafeAlternative(user.id, step)
      if (!alt) {
        Alert.alert('No 100% safe alternative yet', "We couldn't find a product in our catalogue that is 100% safe for your skin for this step. You can choose a product you know instead.", [
          { text: 'OK', style: 'cancel' },
          { text: 'Choose my own', onPress: () => setOwn({ period, index }) },
        ])
        return
      }
      Alert.alert('100% safe alternative found', `${alt.product.brand} ${alt.product.name}`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Use it', onPress: async () => { await applyStep(period, index, await stepWithProduct(user.id, step, alt.product)); track('rekod_alternative', { found: true }) } },
      ])
    } catch (error) {
      await logError('Rekod_alternative', error)
      Alert.alert('Something went wrong', 'Please try again.')
    }
  }

  // A flagged step: keep it (and patch test) or take it out of the routine.
  const decide = async (period, idx, decision) => {
    const target = currentStep(period, idx)
    setSheet(null)
    tap()
    try {
      if (plan) {
        const next = decideStep(plan, period, target, decision)
        await saveRekodPlan(user.id, next)
        setPlan(next)
        setRoutine(await refreshRekodRoutine(user.id, next))
      } else {
        const id = stepId(period, target)
        const key = decision === 'remove' ? 'removed' : 'accepted'
        setAnswers(a => ({ ...a, [key]: [...new Set([...(a[key] || []), id])] }))
        setPreview(pv => ({ ...pv, [period]: decision === 'remove' ? pv[period].filter((_, i) => i !== idx) : pv[period].map((st, i) => (i === idx ? { ...st, accepted: true } : st)) }))
      }
      track('rekod_flagged_step', { decision })
    } catch (error) {
      await logError('Rekod_decide', error)
      Alert.alert('Something went wrong', 'Please try again.')
    }
  }

  const chooseOwn = async (product) => {
    const { period, index } = own
    setOwn(null)
    try {
      await applyStep(period, index, await stepWithProduct(user.id, currentStep(period, index), product))
      track('rekod_own_product')
    } catch (error) {
      await logError('Rekod_own', error)
      Alert.alert('Something went wrong', 'Please try again.')
    }
  }

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      let p = await getRekodPlan(user.id)
      getActivePlan(user.id).then(setSos).catch(() => setSos(null))
      const dekod = await getDekodResults(user.id).catch(() => [])
      setScans(dekod)
      // No Day 0 yet: the first Dekod scan since the start becomes it.
      if (p && !p.baseline) {
        const first = [...dekod].reverse().find(h => new Date(h.created_at) >= new Date(p.startedAt) - 86400000)
        if (first) {
          p = { ...p, baseline: { id: first.id, at: first.created_at, points: first.result?.points } }
          saveRekodPlan(user.id, p).catch(error => logError('Rekod_baseline', error, {}, 'warn'))
        }
      }
      setPlan(p)
      if (p) {
        const res = await getUserRoutines(user.id)
        const latest = type => (res.success ? res.data.find(r => r.type === type)?.steps : null) || []
        setRoutine({ morning: latest('morning'), evening: latest('evening') })
        // Then bring it up to date with the latest safety rules and catalogue.
        refreshRekodRoutine(user.id, p).then(setRoutine).catch(error => logError('Rekod_refresh', error, {}, 'warn'))
      }
    } catch (error) {
      await logError('Rekod_load', error, {}, 'warn')
      setPlan(null)
    }
  }, [user?.id])
  useFocusEffect(useCallback(() => { load() }, [load]))

  // Up to 3 goals; the first one picked sets the programme's pace. Goals chosen
  // at sign-up are already ticked, and questions already answered aren't asked again.
  const [picked, setPicked] = useState([])
  const [known, setKnown] = useState({})
  React.useEffect(() => {
    if (!user?.id) return
    getUserProfile(user.id).then(row => {
      const sp = row?.skin_profile || {}
      setKnown({ reactivity: sp.reactivity, actives: sp.actives })
      const fromSignup = { clear: 'clear', hydration: 'hydration', even_tone: 'spots', anti_aging: 'antiaging' }
      setPicked(prev => (prev.length ? prev : (row?.skin_goals || []).map(g => fromSignup[g]).filter(Boolean).slice(0, 3)))
    }).catch(() => {})
  }, [user?.id])
  const toggleGoal = (id) => setPicked(prev => (prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev))
  const confirmGoals = () => {
    const reactive = profile?.skin_type === 'Sensitive' || [...(profile?.skin_conditions || []), ...(profile?.skin_concerns || [])].some(c => REACTIVE.includes(c))
    const base = { goal: picked[0], goals: picked, sensitive: reactive || known.reactivity === 'often' }
    if (!known.reactivity) { setAnswers(base); return setStep('sensitive') }
    if (!known.actives) { setAnswers(base); return setStep('experience') }
    const withExp = { ...base, experience: known.actives }
    setAnswers(withExp)
    if (known.actives === 'used') return setStep('priority')
    buildPreview(withExp)
  }

  const buildPreview = async (final) => {
    setBusy(true)
    try {
      const draft = { ...final, sensitive: !!final.sensitive || isReactive(profile), reactive: isReactive(profile), level: { none: 0, some: 1, used: 2 }[final.experience] ?? 0, startedAt: new Date().toISOString(), checkins: [] }
      setDraft(draft)
      setPreview(await buildRekodRoutine(user.id, draft, profile))
      setStep('preview')
    } catch (error) {
      await logError('Rekod_preview', error)
      Alert.alert('Something went wrong', 'Your programme could not be built. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Answers given here also go into the skin profile, so they're never asked twice.
  const remember = async (patch) => {
    try {
      const row = await getUserProfile(user.id)
      await updateUserProfile(user.id, { skin_profile: { ...(row?.skin_profile || {}), ...patch } })
      setKnown(k => ({ ...k, ...patch }))
    } catch (error) { logError('Rekod_remember', error, {}, 'warn') }
  }

  const answer = (key, value) => {
    if (key === 'sensitive') remember({ reactivity: value ? 'often' : 'rarely' })
    if (key === 'experience') remember({ actives: value })
    const next = { ...answers, [key]: value }
    setAnswers(next)
    if (key === 'sensitive') setStep('experience')
    else if (key === 'experience' && value === 'used') setStep('priority')
    else buildPreview(next)
  }

  const adopt = async () => {
    setBusy(true)
    try {
      const day0 = recentScan(scans) || olderDay0
      const res = await startRekod(user.id, { ...answers, baseline: day0 ? { id: day0.id, at: day0.created_at, points: day0.result?.points } : null }, profile)
      syncSmartReminders(user.id)
      track('rekod_start', { goal: answers.goal, experience: answers.experience })
      setPlan(res.plan)
      setRoutine(res.routine)
      setStep('intro')
    } catch (error) {
      await logError('Rekod_start', error)
      Alert.alert('Something went wrong', 'Your programme could not be saved. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const checkIn = async (value) => {
    setBusy(true)
    try {
      const res = await recordCheckIn(user.id, plan, value, profile)
      syncSmartReminders(user.id)
      track('rekod_checkin', { answer: value })
      setPlan(res.plan)
      setRoutine(r => ({ ...r, evening: res.routine.evening }))
    } catch (error) {
      await logError('Rekod_checkin', error)
      Alert.alert('Something went wrong', 'Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const leave = () => Alert.alert('Leave your Rekod?', 'Your current routine stays as it is. You can start a new Rekod anytime.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Leave', style: 'destructive', onPress: async () => { await leaveRekod(user.id).catch(() => {}); syncSmartReminders(user.id); setPlan(null); setStep('intro') } },
  ])

  if (plan === undefined) return <Loading />

  // ---------- The programme is over: keep the results, or a new goal ----------
  if (plan && programmeFinished(plan)) {
    const base = plan.baseline
    const latest = scans[0]
    const rows = base && latest && latest.id !== base.id ? compareScans(base.points, latest.result?.points) : null
    const keep = async () => {
      setBusy(true)
      try {
        const res = await startMaintenance(user.id, plan, profile)
        setPlan(res.plan); setRoutine(res.routine)
        syncSmartReminders(user.id)
        track('rekod_maintenance')
      } catch (error) {
        await logError('Rekod_maintenance', error)
        Alert.alert('Something went wrong', 'Please try again.')
      } finally { setBusy(false) }
    }
    const newGoal = () => Alert.alert('Start a new goal?', 'Your current routine stays until your new Rekod is ready. Questions you already answered won’t be asked again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose a new goal', onPress: async () => { await leaveRekod(user.id).catch(() => {}); syncSmartReminders(user.id); setPlan(null); setPicked([]); setStep('goals') } },
    ])
    return (
      <Shell navigation={navigation} footer={(
        <>
          <RButton title="Keep my results" onPress={keep} loading={busy} />
          <RButton outline title="Start a new goal" onPress={newGoal} style={{ marginTop: SPACING.sm }} />
        </>
      )}>
        <Text style={[TYPE.overline, { color: C.primary }]}>Programme complete</Text>
        <Text style={[styles.title, { color: C.text }]}>You did it 🌸</Text>
        <Text style={[TYPE.body, { color: C.textSecondary, marginTop: SPACING.sm, lineHeight: 22 }]}>
          {goalOf(plan.goal).weeks} weeks of {goalsTitle(plan)}. Now you can keep your results with a gentler routine, or take on a new goal.
        </Text>
        {rows ? (
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[TYPE.overline, { color: C.primary }]}>Before / after · Dekod</Text>
            {rows.map(r => (
              <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[TYPE.body, { color: C.text, flex: 1 }]}>{r.label}</Text>
                <Text style={{ color: r.trend === 'better' ? C.success : r.trend === 'worse' ? '#F2B37A' : C.muted, fontSize: 13, fontWeight: '700' }}>{LEVEL_LABEL[r.from]} → {LEVEL_LABEL[r.to]}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Pressable onPress={() => navigation.navigate('Dekod')} style={[styles.card, { backgroundColor: C.card, borderColor: C.border, flexDirection: 'row', alignItems: 'center' }]}>
            <Ionicons name="scan-circle-outline" size={24} color={C.primary} />
            <Text style={[TYPE.body, { color: C.text, flex: 1 }]}>Take a Dekod to see your before / after</Text>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </Pressable>
        )}
        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[TYPE.bodyStrong, { color: C.text }]}>Keep my results</Text>
          <Text style={[TYPE.caption, { color: C.muted, lineHeight: 18 }]}>The same products, with fewer strong nights: enough to keep what you gained, gentle enough to go on for months.</Text>
          <Text style={[TYPE.bodyStrong, { color: C.text, marginTop: SPACING.sm }]}>Start a new goal</Text>
          <Text style={[TYPE.caption, { color: C.muted, lineHeight: 18 }]}>Pick a new goal and get a new programme, built on what your skin already handles.</Text>
        </View>
      </Shell>
    )
  }

  // ---------- Following a programme: an app dashboard ----------
  if (plan) {
    const goal = goalOf(plan.goal)
    const week = Math.min(weekOf(plan), goal.weeks)
    const pattern = weekPattern(plan)
    const tonight = tonightNight(plan)
    const todayIdx = [1, 2, 3, 4, 5, 6, 0].indexOf(new Date().getDay())
    const due = checkInDue(plan)
    // A 7-day plan may pause the strong nights: say so instead of promising them.
    const pausedNights = new Set([
      ...((sos?.pause || []).includes('retinoid') ? ['retinoid'] : []),
      ...((sos?.pause || []).some(p => p === 'acid' || p === 'exfoliant') ? ['exfoliation'] : []),
    ])
    const tonightPaused = pausedNights.has(tonight)
    return (
      <Shell navigation={navigation} footer={<RButton title="Ask Koda about my Rekod" onPress={() => navigation.navigate('Koda')} />}>
        <View style={styles.dash}>
          {plan.maintenance
            ? <Ring progress={1} label="✓" sub="maintenance" />
            : <Ring progress={week / goal.weeks} label={`${week}`} sub={`of ${goal.weeks} weeks`} />}
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[TYPE.overline, { color: C.primary }]}>{plan.maintenance ? 'My Rekod · keeping my results' : 'My Rekod'}</Text>
            <Text style={[styles.dashTitle, { color: C.text }]} numberOfLines={2}>{goalsTitle(plan)}</Text>
            <View style={[styles.pill, { backgroundColor: C.primarySoft }]}>
              <Ionicons name={NIGHTS[tonight].icon} size={14} color={C.primary} />
              <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>Tonight · {NIGHTS[tonight].short}{tonightPaused ? ' · paused' : ''}</Text>
            </View>
          </View>
        </View>

        <View style={styles.weekRow}>
          {pattern.map((night, i) => {
            const strong = night === 'retinoid' || night === 'exfoliation'
            return (
              <View key={i} style={styles.dayCol}>
                <Text style={[TYPE.caption, { color: i === todayIdx ? C.text : C.muted, fontSize: 11, fontWeight: i === todayIdx ? '700' : '500' }]}>{DAY_LETTERS[i]}</Text>
                <View style={[styles.dayDot, { backgroundColor: strong ? C.primary : C.primarySoft, borderWidth: i === todayIdx ? 2 : 0, borderColor: C.text }]}>
                  <Ionicons name={NIGHTS[night].icon} size={14} color={strong ? C.onPrimary : C.primary} />
                </View>
              </View>
            )
          })}
        </View>

        {pausedNights.size ? (
          <Pressable onPress={() => navigation.navigate('Emergency')} style={[styles.card, { backgroundColor: C.card, borderColor: C.border, flexDirection: 'row', alignItems: 'center' }]}>
            <Ionicons name="medkit-outline" size={22} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.bodyStrong, { color: C.text }]}>Your 7-day plan comes first</Text>
              <Text style={[TYPE.caption, { color: C.muted, marginTop: 2, lineHeight: 18 }]}>
                {[...pausedNights].map(n => (n === 'retinoid' ? 'Retinol' : 'Exfoliation')).join(' and ')} nights are paused for now{sos?.phase === 'return' ? ', and come back step by step' : ' (until day 7)'}, then Rekod picks up where it stopped.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </Pressable>
        ) : null}

        <Pressable onPress={() => { tap(); setFullOpen(true) }} hitSlop={8} style={{ alignSelf: 'center', marginTop: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar-outline" size={15} color={C.primary} />
          <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>See my {goal.weeks}-week plan</Text>
        </Pressable>
        <FullPlan visible={fullOpen} onClose={() => setFullOpen(false)} plan={plan} routine={routine} />

        {due ? (
          <Pressable onPress={() => { tap(); setCheckOpen(true) }} style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.85 : 1 }]}>
            <Ionicons name="pulse-outline" size={20} color={C.onPrimary} />
            <Text style={[TYPE.bodyStrong, { color: C.onPrimary, flex: 1 }]}>Your weekly check-in is ready</Text>
            <Ionicons name="chevron-forward" size={18} color={C.onPrimary} />
          </Pressable>
        ) : null}

        {/* Dekod × Rekod: progress since Day 0, or the invitation to scan */}
        {(() => {
          const latest = scans[0]
          const base = plan.baseline
          const finished = weekOf(plan) > goal.weeks
          if (base && latest && latest.id !== base.id) {
            const rows = compareScans(base.points, latest.result?.points)
            return (
              <Pressable onPress={() => navigation.navigate('Dekod')} style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="scan-circle-outline" size={20} color={C.primary} />
                  <Text style={[TYPE.overline, { color: C.primary, flex: 1 }]}>{finished ? 'Before / after' : 'Your progress since Day 0'}</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.muted} />
                </View>
                {rows.map(r => (
                  <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[TYPE.body, { color: C.text, flex: 1 }]}>{r.label}</Text>
                    <Text style={{ color: r.trend === 'better' ? C.success : r.trend === 'worse' ? '#F2B37A' : C.muted, fontSize: 13, fontWeight: '700' }}>
                      {LEVEL_LABEL[r.from]} → {LEVEL_LABEL[r.to]}
                    </Text>
                  </View>
                ))}
              </Pressable>
            )
          }
          const lastScanDays = latest ? (Date.now() - new Date(latest.created_at)) / 86400000 : Infinity
          if (lastScanDays < 7) return null
          return (
            <Pressable onPress={() => { tap(); navigation.navigate('Dekod') }} style={({ pressed }) => [styles.card, { backgroundColor: C.card, borderColor: C.border, flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name="scan-circle-outline" size={26} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.bodyStrong, { color: C.text }]}>{base ? 'Time for this week’s Dekod' : 'Add your Day 0 with Dekod'}</Text>
                <Text style={[TYPE.caption, { color: C.muted, marginTop: 2 }]}>{base ? 'See what changed since Day 0.' : 'A first scan, to see your progress week after week.'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </Pressable>
          )
        })()}

        <RoutineTabs routine={routine} paused={pausedNights} onOpen={(period, idx) => setSheet({ period, idx })} />

        <Pressable onPress={leave} hitSlop={10} style={{ alignSelf: 'center', marginTop: SPACING.xl }}>
          <Text style={[TYPE.caption, { color: C.muted, fontWeight: '600' }]}>Leave my Rekod</Text>
        </Pressable>

        <StepSheet step={sheet && routine?.[sheet.period]?.[sheet.idx]} onClose={() => setSheet(null)} navigation={navigation}
          onKeep={() => decide(sheet.period, sheet.idx, 'keep')} onRemove={() => decide(sheet.period, sheet.idx, 'remove')}
          onOwn={() => { const s2 = sheet; setSheet(null); setOwn({ period: s2.period, index: s2.idx }) }} />
        <BottomSheetModal visible={checkOpen} onClose={() => setCheckOpen(false)}>
          <Text style={[styles.sheetTitle, { color: C.text }]}>Any stinging or redness this week?</Text>
          <Text style={[TYPE.caption, { color: C.muted, marginTop: 4 }]}>Your plan adapts to your answer.</Text>
          {(() => {
            // A Dekod from the last 3 days points to an answer.
            const week = recentScan(scans, 3)
            const suggested = week && plan.baseline ? checkInFromDekod(plan.baseline.points, week.result?.points) : null
            return (
              <>
                {!week ? (
                  <Pressable onPress={() => { tap(); setCheckOpen(false); navigation.navigate('Dekod') }} style={[styles.option, { backgroundColor: C.primarySoft, marginTop: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                    <Ionicons name="scan-circle-outline" size={22} color={C.primary} />
                    <Text style={[TYPE.bodyStrong, { color: C.primary, flex: 1 }]}>Scan with Dekod first</Text>
                    <Ionicons name="chevron-forward" size={16} color={C.primary} />
                  </Pressable>
                ) : suggested ? (
                  <Text style={[TYPE.caption, { color: C.primary, marginTop: SPACING.md }]}>Your latest Dekod suggests the highlighted answer.</Text>
                ) : null}
                <View style={{ gap: SPACING.sm, marginTop: SPACING.lg }}>
                  {[['good', 'All good', 'Next week, a little more'], ['little', 'A little', 'We stay at this level'], ['lot', 'A lot', 'We slow down and let your skin rest']].map(([v, l, h]) => (
                    <Pressable key={v} disabled={busy} onPress={async () => { tap(); await checkIn(v); setCheckOpen(false) }} style={({ pressed }) => [styles.option, { backgroundColor: C.card, borderColor: suggested === v ? C.primary : C.border, borderWidth: suggested === v ? 2 : 1, opacity: pressed ? 0.8 : 1 }]}>
                      <Text style={[TYPE.bodyStrong, { color: C.text }]}>{l}{suggested === v ? ' · Dekod' : ''}</Text>
                      <Text style={[TYPE.caption, { color: C.muted }]}>{h}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )
          })()}
        </BottomSheetModal>
        <OwnProductPicker visible={!!own} userId={user?.id} onClose={() => setOwn(null)} onPick={chooseOwn} />
      </Shell>
    )
  }

  // ---------- Joining: a swipeable intro ----------
  if (step === 'intro' && !introHidden) {
    return (
      <Shell navigation={navigation} scroll={false} footer={(
        <>
          <RButton title="Build my Rekod" onPress={() => { tap(); setStep('goals') }} />
          <Pressable onPress={() => { tap(); hideIntro('rekod', user.id); setIntroHidden(true); setStep('goals') }} hitSlop={8} style={{ alignSelf: 'center', paddingTop: SPACING.md }}>
            <Text style={[TYPE.caption, { color: C.muted, fontWeight: '600' }]}>Got it, don’t show this again</Text>
          </Pressable>
        </>
      )}>
        <Carousel />
      </Shell>
    )
  }

  if (step === 'goals' || step === 'intro') {
    return (
      <Shell navigation={navigation} onBack={introHidden ? undefined : () => setStep('intro')}
        footer={<RButton title={picked.length ? `Continue · ${picked.length}/3` : 'Pick up to 3'} disabled={!picked.length} onPress={() => { tap(); confirmGoals() }} />}>
        <Text style={[styles.title, { color: C.text }]}>What do you want to change?</Text>
        <Text style={[TYPE.body, { color: C.muted, marginTop: 4 }]}>Pick up to 3. The first one leads your Rekod.</Text>
        {introHidden ? (
          <Pressable onPress={() => { tap(); setIntroHidden(false); setStep('intro') }} hitSlop={8} style={{ marginTop: SPACING.sm }}>
            <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>What is Rekod?</Text>
          </Pressable>
        ) : null}
        {/* Day 0: Dekod reads the skin, and suggests the goals */}
        {(() => {
          const day0 = recentScan(scans) || olderDay0
          const ideas = day0 ? goalsFromDekod(day0.result?.points) : []
          // Only older scans: offer the latest one as Day 0, or a new scan.
          if (!day0 && scans.length) {
            const last = scans[0]
            return (
              <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="scan-circle-outline" size={20} color={C.primary} />
                  <Text style={[TYPE.overline, { color: C.primary }]}>Your Day 0</Text>
                </View>
                <Text style={[TYPE.body, { color: C.text, lineHeight: 22 }]}>
                  Your last Dekod is from {new Date(last.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}. Use it as your starting point, or take a new scan for a fresher one.
                </Text>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <RButton small title="Use this scan" onPress={() => { tap(); setOlderDay0(last) }} style={{ flex: 1 }} />
                  <RButton small outline title="New scan" onPress={() => { tap(); navigation.navigate('Dekod') }} style={{ flex: 1 }} />
                </View>
              </View>
            )
          }
          if (day0 && ideas.length) {
            return (
              <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="scan-circle-outline" size={20} color={C.primary} />
                  <Text style={[TYPE.overline, { color: C.primary }]}>From your Dekod</Text>
                </View>
                <Text style={[TYPE.body, { color: C.text, lineHeight: 22 }]}>Your scan suggests: {ideas.map(id => goalOf(id).title).join(', ')}.</Text>
                <RButton small outline title="Use these goals" onPress={() => { tap(); setPicked(ideas) }} />
              </View>
            )
          }
          if (!day0) {
            return (
              <Pressable onPress={() => { tap(); navigation.navigate('Dekod') }} style={({ pressed }) => [styles.card, { backgroundColor: C.card, borderColor: C.border, flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.85 : 1 }]}>
                <Ionicons name="scan-circle-outline" size={26} color={C.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.bodyStrong, { color: C.text }]}>Start with a Dekod scan · Day 0</Text>
                  <Text style={[TYPE.caption, { color: C.muted, marginTop: 2 }]}>It suggests your goals and lets you see your progress.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </Pressable>
            )
          }
          return null
        })()}
        <View style={styles.grid}>
          {GOALS.map(g => (
            <Pressable key={g.id} onPress={() => { tap(); toggleGoal(g.id) }} style={({ pressed }) => [styles.tile, {
              backgroundColor: picked.includes(g.id) ? C.primarySoft : C.card,
              borderColor: picked.includes(g.id) ? C.primary : C.border,
              borderWidth: picked.includes(g.id) ? 2 : 1,
              opacity: !picked.includes(g.id) && picked.length >= 3 ? 0.45 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={[styles.tileIcon, { backgroundColor: C.primarySoft }]}>
                  <Ionicons name={GOAL_ICONS[g.id] || 'sparkles-outline'} size={24} color={C.primary} />
                </View>
                {picked.includes(g.id) ? (
                  <View style={styles.tileCheck}><Text style={{ color: C.onPrimary, fontSize: 12, fontWeight: '800' }}>{picked.indexOf(g.id) + 1}</Text></View>
                ) : null}
              </View>
              <Text style={[TYPE.bodyStrong, { color: C.text }]}>{g.title}</Text>
              <Text style={[TYPE.caption, { color: C.muted }]} numberOfLines={2}>{g.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </Shell>
    )
  }

  if (step === 'preview' && preview) {
    const goal = goalOf(answers.goal)
    return (
      <Shell
        navigation={navigation}
        onBack={() => setStep('goals')}
        footer={<RButton title="Start my Rekod" onPress={() => { tap(); adopt() }} loading={busy} />}
      >
        <Text style={[TYPE.overline, { color: C.primary }]}>Your Rekod · {goalsTitle(answers)}</Text>
        <Text style={[styles.title, { color: C.text }]}>Your skin, decoded.</Text>
        <View style={[styles.pill, { backgroundColor: C.primarySoft, marginTop: SPACING.sm }]}>
          <Ionicons name="calendar-outline" size={14} color={C.primary} />
          <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>{goal.weeks} weeks · {goal.results.toLowerCase()}</Text>
        </View>
        <Pressable onPress={() => { tap(); setFullOpen(true) }} hitSlop={8} style={{ marginTop: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar-outline" size={15} color={C.primary} />
          <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>See the {goal.weeks}-week plan</Text>
        </Pressable>
        {draft ? <FullPlan visible={fullOpen} onClose={() => setFullOpen(false)} plan={draft} routine={preview} /> : null}
        <RoutineTabs routine={preview} onOpen={(period, idx) => setSheet({ period, idx })} />
        <StepSheet step={sheet && preview?.[sheet.period]?.[sheet.idx]} onClose={() => setSheet(null)} navigation={navigation}
          onKeep={() => decide(sheet.period, sheet.idx, 'keep')} onRemove={() => decide(sheet.period, sheet.idx, 'remove')}
          onOwn={() => { const s2 = sheet; setSheet(null); setOwn({ period: s2.period, index: s2.idx }) }} />
        <OwnProductPicker visible={!!own} userId={user?.id} onClose={() => setOwn(null)} onPick={chooseOwn} />
      </Shell>
    )
  }

  // Quiz: one question per screen.
  const QUESTIONS = {
    sensitive: { n: 1, title: 'Does your skin react easily?', options: [{ v: false, t: 'Rarely' }, { v: true, t: 'Yes, often' }] },
    experience: { n: 2, title: 'Is your skin used to actives?', sub: 'Acids, retinol, vitamin C.', options: [{ v: 'none', t: 'Never tried them' }, { v: 'some', t: 'A little' }, { v: 'used', t: 'Yes, regularly' }] },
    priority: { n: 3, title: 'What do you want more of?', options: [{ v: 'retinoid', t: 'More retinol' }, { v: 'exfoliation', t: 'More exfoliation' }, { v: null, t: 'A bit of both' }] },
  }
  const q = QUESTIONS[step]
  if (!q || busy) return <Loading label={busy ? 'Building your Rekod…' : undefined} />
  const total = answers.experience === 'used' || step === 'priority' ? 3 : 2
  return (
    <Shell navigation={navigation} scroll={false} onBack={() => setStep(step === 'priority' ? (known.actives ? 'goals' : 'experience') : step === 'experience' ? (known.reactivity ? 'goals' : 'sensitive') : 'goals')}>
      <View style={styles.progress}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.progressBit, { backgroundColor: i < q.n ? C.primary : C.border }]} />
        ))}
      </View>
      <Text style={[TYPE.overline, { color: C.primary, marginTop: SPACING.xxl }]}>{goalOf(answers.goal).title}</Text>
      <Text style={[styles.question, { color: C.text }]}>{q.title}</Text>
      {q.sub ? <Text style={[TYPE.body, { color: C.textSecondary }]}>{q.sub}</Text> : null}
      <View style={{ gap: SPACING.md, marginTop: SPACING.xl }}>
        {q.options.map(o => {
          const selected = answers[step] === o.v
          return (
            <Pressable key={String(o.v)} onPress={() => { tap(); answer(step, o.v) }} style={({ pressed }) => [styles.option, {
              backgroundColor: selected ? C.primarySoft : C.card,
              borderColor: selected ? C.primary : C.border,
              borderWidth: selected ? 2 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            }]}>
              <Text style={[TYPE.bodyStrong, { color: C.text, fontSize: 16 }]}>{o.t}</Text>
            </Pressable>
          )
        })}
      </View>
    </Shell>
  )
}

// ---------- Pieces ----------

const tap = () => { Haptics.selectionAsync().catch(() => {}) }

const GOAL_ICONS = { clear: 'water-outline', antiaging: 'hourglass-outline', spots: 'contrast-outline', glow: 'sunny-outline', pores: 'grid-outline', calm: 'leaf-outline', hydration: 'rainy-outline' }
const STEP_ICONS = { cleanser: 'water-outline', serum: 'eyedrop-outline', moisturizer: 'leaf-outline', sunscreen: 'sunny-outline', exfoliant: 'sparkles-outline', treatment: 'moon-outline' }

const SLIDES = [
  { icon: 'diamond-outline', title: 'Rekod: the skin you always wanted', text: 'Rekod is a premium skin programme of 6 to 12 weeks, built entirely around your skin.' },
  { icon: 'flask-outline', title: 'Only actives that work', text: 'Every product is chosen for your skin, with actives backed by science, not trends.' },
  { icon: 'trending-up-outline', title: 'A plan that adapts', text: 'Actives come in gently, week by week, and your plan adjusts to how your skin reacts.' },
]

function Carousel() {
  const [page, setPage] = useState(0)
  const [width, setWidth] = useState(0)
  return (
    <View style={{ flex: 1 }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => { const p = Math.round(e.nativeEvent.contentOffset.x / Math.max(width, 1)); if (p !== page) { tap(); setPage(p) } }}>
        {SLIDES.map(s => (
          <View key={s.title} style={[styles.slide, { width }]}>
            <View style={styles.slideIcon}><Ionicons name={s.icon} size={44} color={C.primary} /></View>
            <Text style={[styles.slideTitle, { color: C.text }]}>{s.title}</Text>
            <Text style={[TYPE.body, { color: C.textSecondary, textAlign: 'center', marginTop: SPACING.md, lineHeight: 22 }]}>{s.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {SLIDES.map((_, i) => <View key={i} style={[styles.dot, { backgroundColor: i === page ? C.primary : C.border, width: i === page ? 20 : 8 }]} />)}
      </View>
    </View>
  )
}

function Ring({ progress, label, sub }) {
  const size = 104, stroke = 9, r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.primarySoft} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.primary} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - Math.max(0.03, Math.min(1, progress)))} />
      </Svg>
      <Text style={{ color: C.text, fontSize: 30, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: C.muted, fontSize: 11 }}>{sub}</Text>
    </View>
  )
}

// Morning / Evening tabs; each step is a compact row, details open in a sheet.
function RoutineTabs({ routine, onOpen, paused }) {
  const [tab, setTab] = useState(new Date().getHours() >= 16 ? 'evening' : 'morning')
  const steps = routine?.[tab] || []
  return (
    <View style={{ marginTop: SPACING.xl }}>
      <View style={[styles.segment, { backgroundColor: C.card }]}>
        {[['morning', 'Morning', 'sunny-outline'], ['evening', 'Evening', 'moon-outline']].map(([id, label, icon]) => (
          <Pressable key={id} onPress={() => { tap(); setTab(id) }} style={[styles.segmentItem, tab === id && { backgroundColor: C.primary }]}>
            <Ionicons name={icon} size={15} color={tab === id ? C.onPrimary : C.muted} />
            <Text style={[TYPE.bodyStrong, { color: tab === id ? C.onPrimary : C.muted, fontSize: 14 }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ gap: SPACING.sm, marginTop: SPACING.md }}>
        {steps.map((s, idx) => (
          <Pressable key={`${s.key}-${idx}`} onPress={() => { tap(); onOpen(tab, idx) }} style={({ pressed }) => [styles.row, { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.8 : paused?.has(s.night) ? 0.5 : 1 }]}>
            <View style={[styles.rowIcon, { backgroundColor: C.primarySoft }]}>
              <Ionicons name={s.night === 'repair' ? 'bandage-outline' : STEP_ICONS[s.key] || 'ellipse-outline'} size={18} color={C.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[TYPE.caption, { color: C.muted, fontWeight: '700', fontSize: 11, letterSpacing: 0.6 }]}>{idx + 1} · {s.action.toUpperCase()}</Text>
              <Text style={[styles.product, { color: C.text }]} numberOfLines={1}>{s.product || 'Pick a product'}</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {s.keys?.[0] ? <Text style={[styles.miniChip, { color: C.primary, backgroundColor: C.primarySoft }]}>{s.keys[0].name}</Text> : null}
                {s.days?.length ? <Text style={[styles.miniChip, { color: C.muted, backgroundColor: C.card }]}>{describeDays(s.days)}</Text> : null}
                {PROVEN.includes(s.action) ? <Text style={[styles.miniChip, { color: C.success, backgroundColor: C.successSoft }]}>Proven</Text> : null}
                {paused?.has(s.night) ? <Text style={[styles.miniChip, { color: '#F2B37A', backgroundColor: 'rgba(242,179,122,0.14)' }]}>Paused · 7-day plan</Text> : null}
              </View>
            </View>
            {s.issues?.length || !s.product ? <View style={[styles.warnDot, { backgroundColor: s.issues?.[0]?.level === 'avoid' ? '#E9A3A3' : '#E7C07A' }]} /> : null}
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

// The whole programme, week by week: what each morning and evening looks
// like, and what comes in when. A forecast: check-ins can slow it down.
const NIGHT_PRODUCT_HINT = { exfoliation: 'A gentle exfoliant, picked for your skin when it starts', retinoid: 'Your treatment, picked for your skin when it starts', repair: 'A repair serum', reset: 'Just cleanse and moisturize' }
function FullPlan({ visible, onClose, plan, routine }) {
  const [open, setOpen] = useState(null)
  if (!plan) return null
  const weeks = projectRekod(plan)
  const now = weeks.find(w => w.now)?.week || 1
  const morning = (routine?.morning || []).map(s => s.product || s.action)
  const productFor = night => (routine?.evening || []).find(s => s.night === night)?.product
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[styles.topBar, { paddingTop: SPACING.lg }]}>
          <View style={{ width: 26 }} />
          <Text style={[TYPE.overline, { color: C.primary }]}>Your {weeks.length}-week plan</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close"><Ionicons name="close" size={24} color={C.text} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.title, { color: C.text }]}>{goalsTitle(plan)}</Text>
          <Text style={[TYPE.caption, { color: C.muted, marginTop: 4, lineHeight: 18 }]}>
            The path if your skin feels good at each weekly check-in. If it reacts, your plan slows down, so some steps may come later.
          </Text>

          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="sunny-outline" size={18} color={C.primary} />
              <Text style={[TYPE.bodyStrong, { color: C.text }]}>Every morning, all {weeks.length} weeks</Text>
            </View>
            {morning.map((m, i) => <Text key={i} style={[TYPE.caption, { color: C.textSecondary }]}>{i + 1}. {m}</Text>)}
          </View>

          <View style={{ gap: SPACING.sm, marginTop: SPACING.lg }}>
            {weeks.map(w => {
              const isOpen = open === w.week || (open === null && w.week === now)
              return (
                <Pressable key={w.week} onPress={() => { tap(); setOpen(isOpen ? -1 : w.week) }}
                  style={[styles.option, { backgroundColor: w.now ? C.primarySoft : C.card, borderWidth: 1, borderColor: w.now ? C.primary : C.border, opacity: w.past ? 0.6 : 1 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                    <Text style={[TYPE.bodyStrong, { color: C.text, width: 70 }]}>Week {w.week}</Text>
                    <Text style={[TYPE.caption, { color: C.muted, flex: 1 }]}>{w.phase}</Text>
                    {w.now ? <Text style={{ color: C.primary, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>NOW</Text> : null}
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
                  </View>
                  {w.changes.length ? <Text style={[TYPE.caption, { color: C.primary, marginTop: 4 }]}>{w.changes.join(' · ')}</Text> : null}
                  {isOpen ? (
                    <View style={{ marginTop: SPACING.md, gap: SPACING.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {w.pattern.map((night, i) => {
                          const strong = night === 'retinoid' || night === 'exfoliation'
                          return (
                            <View key={i} style={styles.dayCol}>
                              <Text style={{ color: C.muted, fontSize: 11 }}>{DAY_LETTERS[i]}</Text>
                              <View style={[styles.dayDot, { width: 30, height: 30, backgroundColor: strong ? C.primary : C.primarySoft }]}>
                                <Ionicons name={NIGHTS[night].icon} size={13} color={strong ? C.onPrimary : C.primary} />
                              </View>
                            </View>
                          )
                        })}
                      </View>
                      {['retinoid', 'exfoliation', 'repair', 'reset'].filter(n => w.pattern.includes(n)).map(n => (
                        <View key={n} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                          <Ionicons name={NIGHTS[n].icon} size={15} color={C.primary} style={{ marginTop: 2 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={[TYPE.caption, { color: C.text, fontWeight: '700' }]}>
                              {n === 'retinoid' && w.azelaic ? 'Azelaic acid night' : NIGHTS[n].label} · {w.pattern.filter(x => x === n).length}×
                            </Text>
                            <Text style={[TYPE.caption, { color: C.textSecondary }]}>{productFor(n) || NIGHT_PRODUCT_HINT[n]}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

function BottomSheetModal({ visible, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        {children}
      </View>
    </Modal>
  )
}

// A step's details: why, key ingredients, safety, the product page.
function StepSheet({ step: s, onClose, navigation, onOwn, onKeep, onRemove }) {
  return (
    <BottomSheetModal visible={!!s} onClose={onClose}>
      {s ? (
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: SPACING.md }}>
          <Text style={[TYPE.overline, { color: C.primary }]}>{s.action}{s.days?.length ? ` · ${describeDays(s.days)}` : ''}</Text>
          <Text style={[styles.sheetTitle, { color: C.text }]}>{s.product || 'No product yet'}</Text>
          {s.why ? <Text style={[TYPE.body, { color: C.textSecondary, lineHeight: 22 }]}>{s.why}</Text> : null}
          {s.issues?.length ? (
            <View style={[styles.issueBox, { borderColor: s.issues[0].level === 'avoid' ? '#E9A3A3' : '#E7C07A' }]}>
              <Text style={[TYPE.caption, { color: s.issues[0].level === 'avoid' ? '#E9A3A3' : '#E7C07A', fontWeight: '700' }]}>
                {s.issues[0].level === 'avoid' ? 'Not recommended for your skin' : 'Not 100% safe for your skin'}
              </Text>
              {s.issues.map((i, n) => <Text key={n} style={[TYPE.caption, { color: C.textSecondary, lineHeight: 18 }]}>• {i.text}{i.detail ? `. ${i.detail}` : ''}</Text>)}
            </View>
          ) : null}
          {s.issues?.length && s.product ? (
            <View style={[styles.bestBox, { backgroundColor: C.card }]}>
              <Text style={[TYPE.bodyStrong, { color: C.text }]}>{s.accepted ? 'You chose to keep it' : 'The best option we found'}</Text>
              <Text style={[TYPE.caption, { color: C.textSecondary, lineHeight: 18 }]}>
                No product for this step is 100% safe for your skin yet (because of the points above), so this is the closest match.
              </Text>
              <Text style={[TYPE.caption, { color: C.primary, lineHeight: 18, fontWeight: '600' }]}>
                Patch test it first: apply a little on your jawline for 3 evenings. If it stings, itches or you break out, stop and remove it.
              </Text>
              {!s.accepted ? (
                <View style={{ gap: SPACING.sm, marginTop: SPACING.sm }}>
                  <RButton small title="Keep it and patch test" onPress={onKeep} />
                  <RButton small outline title="Remove from my routine" onPress={onRemove} />
                </View>
              ) : (
                <Pressable onPress={onRemove} hitSlop={8} style={{ marginTop: 4 }}>
                  <Text style={[TYPE.caption, { color: C.muted, fontWeight: '700' }]}>Remove from my routine</Text>
                </Pressable>
              )}
            </View>
          ) : null}
          {s.keys?.length ? (
            <View style={styles.keys}>
              {s.keys.map(k => (
                <Pressable key={k.id} onPress={() => { onClose(); navigation.navigate('Ingredient', { id: k.id }) }} style={[styles.keyChip, { backgroundColor: C.primarySoft }]}>
                  <Text style={[TYPE.caption, { color: C.primary, fontWeight: '600' }]}>{k.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {s.product_id ? <RButton title="See the product" onPress={() => { onClose(); navigation.navigate('Product', { id: s.product_id }) }} /> : null}
          <RButton outline title="Use my own product" onPress={onOwn} />
        </ScrollView>
      ) : null}
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  dash: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginTop: SPACING.md },
  dashTitle: { fontWeight: '700', letterSpacing: -0.4, fontSize: 26, lineHeight: 30 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: '#E2C6DA', borderRadius: 18, padding: SPACING.lg, marginTop: SPACING.lg },
  tile: { width: '48.5%', borderWidth: 1, borderRadius: 22, padding: SPACING.lg, gap: 6, minHeight: 132 },
  tileCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2C6DA', alignItems: 'center', justifyContent: 'center' },
  tileIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  slideIcon: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(226,198,218,0.12)', marginBottom: SPACING.xxl },
  slideTitle: { fontWeight: '700', letterSpacing: -0.4, fontSize: 32, lineHeight: 38, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: SPACING.md },
  dot: { height: 8, borderRadius: 4 },
  segment: { flexDirection: 'row', borderRadius: 999, padding: 4 },
  segmentItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 999 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderRadius: 18, padding: SPACING.md },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  miniChip: { fontSize: 11, fontWeight: '700', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  warnDot: { width: 8, height: 8, borderRadius: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  bottomSheet: { backgroundColor: '#3B2636', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: SPACING.xl, paddingBottom: SPACING.xxxl },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginBottom: SPACING.lg },
  bestBox: { borderRadius: 16, padding: SPACING.md, gap: 6 },
  sheetTitle: { fontWeight: '700', letterSpacing: -0.4, fontSize: 24, lineHeight: 30 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl },
  footer: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  title: { fontWeight: '700', letterSpacing: -0.4, fontSize: 30, lineHeight: 36, marginTop: SPACING.xs },
  bar: { height: 6, borderRadius: 999, overflow: 'hidden', marginTop: SPACING.lg },
  rbutton: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  premium: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  premiumText: { color: '#33202E', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  hero: { fontWeight: '700', letterSpacing: -0.4, fontSize: 44, lineHeight: 46, marginTop: SPACING.sm },
  serif: { fontWeight: '700', letterSpacing: -0.4, fontSize: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xl },
  goal: { width: '48.5%', borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, gap: 2 },
  card: { borderWidth: 1, borderRadius: 20, padding: SPACING.lg, gap: SPACING.md, marginTop: SPACING.lg },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xl },
  dayCol: { alignItems: 'center', gap: 4 },
  dayDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  answers: { flexDirection: 'row', gap: SPACING.sm },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, paddingVertical: 4 },
  keys: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  issueBox: { borderWidth: 1, borderRadius: 12, padding: SPACING.sm, gap: 2, marginTop: 2 },
  issueActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  smallBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  sheet: { flex: 1, backgroundColor: '#33202E', paddingTop: SPACING.xl, paddingHorizontal: SPACING.xl },
  search: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingHorizontal: 14, height: 46, color: '#FFFFFF', marginTop: SPACING.md },
  resultRow: { paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.12)' },
  keyChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  product: { fontWeight: '600', fontSize: 15 },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  progress: { flexDirection: 'row', gap: 4, marginTop: SPACING.lg },
  progressBit: { flex: 1, height: 3, borderRadius: 2 },
  question: { fontWeight: '700', letterSpacing: -0.4, fontSize: 30, lineHeight: 36, marginTop: SPACING.sm },
  option: { borderRadius: 18, padding: SPACING.lg },
})

// Her own product instead of the one we chose: her shelf first, then search.
function OwnProductPicker({ visible, userId, onClose, onPick }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  React.useEffect(() => {
    if (!visible) return
    let active = true
    const q = query.trim()
    const run = q.length >= 2
      ? searchProducts(q)
      : getMyProducts(userId).then(rows => rows.filter(r => r.product).map(r => r.product))
    const timer = setTimeout(() => run.then(r => active && setResults(r || [])).catch(() => active && setResults([])), 250)
    return () => { active = false; clearTimeout(timer) }
  }, [visible, query, userId])
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.title, { color: C.text, fontSize: 24 }]}>Your own product</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close"><Ionicons name="close" size={24} color={C.text} /></Pressable>
        </View>
        <Text style={[TYPE.caption, { color: C.muted, marginTop: 4 }]}>{query.trim().length >= 2 ? 'Search results' : 'From your products. Type to search the catalogue.'}</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search a product or brand" placeholderTextColor="rgba(255,255,255,0.45)" style={styles.search} autoFocus />
        <ScrollView keyboardShouldPersistTaps="handled" style={{ marginTop: SPACING.md }}>
          {results.map(p => (
            <Pressable key={p.id} onPress={() => onPick(p)} style={styles.resultRow}>
              <Text style={[TYPE.caption, { color: C.muted }]}>{p.brand}</Text>
              <Text style={[styles.product, { color: C.text }]}>{p.name}</Text>
            </Pressable>
          ))}
          {!results.length ? <Text style={[TYPE.caption, { color: C.muted, marginTop: SPACING.lg }]}>No products yet.</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  )
}
