import React, { useCallback, useState } from 'react'
import { markAsked } from '../utils/ask-pace'
import { View, Text, Pressable, StyleSheet, Alert, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native'
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
import { SPACING, TYPE, livePalette, liveStyles } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'
import { getDekodResults, recentScan, goalsFromDekod, compareScans, checkInFromDekod, averagePoints, startPoints } from '../utils/dekod'
import { isIntroHidden } from '../components/PremiumSpace'
import { usePremium } from '../components/PremiumLock'
import { getActivePlan } from '../utils/emergency-state'
import { isReactiveState, stateLabel, REACTIVE as REACTIVE_STATES } from '../utils/skin-state'
import { prioritiesOf } from '../utils/skin-quiz'
import { syncSmartReminders } from '../utils/notifications'
import {
  GOALS, NIGHTS, nightInfo, goalOf, goalsTitle, weekOf, weekPattern, tonightNight, checkInDue,
  buildRekodRoutine, getRekodPlan, startRekod, recordCheckIn, leaveRekod, isReactive,
  findSafeAlternative, stepWithProduct, replaceRoutineStep, refreshRekodRoutine,
  decideStep, stepId, saveRekodPlan, projectRekod, programmeFinished, startMaintenance,
  conflictWith, planWeeks, planWhy, extendRekod, restorePreviousRoutine, regularityOf, endAdvice, optionsForStep,
} from '../utils/rekod'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
// Each goal's issue sheet (utils/encyclopedia/conditions.js).
const GOAL_CONDITION = { clear: 'inflammatory-acne', spots: 'pih', antiaging: 'fine-lines', glow: 'dullness', pores: 'enlarged-pores', calm: 'sensitive-skin', hydration: 'dehydrated-skin' }
const LEVEL_LABEL = { none: 'None', light: 'Light', visible: 'Visible' }
const REACTIVE = ['Rosacea', 'Eczema', 'Perioral dermatitis', 'Sensitivity']

// Light and calm like the rest of the app (Lita, 2026-10-23); deep plum marks
// what is Premium.
const C = livePalette({ plum: ['#33202E', '#E8D6E1'] })

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
          <Ionicons name="diamond" size={12} color={C.plum} />
          <Text style={[TYPE.overline, { color: C.plum }]}>Rekod · Premium</Text>
        </View>
        {/* Always a way out, back to where she came from */}
        <Pressable onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={C.text} />
        </Pressable>
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
  useTheme() // redraws in the colours of the mode on screen
  const colors = C
  const { user } = useAuth()
  // The explanation and the quiz are free; her personal routine and plan are Premium.
  const premium = usePremium()
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
  // End of the programme: her answer to "Do you see a difference?", and how regular she was.
  const [endAnswer, setEndAnswer] = useState(null)
  const [regularity, setRegularity] = useState(null)
  React.useEffect(() => {
    if (!user?.id || !plan || !programmeFinished(plan)) return
    regularityOf(user.id, plan).then(setRegularity).catch(() => setRegularity(1))
  }, [user?.id, plan?.startedAt, plan?.maintenance, plan?.extraWeeks])
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

  // Another suggested product for a step (from "Other options").
  const chooseOption = async (period, index, product) => {
    try {
      await applyStep(period, index, await stepWithProduct(user.id, currentStep(period, index), product))
      track('rekod_other_option')
    } catch (error) {
      await logError('Rekod_option', error)
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
      // Her main then secondary concern lead the goal list (Lita, 2026-10-24).
      const fromConcern = { Acne: 'clear', 'Dark spots': 'spots', 'Fine lines': 'antiaging', Redness: 'calm', Sensitivity: 'calm', Dryness: 'hydration', Dullness: 'glow', 'Large pores': 'pores' }
      const { main, second } = prioritiesOf({ concerns: sp.concerns || row?.skin_concerns || [], priority: sp.priority, secondary: sp.secondary })
      const first = [main, second].map(c => fromConcern[c]).filter(Boolean)
      setPicked(prev => (prev.length ? prev : [...first, ...(row?.skin_goals || []).map(g => fromSignup[g])].filter(Boolean).reduce((list, g) => (list.length < 3 && !conflictWith(list, g) && !list.includes(g) ? [...list, g] : list), [])))
    }).catch(() => {})
  }, [user?.id])
  const confirmGoals = (list = picked) => {
    const reactive = profile?.skin_type === 'Sensitive' || [...(profile?.skin_conditions || []), ...(profile?.skin_concerns || [])].some(c => REACTIVE.includes(c))
    const base = { goal: list[0], goals: list, sensitive: reactive || known.reactivity === 'often' }
    if (!known.reactivity) { setAnswers(base); return setStep('sensitive') }
    if (!known.actives) { setAnswers(base); return setStep('experience') }
    const withExp = { ...base, experience: known.actives }
    setAnswers(withExp)
    setStep(known.actives === 'used' ? 'priority' : 'products')
  }

  // The quiz, one question per screen: only what we don't know yet.
  const quizOrder = ['goals', ...(!known.reactivity ? ['sensitive'] : []), ...(!known.actives ? ['experience'] : []), ...((answers.experience || known.actives) === 'used' ? ['priority'] : []), 'products']
  const quizProgress = (id) => {
    const i = Math.max(0, quizOrder.indexOf(id))
    return (
      <View style={{ marginTop: SPACING.sm }}>
        <Text style={[TYPE.caption, { color: C.muted, textAlign: 'center' }]}>{i + 1} / {quizOrder.length}</Text>
        <View style={[styles.quizBar, { backgroundColor: C.border }]}><View style={{ width: `${((i + 1) / quizOrder.length) * 100}%`, height: 3, borderRadius: 2, backgroundColor: C.primary }} /></View>
      </View>
    )
  }

  const buildPreview = async (final) => {
    setBusy(true)
    try {
      const draft = { ...final, sensitive: !!final.sensitive || isReactive(profile), reactive: isReactive(profile), level: { none: 0, some: 1, used: 2 }[final.experience] ?? 0, startedAt: new Date().toISOString(), checkins: [] }
      // The built routine tells the preview what the plan holds (pregnancy, steps with no safe product).
      const built = await buildRekodRoutine(user.id, draft, profile)
      setDraft({ ...draft, ...built.flags })
      setPreview(built)
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
    const experience = next.experience || known.actives
    if (key === 'sensitive') setStep(!known.actives ? 'experience' : experience === 'used' ? 'priority' : 'products')
    else if (key === 'experience') setStep(value === 'used' ? 'priority' : 'products')
    else if (key === 'priority') setStep('products')
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
      markAsked(user.id)
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

  // ---------- The programme is over: did it work, then what next ----------
  if (plan && programmeFinished(plan)) {
    const base = plan.baseline
    const latest = scans[0]
    // The last 3 scans averaged: one odd photo doesn't make a result (Dekod v2).
    const rows = base && latest && latest.id !== base.id ? compareScans(startPoints(scans, plan.startedAt, base.points), averagePoints(scans, 3)) : null
    const weeksDone = planWeeks(plan)
    const advice = endAnswer ? endAdvice(plan, endAnswer, regularity ?? 1) : null
    const run = async (fn, event) => {
      setBusy(true)
      try { await fn(); track(event) } catch (error) {
        await logError('Rekod_end', error)
        Alert.alert('Something went wrong', 'Please try again.')
      } finally { setBusy(false) }
    }
    const keep = mode => run(async () => {
      const res = await startMaintenance(user.id, plan, profile, mode)
      setPlan(res.plan); setRoutine(res.routine); syncSmartReminders(user.id); setEndAnswer(null)
    }, `rekod_end_${mode}`)
    const extend = () => run(async () => { setPlan(await extendRekod(user.id, plan, 4)); setEndAnswer(null) }, 'rekod_end_extend')
    const backToBefore = () => Alert.alert('Back to your routine before Rekod?', 'It comes back exactly as it was. Without your actives, your results may fade over time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Go back', onPress: () => run(async () => { await restorePreviousRoutine(user.id, plan); syncSmartReminders(user.id); setPlan(null); setEndAnswer(null); setStep('intro') }, 'rekod_end_previous') },
    ])
    const newGoal = () => Alert.alert('Start a new goal?', 'Your current routine stays until your new Rekod is ready. Questions you already answered won’t be asked again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose a new goal', onPress: async () => { await leaveRekod(user.id).catch(() => {}); syncSmartReminders(user.id); setPlan(null); setPicked([]); setEndAnswer(null); setStep('goals') } },
    ])
    const CHOICES = [
      { id: 'gentle', icon: 'leaf-outline', title: 'Keep my results', text: 'The same products, with fewer strong evenings. Made to last for months.', onPress: () => keep('gentle') },
      { id: 'extend', icon: 'add-circle-outline', title: 'Extend 4 weeks', text: 'The same pace for 4 more weeks, then a new check.', onPress: extend },
      { id: 'asis', icon: 'checkmark-circle-outline', title: 'Keep my routine as it is', text: 'Your skin is happy: same products, same rhythm.', onPress: () => keep('asis') },
      { id: 'simple', icon: 'remove-circle-outline', title: 'A simpler routine', text: 'Cleanser, cream and SPF, with one active two evenings a week.', onPress: () => keep('simple') },
      plan.previous ? { id: 'previous', icon: 'arrow-undo-outline', title: 'Back to my routine before Rekod', text: 'Put back exactly as it was.', onPress: backToBefore } : null,
      { id: 'newgoal', icon: 'flag-outline', title: 'A new goal', text: 'A new programme, built on what your skin already handles.', onPress: newGoal },
    ].filter(Boolean)
    const ordered = advice ? [...CHOICES.filter(c => c.id === advice.choice), ...CHOICES.filter(c => c.id !== advice.choice)] : CHOICES
    return (
      <Shell navigation={navigation} onBack={endAnswer ? () => setEndAnswer(null) : undefined}>
        <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700', marginTop: SPACING.md }]}>{goalsTitle(plan)} · {weeksDone} weeks</Text>
        <Text style={[styles.title, { color: C.text }]}>{endAnswer ? 'What would you like now?' : 'Your programme is done 🌸'}</Text>

        {!endAnswer ? (
          <>
            {rows ? (
              <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
                <Text style={[TYPE.bodyStrong, { color: C.text }]}>Your Dekod, before and after</Text>
                {rows.map(r => (
                  <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[TYPE.body, { color: C.text, flex: 1 }]}>{r.label}</Text>
                    <Text style={{ color: r.trend === 'better' ? C.success : r.trend === 'worse' ? C.warning : C.muted, fontSize: 13, fontWeight: '700' }}>{LEVEL_LABEL[r.from]} → {LEVEL_LABEL[r.to]}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Pressable onPress={() => navigation.navigate('Dekod')} style={[styles.card, { backgroundColor: C.card, borderColor: C.border, flexDirection: 'row', alignItems: 'center' }]}>
                <Ionicons name="scan-circle-outline" size={24} color={C.primary} />
                <Text style={[TYPE.body, { color: C.text, flex: 1 }]}>Take a Dekod to compare with your Day 0</Text>
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </Pressable>
            )}
            {regularity !== null ? (
              <Text style={[TYPE.caption, { color: C.muted, marginTop: SPACING.md }]}>You did your routine on {Math.round(regularity * 100)}% of the days.</Text>
            ) : null}
            <Text style={[styles.question, { color: C.text, marginTop: SPACING.xl, fontSize: 24, lineHeight: 30 }]}>Do you see a difference?</Text>
            <View style={{ gap: SPACING.sm, marginTop: SPACING.lg }}>
              {[['yes', 'Yes, clearly'], ['little', 'A little'], ['no', 'Not really']].map(([v, label]) => (
                <Pressable key={v} onPress={() => { tap(); setEndAnswer(v); track('rekod_end_answer', { answer: v }) }} style={({ pressed }) => [styles.option, { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                  <Text style={[TYPE.bodyStrong, { color: C.text, fontSize: 16 }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: C.primarySoft, borderColor: C.primarySoft }]}>
              <Text style={[TYPE.bodyStrong, { color: C.text }]}>Our advice</Text>
              <Text style={[TYPE.body, { color: C.textSecondary, lineHeight: 22 }]}>{advice.why}</Text>
              {advice.choice === 'newgoal' ? (
                <Pressable onPress={() => navigation.navigate('Koda')} hitSlop={8}>
                  <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>Ask Koda about my skin</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={{ gap: SPACING.sm, marginTop: SPACING.lg }}>
              {ordered.map((c, i) => {
                const best = i === 0
                return (
                  <Pressable key={c.id} disabled={busy} onPress={() => { tap(); c.onPress() }} style={({ pressed }) => [styles.option, {
                    backgroundColor: best ? C.primarySoft : C.card, borderWidth: best ? 2 : 1, borderColor: best ? C.primary : C.border,
                    flexDirection: 'row', alignItems: 'center', gap: SPACING.md, opacity: busy ? 0.6 : pressed ? 0.85 : 1,
                  }]}>
                    <Ionicons name={c.icon} size={20} color={C.primary} />
                    <View style={{ flex: 1 }}>
                      {best ? <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>Recommended for you</Text> : null}
                      <Text style={[TYPE.bodyStrong, { color: C.text }]}>{c.title}</Text>
                      <Text style={[TYPE.caption, { color: C.muted, marginTop: 2, lineHeight: 17 }]}>{c.text}</Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
            <Text style={[TYPE.caption, { color: C.muted, marginTop: SPACING.lg, lineHeight: 18 }]}>Whatever you choose, a short Rekod review comes back every 4 weeks, and you can change your mind anytime.</Text>
          </>
        )}
      </Shell>
    )
  }

  // ---------- Following a programme: an app dashboard ----------
  if (plan) {
    const goal = { ...goalOf(plan.goal), weeks: planWeeks(plan) }
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
              <Ionicons name={nightInfo(plan, tonight).icon} size={14} color={C.primary} />
              <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>Tonight · {nightInfo(plan, tonight).short}{tonightPaused ? ' · paused' : ''}</Text>
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
        {/* Her skin today (check-in): a strong night waits while it is irritated */}
        {isReactiveState(profile?.skinState?.states) && (tonight === 'retinoid' || tonight === 'exfoliation') ? (
          <View style={[styles.card, { backgroundColor: C.primarySoft, borderColor: C.border, flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }]}>
            <Ionicons name="time-outline" size={18} color={C.primary} style={{ marginTop: 1 }} />
            <Text style={[TYPE.caption, { color: C.text, flex: 1, lineHeight: 18 }]}>
              Not right for you tonight: your skin is {stateLabel(profile.skinState.states.find(x => REACTIVE_STATES.includes(x))).toLowerCase()}. Skip the {nightInfo(plan, tonight).short.toLowerCase()} and make it a repair night. Your plan stays the same.
            </Text>
          </View>
        ) : null}

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

        {premium === false ? (
          // Without Premium she keeps her routine as it is today; it no longer adapts.
          <Pressable onPress={() => { tap(); navigation.navigate('Premium') }} style={[styles.card, { backgroundColor: C.card, borderColor: C.primary, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center' }]}>
            <Ionicons name="lock-closed-outline" size={20} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.bodyStrong, { color: C.text }]}>Your routine stays as it is</Text>
              <Text style={[TYPE.caption, { color: C.muted, marginTop: 2, lineHeight: 18 }]}>With Premium, it adapts to your skin every week and the next weeks unlock.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.muted} />
          </Pressable>
        ) : due ? (
          <Pressable onPress={() => { tap(); setCheckOpen(true) }} style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.85 : 1 }]}>
            <Ionicons name="pulse-outline" size={20} color={C.onPrimary} />
            <Text style={[TYPE.bodyStrong, { color: C.onPrimary, flex: 1 }]}>{plan.maintenance ? 'Your 4-week Rekod review is ready' : 'Your weekly Rekod review is ready'}</Text>
            <Ionicons name="chevron-forward" size={18} color={C.onPrimary} />
          </Pressable>
        ) : null}

        {/* Dekod × Rekod: progress since Day 0, or the invitation to scan */}
        {(() => {
          const latest = scans[0]
          const base = plan.baseline
          const finished = weekOf(plan) > goal.weeks
          if (base && latest && latest.id !== base.id) {
            const rows = compareScans(startPoints(scans, plan.startedAt, base.points), averagePoints(scans, 3))
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
                    <Text style={{ color: r.trend === 'better' ? C.success : r.trend === 'worse' ? C.warning : C.muted, fontSize: 13, fontWeight: '700' }}>
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
          onOwn={() => { const s2 = sheet; setSheet(null); setOwn({ period: s2.period, index: s2.idx }) }}
          userId={user?.id} onPick={product => { const s2 = sheet; setSheet(null); chooseOption(s2.period, s2.idx, product) }} />
        <BottomSheetModal visible={checkOpen} onClose={() => setCheckOpen(false)}>
          <Text style={[styles.sheetTitle, { color: C.text }]}>{plan.maintenance ? 'Is your skin still doing well?' : 'Any stinging or redness this week?'}</Text>
          <Text style={[TYPE.caption, { color: C.muted, marginTop: 4 }]}>Your plan adapts to your answer.</Text>
          {(() => {
            // A Dekod from the last 3 days points to an answer.
            const week = recentScan(scans, 3)
            // This week's scans (up to 3) averaged, against Day 0.
            const suggested = week && plan.baseline ? checkInFromDekod(startPoints(scans, plan.startedAt, plan.baseline.points), averagePoints(scans.filter(s => Date.now() - new Date(s.created_at).getTime() <= 7 * 86400000), 3)) : null
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

  // ---------- Joining: one clear screen, Premium said from the start ----------
  if (step === 'intro' && !introHidden) {
    return (
      <Shell navigation={navigation} footer={<RButton title="Start the free quiz" onPress={() => { tap(); setStep('goals') }} />}>
        <View style={[styles.pill, { backgroundColor: C.primarySoft, marginTop: SPACING.md }]}>
          <Ionicons name="diamond" size={11} color={C.plum} />
          <Text style={[TYPE.caption, { color: C.plum, fontWeight: '700' }]}>{premium ? 'Included in your Premium' : 'Premium · free quiz'}</Text>
        </View>
        <Text style={[styles.title, { color: C.text, marginTop: SPACING.md }]}>A skincare plan made for your skin</Text>
        <Text style={[TYPE.body, { color: C.textSecondary, marginTop: SPACING.sm, lineHeight: 22 }]}>Answer a few quick questions and see your plan before you decide.</Text>
        <View style={{ gap: SPACING.lg, marginTop: SPACING.xxl }}>
          {[
            ['calendar-outline', '4 to 12 weeks, up to 3 goals'],
            ['flask-outline', 'Your own products first'],
            ['heart-outline', 'Slows down if your skin reacts'],
          ].map(([icon, text]) => (
            <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
              <View style={[styles.howNum, { backgroundColor: C.primarySoft }]}><Ionicons name={icon} size={17} color={C.primary} /></View>
              <Text style={[TYPE.body, { color: C.text, flex: 1 }]}>{text}</Text>
            </View>
          ))}
        </View>
      </Shell>
    )
  }

  if (step === 'goals' || step === 'intro') {
    // A recent Dekod points to goals: shown as a hint on those options.
    const day0 = recentScan(scans) || scans[0]
    const ideas = day0 ? goalsFromDekod(day0.result?.points) : []
    const toggle = id => setPicked(prev => (prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 && !conflictWith(prev, id) ? [...prev, id] : prev))
    return (
      <Shell navigation={navigation} onBack={() => { setIntroHidden(false); setStep('intro') }}
        footer={<RButton title={picked.length ? 'Continue' : 'Pick at least one goal'} disabled={!picked.length} onPress={() => { tap(); confirmGoals() }} />}>
        {quizProgress('goals')}
        <Text style={[styles.question, { color: C.text, marginTop: SPACING.xl }]}>What would you like to work on?</Text>
        <Text style={[TYPE.body, { color: C.textSecondary, marginTop: 4 }]}>Up to 3 goals that work well together. The first one leads your plan.</Text>
        <View style={{ gap: SPACING.sm, marginTop: SPACING.xl }}>
          {GOALS.map(g => {
            const pos = picked.indexOf(g.id)
            const on = pos >= 0
            const blocker = on ? null : conflictWith(picked, g.id)
            const full = !on && !blocker && picked.length >= 3
            return (
              <Pressable key={g.id} disabled={!!blocker || full} onPress={() => { tap(); toggle(g.id) }} style={({ pressed }) => [styles.option, {
                backgroundColor: on ? C.primarySoft : C.card, borderColor: on ? C.primary : C.border, borderWidth: on ? 2 : 1,
                flexDirection: 'row', alignItems: 'center', gap: SPACING.md, opacity: blocker || full ? 0.45 : 1, transform: [{ scale: pressed ? 0.98 : 1 }],
              }]}>
                <Ionicons name={GOAL_ICONS[g.id] || 'sparkles-outline'} size={20} color={C.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.bodyStrong, { color: C.text }]}>{g.title}</Text>
                  <Text style={[TYPE.caption, { color: C.muted }]}>
                    {blocker ? `Not with ${goalOf(blocker).title}: ${blocker === 'calm' || g.id === 'calm' ? 'a reactive skin first repairs its barrier, without exfoliation' : 'they work against each other'}` : g.subtitle}
                  </Text>
                </View>
                {ideas.includes(g.id) && !on ? <Text style={[styles.miniChip, { color: C.primary, backgroundColor: C.primarySoft }]}>From your Dekod</Text> : null}
                {on ? <View style={styles.pickNum}><Text style={{ color: C.onPrimary, fontSize: 12, fontWeight: '800' }}>{pos + 1}</Text></View> : null}
              </Pressable>
            )
          })}
        </View>
      </Shell>
    )
  }

  if (step === 'preview' && preview) {
    const weeks = draft ? projectRekod(draft) : []
    const total = draft ? planWeeks(draft) : goalOf(answers.goal).weeks
    const longest = (answers.goals?.length ? answers.goals : [answers.goal]).reduce((a, g) => (goalOf(g).weeks > goalOf(a).weeks ? g : a), answers.goal)
    const first = weeks[0]
    const kept = [...(preview.morning || []), ...(preview.evening || [])].filter(x => x.owned).length
    const locked = premium === false
    const nightsIn = first ? ['exfoliation', 'retinoid', 'repair', 'reset'].filter(n => first.pattern.includes(n)) : []
    const activesFrom = weeks.find(w => w.week > 1 && (w.counts.ret > first?.counts.ret || w.counts.ex > first?.counts.ex))?.week
    return (
      <Shell
        navigation={navigation}
        onBack={() => setStep('products')}
        footer={(
          <>
            {locked
              ? <RButton title="Start · 7 days free" onPress={() => { tap(); navigation.navigate('Premium') }} />
              : <RButton title="Start my Rekod" onPress={() => { tap(); adopt() }} loading={busy} />}
            {locked ? <Text style={[TYPE.caption, { color: C.muted, textAlign: 'center', marginTop: SPACING.sm }]}>Cancel anytime</Text> : null}
          </>
        )}
      >
        <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700', marginTop: SPACING.md }]}>Your plan · {goalsTitle(answers)}</Text>
        <Text style={[styles.title, { color: C.text }]}>{total} weeks</Text>
        <Text style={[TYPE.body, { color: C.textSecondary, marginTop: SPACING.xs, lineHeight: 22 }]}>{draft ? planWhy(draft) : goalOf(answers.goal).why}</Text>

        <Text style={[styles.section, { color: C.muted }]}>WHAT YOU'LL DO</Text>
        <View style={[styles.tileRow, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Ionicons name="sunny-outline" size={17} color={C.primary} />
            <Text style={[TYPE.bodyStrong, { color: C.text }]}>Every morning, the same steps</Text>
          </View>
          <Text style={[TYPE.caption, { color: C.textSecondary, marginTop: 6 }]}>{(preview.morning || []).map(x => MORNING_WORDS[x.key] || x.action).join(' → ')}</Text>
        </View>
        {first ? (
          <View style={[styles.tileRow, { backgroundColor: C.card, borderColor: C.border, marginTop: SPACING.sm }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Ionicons name="moon-outline" size={17} color={C.primary} />
              <Text style={[TYPE.bodyStrong, { color: C.text }]}>In the evening, it changes through the week</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md }}>
              {first.pattern.map((night, i) => {
                const strong = night === 'retinoid' || night === 'exfoliation'
                return (
                  <View key={i} style={styles.dayCol}>
                    <Text style={{ color: C.muted, fontSize: 11 }}>{DAY_LETTERS[i]}</Text>
                    <View style={[styles.dayDot, { width: 32, height: 32, backgroundColor: strong ? C.primary : C.primarySoft }]}>
                      <Ionicons name={NIGHTS[night].icon} size={14} color={strong ? C.onPrimary : C.primary} />
                    </View>
                  </View>
                )
              })}
            </View>
            <View style={{ gap: 6, marginTop: SPACING.md }}>
              {nightsIn.map(n => (
                <View key={n} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Ionicons name={NIGHTS[n].icon} size={14} color={C.primary} style={{ marginTop: 2 }} />
                  <Text style={[TYPE.caption, { color: C.textSecondary, flex: 1, lineHeight: 18 }]}>
                    <Text style={{ color: C.text, fontWeight: '700' }}>{n === 'retinoid' ? TREATMENT_LABEL[first.treatment] : NIGHTS[n].label}</Text>: {NIGHT_WORDS[n === 'retinoid' ? first.treatment : n]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={[styles.section, { color: C.muted }]}>WHAT TO EXPECT</Text>
        {[
          ['Weeks 1 and 2', 'Your skin gets used to the routine. Gentle, no rush.'],
          activesFrom && activesFrom < total ? [`From week ${activesFrom}`, 'Your actives increase step by step, only if your skin is fine.'] : null,
          [goalOf(longest).results.replace(/^First change /, 'First change: '), 'Most people notice it around then. Every skin is different.'],
          [`Week ${total}`, GOAL_END[longest] || 'Your result'],
        ].filter(Boolean).map(([when, what], i, arr) => (
          <View key={when} style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.timeDot, { backgroundColor: i === arr.length - 1 ? C.primary : C.primarySoft, borderColor: C.primary }]} />
              {i < arr.length - 1 ? <View style={[styles.timeLine, { backgroundColor: C.border }]} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: SPACING.md }}>
              <Text style={[TYPE.bodyStrong, { color: C.text }]}>{when}</Text>
              <Text style={[TYPE.caption, { color: C.textSecondary, marginTop: 2, lineHeight: 18 }]}>{what}</Text>
            </View>
          </View>
        ))}
        {/* Honest limits, and the treatments worth asking about, for each goal (Lita, 2026-10-24) */}
        <Pressable onPress={() => navigation.navigate('Condition', { id: GOAL_CONDITION[longest] || 'fine-lines' })} hitSlop={6} style={{ marginBottom: SPACING.md }}>
          <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>What skincare can and can’t do, and the treatments to ask about ›</Text>
        </Pressable>

        <Text style={[styles.section, { color: C.muted }]}>YOUR PRODUCTS</Text>
        <View style={[styles.tileRow, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[TYPE.body, { color: C.text }]}>{kept ? `${kept} of your own product${kept > 1 ? 's are' : ' is'} kept.` : answers.productPref === 'new' ? 'We suggest a product for each step.' : 'None of your products fits these steps yet: we suggest one for each.'}</Text>
          <Text style={[TYPE.caption, { color: C.muted, marginTop: 2 }]}>Every product is checked against your skin. No brand pays to be suggested.</Text>
        </View>
        {locked ? (
          <Pressable onPress={() => { tap(); navigation.navigate('Premium') }} style={[styles.tileRow, { borderColor: C.primary, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm }]}>
            <Ionicons name="lock-closed-outline" size={17} color={C.primary} />
            <Text style={[TYPE.body, { color: C.primary, flex: 1 }]}>Each step with its product, and your plan week by week</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={() => { tap(); setFullOpen(true) }} hitSlop={8} style={{ marginTop: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={15} color={C.primary} />
              <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>See how your weeks go</Text>
            </Pressable>
            <RoutineTabs routine={preview} onOpen={(period, idx) => setSheet({ period, idx })} />
          </>
        )}
        {draft ? <FullPlan visible={fullOpen} onClose={() => setFullOpen(false)} plan={draft} routine={preview} /> : null}
        <StepSheet step={sheet && preview?.[sheet.period]?.[sheet.idx]} onClose={() => setSheet(null)} navigation={navigation}
          onKeep={() => decide(sheet.period, sheet.idx, 'keep')} onRemove={() => decide(sheet.period, sheet.idx, 'remove')}
          onOwn={() => { const s2 = sheet; setSheet(null); setOwn({ period: s2.period, index: s2.idx }) }}
          userId={user?.id} onPick={product => { const s2 = sheet; setSheet(null); chooseOption(s2.period, s2.idx, product) }} />
        <OwnProductPicker visible={!!own} userId={user?.id} onClose={() => setOwn(null)} onPick={chooseOwn} />
      </Shell>
    )
  }

  // Quiz: one question per screen.
  const QUESTIONS = {
    sensitive: { n: 1, title: 'Does your skin react easily?', options: [{ v: false, t: 'Rarely' }, { v: true, t: 'Yes, often' }] },
    experience: { n: 2, title: 'Is your skin used to actives?', sub: 'Acids, retinol, vitamin C.', options: [{ v: 'none', t: 'Never tried them' }, { v: 'some', t: 'A little' }, { v: 'used', t: 'Yes, regularly' }] },
    priority: { n: 3, title: 'What do you want more of?', options: [{ v: 'retinoid', t: 'More retinol' }, { v: 'exfoliation', t: 'More exfoliation' }, { v: null, t: 'A bit of both' }] },
    products: { title: 'Which products should your plan use?', sub: 'Every product we suggest is checked against your skin.', key: 'productPref', options: [{ v: 'own', t: 'Mine first, when they suit my skin' }, { v: 'new', t: 'Suggest new products' }] },
  }
  const q = QUESTIONS[step]
  if (!q || busy) return <Loading label={busy ? 'Building your Rekod…' : undefined} />
  return (
    <Shell navigation={navigation} scroll={false} onBack={() => setStep(step === 'products' ? ((answers.experience || known.actives) === 'used' ? 'priority' : !known.actives ? 'experience' : !known.reactivity ? 'sensitive' : 'goals') : step === 'priority' ? (known.actives ? 'goals' : 'experience') : step === 'experience' ? (known.reactivity ? 'goals' : 'sensitive') : 'goals')}>
      {quizProgress(step)}
      <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700', marginTop: SPACING.xl }]}>{goalOf(answers.goal).title}</Text>
      <Text style={[styles.question, { color: C.text }]}>{q.title}</Text>
      {q.sub ? <Text style={[TYPE.body, { color: C.textSecondary }]}>{q.sub}</Text> : null}
      <View style={{ gap: SPACING.md, marginTop: SPACING.xl }}>
        {q.options.map(o => {
          const selected = answers[step] === o.v
          return (
            <Pressable key={String(o.v)} onPress={() => { tap(); answer(q.key || step, o.v) }} style={({ pressed }) => [styles.option, {
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

const MORNING_WORDS = { cleanser: 'Cleanser', serum: 'Serum', moisturizer: 'Moisturizer', sunscreen: 'SPF 50' }
const NIGHT_WORDS = {
  exfoliation: 'an acid gently clears pores and dead cells.',
  retinol: 'retinol renews your skin; it starts low and increases slowly.',
  azelaic: 'azelaic acid calms redness and evens the tone, gently.',
  gentle: 'a pregnancy-safe treatment (bakuchiol or peptides) works gently on your goal.',
  repair: 'soothing care, your skin rests and rebuilds.',
  reset: 'just cleanser and cream: a night off.',
}
// The treatment night's true name (Rekod audit 2026-10-25).
const TREATMENT_LABEL = { retinol: 'Retinol night', azelaic: 'Azelaic acid night', gentle: 'Gentle treatment night' }
const GOAL_END = { clear: 'Clearer skin, fewer breakouts', antiaging: 'Smoother skin, softer fine lines', spots: 'Visibly faded spots, a more even tone', glow: 'Brighter, smoother skin', pores: 'Less visible pores, less shine', calm: 'Calmer, more comfortable skin', hydration: 'Comfortable, hydrated skin' }
const GOAL_ICONS = { clear: 'water-outline', antiaging: 'hourglass-outline', spots: 'contrast-outline', glow: 'sunny-outline', pores: 'grid-outline', calm: 'leaf-outline', hydration: 'rainy-outline' }
const STEP_ICONS = { cleanser: 'water-outline', serum: 'eyedrop-outline', moisturizer: 'leaf-outline', sunscreen: 'sunny-outline', exfoliant: 'sparkles-outline', treatment: 'moon-outline', eye: 'eye-outline', lips: 'happy-outline', lipscrub: 'sparkles-outline', lipmask: 'moon-outline' }

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
                {s.product ? <Text style={[styles.miniChip, { color: s.owned ? C.success : C.primary, backgroundColor: s.owned ? C.successSoft : C.primarySoft }]}>{s.owned ? '✓ Yours' : 'Suggested'}</Text> : null}
                {PROVEN.includes(s.action) ? <Text style={[styles.miniChip, { color: C.success, backgroundColor: C.successSoft }]}>Proven</Text> : null}
                {paused?.has(s.night) ? <Text style={[styles.miniChip, { color: C.warning, backgroundColor: C.warningSoft }]}>Paused · 7-day plan</Text> : null}
              </View>
            </View>
            {s.issues?.length || !s.product ? <View style={[styles.warnDot, { backgroundColor: s.issues?.[0]?.level === 'avoid' ? '#CF4F57' : '#C98422' }]} /> : null}
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
            Each week is revealed as you go, adjusted to your weekly Rekod review: if your skin reacts, your plan slows down.
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
              // The programme reveals itself as she goes: this week and the next.
              if (w.week > now + 1) {
                return (
                  <View key={w.week} style={[styles.option, { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }]}>
                    <Text style={[TYPE.bodyStrong, { color: C.muted, width: 70 }]}>Week {w.week}</Text>
                    <Text style={[TYPE.caption, { color: C.muted, flex: 1 }]}>Revealed in week {w.week - 1}, adjusted to your skin</Text>
                    <Ionicons name="lock-closed-outline" size={15} color={C.muted} />
                  </View>
                )
              }
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
                              {n === 'retinoid' ? TREATMENT_LABEL[w.treatment] : NIGHTS[n].label} · {w.pattern.filter(x => x === n).length}×
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
function StepSheet({ step: s, onClose, navigation, onOwn, onKeep, onRemove, onPick, userId }) {
  // Other 100% safe products for this step, to choose from.
  const [options, setOptions] = useState(null)
  React.useEffect(() => {
    setOptions(null)
    if (!s?.product_id || !userId || !onPick) return
    let active = true
    optionsForStep(userId, s, 2).then(list => { if (active) setOptions(list) }).catch(() => { if (active) setOptions([]) })
    return () => { active = false }
  }, [s?.product_id, s?.key, s?.night, userId])
  return (
    <BottomSheetModal visible={!!s} onClose={onClose}>
      {s ? (
        <ScrollView style={{ maxHeight: 560 }} contentContainerStyle={{ gap: SPACING.md }}>
          <Text style={[TYPE.overline, { color: C.primary }]}>{s.action}{s.days?.length ? ` · ${describeDays(s.days)}` : ''}</Text>
          {s.product ? (
            <Text style={[styles.miniChip, { alignSelf: 'flex-start', color: s.owned ? C.success : C.primary, backgroundColor: s.owned ? C.successSoft : C.primarySoft }]}>
              {s.owned ? '✓ Your product' : 'Suggested for your skin'}
            </Text>
          ) : null}
          <Text style={[styles.sheetTitle, { color: C.text }]}>{s.product || 'No product yet'}</Text>
          {s.why ? <Text style={[TYPE.body, { color: C.textSecondary, lineHeight: 22 }]}>{s.why}</Text> : null}
          {s.issues?.length ? (
            <View style={[styles.issueBox, { borderColor: s.issues[0].level === 'avoid' ? '#CF4F57' : '#C98422' }]}>
              <Text style={[TYPE.caption, { color: s.issues[0].level === 'avoid' ? '#CF4F57' : '#C98422', fontWeight: '700' }]}>
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
          {options?.length ? (
            <View style={{ gap: SPACING.sm }}>
              <Text style={[TYPE.caption, { color: C.muted, fontWeight: '700', letterSpacing: 0.6 }]}>OTHER OPTIONS, ALSO 100% SAFE FOR YOU</Text>
              {options.map(o => (
                <Pressable key={o.product.id} onPress={() => onPick(o.product)} style={({ pressed }) => [styles.tileRow, { backgroundColor: C.card, borderColor: C.border, opacity: pressed ? 0.85 : 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>{o.label}</Text>
                    <Text style={[TYPE.bodyStrong, { color: C.text }]} numberOfLines={2}>{o.product.brand} {o.product.name}</Text>
                  </View>
                  <Text style={[TYPE.caption, { color: C.primary, fontWeight: '700' }]}>Use this</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          <RButton outline title="Use my own product" onPress={onOwn} />
        </ScrollView>
      ) : null}
    </BottomSheetModal>
  )
}

const styles = liveStyles(() => StyleSheet.create({
  dash: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginTop: SPACING.md },
  dashTitle: { fontWeight: '700', letterSpacing: -0.4, fontSize: 26, lineHeight: 30 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: C.primary, borderRadius: 18, padding: SPACING.lg, marginTop: SPACING.lg },
  segment: { flexDirection: 'row', borderRadius: 999, padding: 4 },
  segmentItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 999 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderRadius: 18, padding: SPACING.md },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  miniChip: { fontSize: 11, fontWeight: '700', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  warnDot: { width: 8, height: 8, borderRadius: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  bottomSheet: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: SPACING.xl, paddingBottom: SPACING.xxxl },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: C.border, marginBottom: SPACING.lg },
  bestBox: { borderRadius: 16, padding: SPACING.md, gap: 6 },
  sheetTitle: { fontWeight: '700', letterSpacing: -0.4, fontSize: 24, lineHeight: 30 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl },
  footer: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  title: { fontWeight: '700', letterSpacing: -0.4, fontSize: 30, lineHeight: 36, marginTop: SPACING.xs },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginTop: SPACING.xxl, marginBottom: SPACING.sm },
  how: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start', marginBottom: SPACING.lg },
  pickNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  timeDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, marginTop: 3 },
  timeLine: { width: 2, flex: 1, marginTop: 2 },
  quizBar: { height: 3, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  tileRow: { borderWidth: 1, borderRadius: 16, padding: SPACING.md },
  howNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 6, borderRadius: 999, overflow: 'hidden', marginTop: SPACING.lg },
  rbutton: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  premium: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  premiumText: { color: '#33202E', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  hero: { fontWeight: '700', letterSpacing: -0.4, fontSize: 44, lineHeight: 46, marginTop: SPACING.sm },
  serif: { fontWeight: '700', letterSpacing: -0.4, fontSize: 18 },
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
  sheet: { flex: 1, backgroundColor: C.bg, paddingTop: SPACING.xl, paddingHorizontal: SPACING.xl },
  search: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, height: 46, color: C.text, backgroundColor: C.card, marginTop: SPACING.md },
  resultRow: { paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  keyChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  product: { fontWeight: '600', fontSize: 15 },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  question: { fontWeight: '700', letterSpacing: -0.4, fontSize: 30, lineHeight: 36, marginTop: SPACING.sm },
  option: { borderRadius: 18, padding: SPACING.lg },
}))

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
        <TextInput value={query} onChangeText={setQuery} placeholder="Search a product or brand" placeholderTextColor={C.muted} style={styles.search} autoFocus />
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
