import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Platform, Alert, Image, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../utils/AuthContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { getUserRoutines } from '../utils/routines-service'
import { describeDays } from '../utils/routine-checks'
import { logError } from '../utils/errorLogger'
import { track } from '../utils/analytics'
import { searchProducts, getMyProducts } from '../utils/catalog'
import { SPACING, RADIUS, TYPE } from '../utils/theme'
import {
  GOALS, NIGHTS, goalOf, weekOf, weekPattern, tonightNight, checkInDue,
  buildRekodRoutine, getRekodPlan, startRekod, recordCheckIn, leaveRekod, isReactive,
  findSafeAlternative, stepWithProduct, replaceRoutineStep, refreshRekodRoutine,
} from '../utils/rekod'

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' })
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const REACTIVE = ['Rosacea', 'Eczema', 'Perioral dermatitis', 'Sensitivity']

// Premium features live in a deep plum space, like a members' area.
const C = {
  bg: '#33202E', card: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.78)', muted: 'rgba(255,255,255,0.55)',
  primary: '#E2C6DA', primarySoft: 'rgba(226,198,218,0.16)', onPrimary: '#33202E',
  success: '#A8E2BC', successSoft: 'rgba(168,226,188,0.14)',
}

function Shell({ navigation, overline, title, subtitle, footer, children, onBack }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack || (() => navigation.goBack())} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </Pressable>
        <Text style={[TYPE.overline, { color: C.primary }]}>Premium</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {overline ? <Text style={[TYPE.overline, { color: C.primary }]}>{overline}</Text> : null}
        {title ? <Text style={[styles.title, { color: C.text }]}>{title}</Text> : null}
        {subtitle ? <Text style={[TYPE.body, { color: C.muted, marginTop: 4 }]}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
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
      const p = await getRekodPlan(user.id)
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

  const pickGoal = (goal) => {
    const reactive = profile?.skin_type === 'Sensitive' || [...(profile?.skin_conditions || []), ...(profile?.skin_concerns || [])].some(c => REACTIVE.includes(c))
    setAnswers({ goal, sensitive: reactive })
    setStep('sensitive')
  }

  const buildPreview = async (final) => {
    setBusy(true)
    try {
      const draft = { ...final, sensitive: !!final.sensitive || isReactive(profile), reactive: isReactive(profile), level: { none: 0, some: 1, used: 2 }[final.experience] ?? 0, startedAt: new Date().toISOString(), checkins: [] }
      setPreview(await buildRekodRoutine(user.id, draft, profile))
      setStep('preview')
    } catch (error) {
      await logError('Rekod_preview', error)
      Alert.alert('Something went wrong', 'Your programme could not be built. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const answer = (key, value) => {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    if (key === 'sensitive') setStep('experience')
    else if (key === 'experience' && value === 'used') setStep('priority')
    else buildPreview(next)
  }

  const adopt = async () => {
    setBusy(true)
    try {
      const res = await startRekod(user.id, answers, profile)
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

  const leave = () => Alert.alert('Leave your programme?', 'Your current routine stays as it is. You can start a new programme anytime.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Leave', style: 'destructive', onPress: async () => { await leaveRekod(user.id).catch(() => {}); setPlan(null); setStep('intro') } },
  ])

  if (plan === undefined) return <Loading />

  // ---------- Following a Rekod ----------
  if (plan) {
    const goal = goalOf(plan.goal)
    const week = Math.min(weekOf(plan), goal.weeks)
    const pattern = weekPattern(plan)
    const tonight = tonightNight(plan)
    const todayIdx = [1, 2, 3, 4, 5, 6, 0].indexOf(new Date().getDay())
    return (
      <Shell navigation={navigation} overline={`My programme · ${goal.title}`} title={`Week ${week} of ${goal.weeks}`}>
        <View style={[styles.bar, { backgroundColor: C.primarySoft }]}><View style={{ width: `${Math.round((week / goal.weeks) * 100)}%`, height: '100%', backgroundColor: C.primary, borderRadius: 999 }} /></View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[TYPE.overline, { color: colors.muted }]}>Tonight</Text>
          <Text style={[styles.serif, { color: colors.text }]}>{NIGHTS[tonight].label}</Text>
          <View style={styles.weekRow}>
            {pattern.map((night, i) => (
              <View key={i} style={styles.dayCol}>
                <Text style={[TYPE.caption, { color: colors.muted, fontSize: 11 }]}>{DAY_LETTERS[i]}</Text>
                <View style={[styles.dayDot, {
                  backgroundColor: night === 'retinoid' || night === 'exfoliation' ? colors.primary : colors.primarySoft,
                  borderWidth: i === todayIdx ? 2 : 0, borderColor: colors.text,
                }]}>
                  <Ionicons name={NIGHTS[night].icon} size={14} color={night === 'retinoid' || night === 'exfoliation' ? colors.onPrimary : colors.primary} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {checkInDue(plan) ? (
          <View style={[styles.card, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }]}>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>Any stinging or redness this week?</Text>
            <View style={styles.answers}>
              <RButton small title="All good" onPress={() => checkIn('good')} loading={busy} style={{ flex: 1 }} />
              <RButton small outline title="A little" onPress={() => checkIn('little')} disabled={busy} style={{ flex: 1 }} />
              <RButton small outline title="A lot" onPress={() => checkIn('lot')} disabled={busy} style={{ flex: 1 }} />
            </View>
          </View>
        ) : null}

        <RoutineCard navigation={navigation} title="Morning" period="morning" steps={routine?.morning} colors={colors} onAlternative={findAlternative} onOwn={(p, i) => setOwn({ period: p, index: i })} />
        <RoutineCard navigation={navigation} title="Evening" period="evening" steps={routine?.evening} colors={colors} showDays onAlternative={findAlternative} onOwn={(p, i) => setOwn({ period: p, index: i })} />

        <OwnProductPicker visible={!!own} userId={user?.id} onClose={() => setOwn(null)} onPick={chooseOwn} />
        <Pressable onPress={leave} hitSlop={10} style={{ alignSelf: 'center', marginTop: SPACING.lg }}>
          <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '600' }]}>Leave my programme</Text>
        </Pressable>
      </Shell>
    )
  }

  // ---------- Joining ----------
  if (step === 'intro') {
    return (
      <Shell navigation={navigation}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Text style={[TYPE.overline, { color: colors.primary }]}>Your skin programme</Text>
          <View style={[styles.premium, { backgroundColor: colors.primary }]}><Text style={styles.premiumText}>PREMIUM</Text></View>
        </View>
        <Text style={[styles.hero, { color: colors.text }]}>The skin you{'\n'}always wanted.</Text>
        <Text style={[TYPE.bodyStrong, { color: colors.primary, marginTop: SPACING.md }]}>A premium skin programme, from 6 to 12 weeks.</Text>
        <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
          A premium programme built entirely around your skin, so you finally get the skin you've always wanted. Every active is backed by science, not trends.
        </Text>
        <Text style={[styles.serif, { color: colors.text, marginTop: SPACING.xxl, fontSize: 20 }]}>What do you want to change?</Text>
        <View style={styles.grid}>
          {GOALS.map(g => (
            <Pressable key={g.id} onPress={() => pickGoal(g.id)} style={({ pressed }) => [styles.goal, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{g.title}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{g.subtitle}</Text>
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
        onBack={() => setStep('intro')}
        overline={`Your programme · ${goal.title}`}
        title={answers.sensitive ? 'Built for skin that reacts easily' : 'Built for your skin'}
        subtitle={`${goal.weeks} weeks · ${goal.results.toLowerCase()}`}
        footer={<RButton title="Start my programme" onPress={adopt} loading={busy} />}
      >
        <RoutineCard navigation={navigation} title="Morning" period="morning" steps={preview.morning} colors={colors} onAlternative={findAlternative} onOwn={(p, i) => setOwn({ period: p, index: i })} />
        <RoutineCard navigation={navigation} title="Evening" period="evening" steps={preview.evening} colors={colors} showDays onAlternative={findAlternative} onOwn={(p, i) => setOwn({ period: p, index: i })} />
        <OwnProductPicker visible={!!own} userId={user?.id} onClose={() => setOwn(null)} onPick={chooseOwn} />
        <Pressable onPress={() => setStep('intro')} hitSlop={10} style={{ alignSelf: 'center', marginTop: SPACING.md }}>
          <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '600' }]}>Change my goal</Text>
        </Pressable>
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
  if (!q || busy) return <Loading label={busy ? 'Building your programme…' : undefined} />
  const total = answers.experience === 'used' || step === 'priority' ? 3 : 2
  return (
    <Shell navigation={navigation} onBack={() => setStep(step === 'priority' ? 'experience' : step === 'experience' ? 'sensitive' : 'intro')}>
      <View style={styles.progress}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.progressBit, { backgroundColor: i < q.n ? colors.primary : colors.border }]} />
        ))}
      </View>
      <Text style={[TYPE.overline, { color: colors.primary, marginTop: SPACING.xl }]}>My programme · {goalOf(answers.goal).title}</Text>
      <Text style={[styles.question, { color: colors.text }]}>{q.title}</Text>
      {q.sub ? <Text style={[TYPE.body, { color: colors.textSecondary }]}>{q.sub}</Text> : null}
      <View style={{ gap: SPACING.md, marginTop: SPACING.xl }}>
        {q.options.map(o => {
          const selected = answers[step] === o.v
          return (
            <Pressable key={String(o.v)} onPress={() => answer(step, o.v)} style={({ pressed }) => [styles.option, {
              backgroundColor: selected ? colors.primarySoft : colors.card,
              borderColor: selected ? colors.primary : colors.border,
              borderWidth: selected ? 2 : 1,
              opacity: pressed ? 0.85 : 1,
            }]}>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{o.t}</Text>
            </Pressable>
          )
        })}
      </View>
    </Shell>
  )
}

function RoutineCard({ title, period, steps, colors, showDays, navigation, onAlternative, onOwn }) {
  if (!steps?.length) return null
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[TYPE.overline, { color: colors.muted }]}>{title}</Text>
      {steps.map((s, idx) => (
        <View key={`${s.key}-${idx}`} style={styles.stepRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[TYPE.overline, { color: colors.muted, fontSize: 10 }]}>{s.action}</Text>
            <Pressable disabled={!s.product_id} onPress={() => navigation.navigate('Product', { id: s.product_id })} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.product, { color: colors.text, flexShrink: 1 }]} numberOfLines={2}>{s.product || 'Pick a product'}</Text>
              {s.product_id ? <Ionicons name="chevron-forward" size={14} color={colors.muted} /> : null}
            </Pressable>
            {showDays && s.days?.length ? <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '600' }]}>{describeDays(s.days)}</Text> : null}
            {s.why ? <Text style={[TYPE.caption, { color: colors.textSecondary, lineHeight: 18 }]}>{s.why}</Text> : null}
            {s.issues?.length ? (
              <View style={[styles.issueBox, { borderColor: s.issues[0].level === 'avoid' ? '#E9A3A3' : '#E7C07A' }]}>
                <Text style={[TYPE.caption, { color: s.issues[0].level === 'avoid' ? '#E9A3A3' : '#E7C07A', fontWeight: '700' }]}>
                  {s.issues[0].level === 'avoid' ? 'Not recommended for your skin' : 'Not 100% safe for your skin'}
                </Text>
                {s.issues.map((i, n) => (
                  <Text key={n} style={[TYPE.caption, { color: colors.textSecondary, lineHeight: 18 }]}>• {i.text}{i.detail ? `. ${i.detail}` : ''}</Text>
                ))}
              </View>
            ) : null}
            {(s.issues?.length || !s.product) && onAlternative ? (
              <View style={styles.issueActions}>
                {s.product ? (
                  <Pressable onPress={() => onAlternative(period, idx)} style={[styles.smallBtn, { borderColor: colors.primary }]}>
                    <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>Find a 100% safe alternative</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => onOwn(period, idx)} style={[styles.smallBtn, { borderColor: colors.border }]}>
                  <Text style={[TYPE.caption, { color: colors.text, fontWeight: '700' }]}>Use my own product</Text>
                </Pressable>
              </View>
            ) : null}
            {s.keys?.length ? (
              <View style={styles.keys}>
                {s.keys.map(k => (
                  <Pressable key={k.id} onPress={() => navigation.navigate('Ingredient', { id: k.id })} style={[styles.keyChip, { backgroundColor: colors.primarySoft }]} accessibilityLabel={`${k.name}, see ingredient`}>
                    <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '600', fontSize: 12 }]}>{k.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
          {PROVEN.includes(s.action) ? (
            <View style={[styles.badge, { backgroundColor: colors.successSoft }]}><Text style={[styles.badgeText, { color: colors.success }]}>Proven</Text></View>
          ) : null}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  logo: { width: 56, height: 56, marginBottom: SPACING.lg, marginTop: SPACING.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  scroll: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl },
  footer: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  title: { fontFamily: SERIF, fontSize: 30, lineHeight: 36, marginTop: SPACING.xs },
  bar: { height: 6, borderRadius: 999, overflow: 'hidden', marginTop: SPACING.lg },
  rbutton: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  premium: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  premiumText: { color: '#33202E', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  hero: { fontFamily: SERIF, fontSize: 44, lineHeight: 46, marginTop: SPACING.sm },
  serif: { fontFamily: SERIF, fontSize: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  goal: { width: '48.5%', borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, gap: 2 },
  card: { borderWidth: 1, borderRadius: 20, padding: SPACING.lg, gap: SPACING.md, marginTop: SPACING.lg },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
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
  product: { fontFamily: SERIF, fontSize: 15 },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  progress: { flexDirection: 'row', gap: 4, marginTop: SPACING.lg },
  progressBit: { flex: 1, height: 3, borderRadius: 2 },
  question: { fontFamily: SERIF, fontSize: 30, lineHeight: 36, marginTop: SPACING.sm },
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
