import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, LoadingView, useColors } from '../components/ui'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { getMyProducts } from '../utils/catalog'
import { ISSUES, questionsFor, buildSosPlan, issuesFromSituation } from '../utils/sos-plan'
import { getActivePlan, startPlan, endPlan } from '../utils/emergency-state'
import { isPremiumUser } from '../utils/premium'
import { syncSmartReminders } from '../utils/notifications'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const PLUM = '#33202E'
// Lets the owner try Premium features before in-app purchase exists.
const TESTERS = ['djedidilita@gmail.com']

const PAUSE_LABELS = {
  retinoid: 'Retinol', acid: 'Acids', exfoliant: 'Exfoliants', vitaminC: 'Vitamin C',
  fragrance: 'Fragranced products', scrub: 'Scrubs', mask: 'Masks', newest: 'Your new product',
}

// Emergency mode: pick the problems (several at once), answer a few quick
// questions, then get ONE 7-day plan that treats everything together.
export default function EmergencyScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const [active, setActive] = useState(undefined) // undefined = loading
  const [stage, setStage] = useState('pick') // pick | quiz | preview
  const [issues, setIssues] = useState([])
  const [answers, setAnswers] = useState({})
  const [qIndex, setQIndex] = useState(0)
  const [owned, setOwned] = useState(null)
  const [openDay, setOpenDay] = useState(0)
  const [premium, setPremium] = useState(undefined)
  const [preview, setPreview] = useState(false) // tester trying it without Premium
  useEffect(() => { if (user?.id) isPremiumUser(user.id).then(setPremium).catch(() => setPremium(false)) }, [user?.id])

  const load = useCallback(async () => {
    if (!user?.id) return
    const plan = await getActivePlan(user.id)
    setActive(plan)
    if (plan) setOpenDay(plan.dayIndex)
  }, [user?.id])
  useFocusEffect(useCallback(() => { load() }, [load]))

  // Opened from the journal (problems ticked) or Koda (one situation).
  useEffect(() => {
    const fromParams = route?.params?.issues || issuesFromSituation(route?.params?.situation)
    if (fromParams?.length) {
      setIssues(fromParams)
      setAnswers({})
      setQIndex(0)
      setStage('pick')
    }
  }, [route?.params?.openedAt])

  // The products she owns, for "which product is new?".
  useEffect(() => {
    if (stage !== 'quiz' || owned || !user?.id) return
    getMyProducts(user.id).then(rows => setOwned(rows.filter(r => r.status === 'owned' && r.product_id))).catch(() => setOwned([]))
  }, [stage, user?.id])

  if (active === undefined || premium === undefined) return <LoadingView />

  // ---------- Locked: Emergency mode is part of Premium ----------
  if (!premium && !active && !preview) {
    const tester = TESTERS.includes(user?.email)
    return (
      <Screen back title={t('Emergency Mode')}>
        <View style={[styles.lockCard, { backgroundColor: PLUM }]}>
          <View style={styles.lockBadge}>
            <Ionicons name="diamond" size={14} color="#E2C6DA" />
            <Text style={{ color: '#E2C6DA', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 }}>{t('PREMIUM')}</Text>
          </View>
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: SPACING.md }}>{t('Emergency mode')}</Text>
          <Text style={{ color: '#E2C6DA', fontSize: 14, lineHeight: 20, marginTop: SPACING.sm }}>
            {t('A 7-day plan made for your skin when something goes wrong: a few quick questions, then one routine that treats everything at once.')}
          </Text>
          {['Breakouts, redness, dryness, peeling or a reaction, together', 'Morning and evening care that works well together', 'Strong products paused in your routine while it heals', 'Products picked from yours first, safe for your skin'].map(line => (
            <View key={line} style={styles.lockLine}>
              <Ionicons name="checkmark" size={15} color="#E2C6DA" />
              <Text style={{ color: '#FFFFFF', fontSize: 13, lineHeight: 18, flex: 1 }}>{t(line)}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => Alert.alert(t('Premium is coming soon'), t('You’ll be able to unlock Emergency mode very soon.'))}
          style={({ pressed }) => [styles.primary, { backgroundColor: PLUM, opacity: pressed ? 0.85 : 1, flexDirection: 'row', gap: 8 }]}>
          <Ionicons name="lock-open-outline" size={17} color="#FFFFFF" />
          <Text style={styles.primaryText}>{t('Unlock with Premium')}</Text>
        </Pressable>
        {tester ? (
          <Pressable onPress={() => setPreview(true)} style={{ alignSelf: 'center', padding: SPACING.md }}>
            <Text style={[TYPE.caption, { color: colors.textSecondary, fontWeight: '700' }]}>{t('Try it as Premium (test)')}</Text>
          </Pressable>
        ) : null}
      </Screen>
    )
  }

  const questions = questionsFor(issues, answers, profile)
  const question = questions[qIndex]
  const plan = stage === 'preview' ? buildSosPlan(issues, answers, profile) : null

  const next = nextAnswers => {
    const list = questionsFor(issues, nextAnswers, profile)
    if (qIndex + 1 < list.length) setQIndex(qIndex + 1)
    else { setStage('preview'); setOpenDay(0) }
  }
  const answer = (id, value, advance = true) => {
    const nextAnswers = { ...answers, [id]: value }
    setAnswers(nextAnswers)
    if (advance) next(nextAnswers)
  }
  const back = () => {
    if (stage === 'preview') { setStage('quiz'); setQIndex(Math.max(0, questions.length - 1)) }
    else if (stage === 'quiz' && qIndex > 0) setQIndex(qIndex - 1)
    else setStage('pick')
  }
  const reset = () => { setStage('pick'); setIssues([]); setAnswers({}); setQIndex(0); navigation.setParams({ issues: undefined, situation: undefined }) }

  const start = async () => {
    const begin = async () => {
      await startPlan(user.id, plan)
      syncSmartReminders(user.id)
      reset()
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
      { text: t('End plan'), style: 'destructive', onPress: async () => { await endPlan(user.id); syncSmartReminders(user.id); load() } },
    ])

  const Lines = ({ label, icon, items }) => (
    <View style={{ marginTop: SPACING.sm }}>
      <View style={styles.partHead}>
        <Ionicons name={icon} size={13} color={colors.muted} />
        <Text style={[styles.part, { color: colors.muted }]}>{t(label)}</Text>
      </View>
      {items.map((s, k) => (
        <Text key={k} style={[TYPE.caption, { color: colors.text, lineHeight: 19, marginTop: 2 }]}>{k + 1}. {t(s.text)}</Text>
      ))}
    </View>
  )

  const DayList = ({ days, current }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {days.map((day, i) => {
        const isOpen = openDay === i
        const isToday = current === i
        const past = current !== null && current !== undefined && i < current
        return (
          <Pressable key={i} onPress={() => setOpenDay(isOpen ? null : i)}
            style={[styles.dayRow, i < 6 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, isToday && { backgroundColor: colors.primarySoft }]}>
            <View style={styles.dayHead}>
              <Ionicons name={past ? 'checkmark-circle' : day.icon} size={20} color={past ? colors.success : isToday ? colors.primary : colors.textSecondary} />
              <Text style={[TYPE.bodyStrong, { color: colors.text, width: 62 }]}>{t('Day {n}', { n: i + 1 })}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1 }]}>{t(day.title)}</Text>
              {isToday ? <Text style={[styles.today, { color: colors.primary }]}>{t('TODAY')}</Text> : null}
            </View>
            {isOpen ? (
              <View style={styles.dayBody}>
                <Lines label="MORNING" icon="sunny-outline" items={day.morning} />
                <Lines label="EVENING" icon="moon-outline" items={day.evening} />
                {day.tips.map((tip, k) => (
                  <Text key={k} style={[TYPE.caption, { color: colors.primary, marginTop: SPACING.sm, lineHeight: 18 }]}>{t(tip)}</Text>
                ))}
                <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 6 }]}>
                  <Text style={{ fontWeight: '700' }}>{t('Avoid')}: </Text>{t(day.avoid)}
                </Text>
                {day.needs?.length ? (
                  <Pressable onPress={() => navigation.navigate('Suggestions', { needs: day.needs, title: day.title, day: i, ownedOnly: day.ownedOnly, cautions: (plan || active?.situation)?.cautions })}
                    style={[styles.suggest, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="sparkles-outline" size={15} color={colors.primary} />
                    <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t(day.ownedOnly ? 'Which of my products to use' : 'Suggest products for this day')}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )

  const Notes = ({ notes }) => (notes?.length ? (
    <View style={[styles.note, { backgroundColor: colors.surface }]}>
      {notes.map((n, k) => (
        <Text key={k} style={[TYPE.caption, { color: colors.text, lineHeight: 18, marginTop: k ? 6 : 0 }]}>{t(n)}</Text>
      ))}
    </View>
  ) : null)

  const PrimaryButton = ({ label, onPress, disabled }) => (
    <Pressable onPress={onPress} disabled={disabled}
      style={({ pressed }) => [styles.primary, { backgroundColor: PLUM, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }]}>
      <Text style={styles.primaryText}>{t(label)}</Text>
    </Pressable>
  )

  // ---------- A plan is running ----------
  if (active && stage === 'pick' && !issues.length) {
    const s = active.situation
    return (
      <Screen back title={t('Emergency Mode')}>
        <Text style={[styles.planTitle, { color: colors.text }]}>{t(s.title)}</Text>
        <Text style={[TYPE.body, { color: colors.textSecondary }]}>{t('Day {n} of 7', { n: active.dayIndex + 1 })}</Text>
        <Notes notes={s.notes} />
        <DayList days={s.days} current={active.dayIndex} />
        <View style={[styles.note, { backgroundColor: colors.surface }]}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Paused in your routine')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>{s.pause.map(p => t(PAUSE_LABELS[p])).join(' · ')}</Text>
          <Text style={[TYPE.caption, { color: colors.muted, marginTop: 6 }]}>{t('Your Home routine already leaves them out until the plan ends.')}</Text>
        </View>
        <Pressable onPress={stop} style={{ alignSelf: 'center', padding: SPACING.lg }}>
          <Text style={[TYPE.bodyStrong, { color: colors.textSecondary }]}>{t('End plan')}</Text>
        </Pressable>
      </Screen>
    )
  }

  // ---------- The plan, before starting ----------
  if (plan) {
    return (
      <Screen back title={t('Emergency Mode')}>
        <Pressable onPress={back} hitSlop={8} style={{ marginBottom: SPACING.sm }}>
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>← {t('Change my answers')}</Text>
        </Pressable>
        {plan.urgent ? (
          <View style={[styles.note, { backgroundColor: colors.dangerSoft }]}>
            <Text style={[TYPE.bodyStrong, { color: colors.danger }]}>{t(plan.title)}</Text>
            <Text style={[TYPE.caption, { color: colors.danger, marginTop: 4, lineHeight: 18 }]}>{t(plan.intro)}</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.overline, { color: colors.primary }]}>{t('YOUR 7-DAY PLAN')}</Text>
            <Text style={[styles.planTitle, { color: colors.text }]}>{t(plan.title)}</Text>
            <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.xs }]}>{t(plan.intro)}</Text>
            <Notes notes={plan.notes} />
            <DayList days={plan.days} current={null} />
            <View style={[styles.note, { backgroundColor: colors.surface }]}>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('What changes in your routine')}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
                {t('Paused for 7 days:')} {plan.pause.map(p => t(PAUSE_LABELS[p])).join(' · ')}
              </Text>
            </View>
            <PrimaryButton label="Start plan" onPress={start} />
          </>
        )}
      </Screen>
    )
  }

  // ---------- Quick questions, one at a time ----------
  if (stage === 'quiz' && question) {
    const value = answers[question.id]
    const multi = question.type === 'multi'
    const toggle = v => {
      const cur = value || []
      const nextVal = v === 'nothing' ? ['nothing'] : cur.includes(v) ? cur.filter(x => x !== v) : [...cur.filter(x => x !== 'nothing'), v]
      answer(question.id, nextVal, false)
    }
    return (
      <Screen back title={t('Emergency Mode')}>
        <Pressable onPress={back} hitSlop={8} style={{ marginBottom: SPACING.sm }}>
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>← {t('Back')}</Text>
        </Pressable>
        <Text style={[styles.overline, { color: colors.muted }]}>{t('QUESTION {n} OF {total}', { n: qIndex + 1, total: questions.length })}</Text>
        <Text style={[TYPE.heading, { color: colors.text, marginTop: SPACING.xs }]}>{t(question.title)}</Text>
        {question.subtitle ? <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4 }]}>{t(question.subtitle)}</Text> : null}

        {question.type === 'product' ? (
          <View style={{ marginTop: SPACING.lg, gap: SPACING.sm }}>
            {!owned ? <ActivityIndicator color={colors.primary} /> : owned.map(r => (
              <Pressable key={r.id} onPress={() => answer('product', r.product_id)}
                style={[styles.option, { backgroundColor: value === r.product_id ? colors.primarySoft : colors.card, borderColor: value === r.product_id ? colors.primary : colors.border }]}>
                <Text style={[TYPE.caption, { color: colors.textSecondary }]} numberOfLines={1}>{r.brand || r.product?.brand}</Text>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={1}>{r.product_name || r.product?.name}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => answer('product', null)} style={[styles.option, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('It’s not in my products')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ marginTop: SPACING.lg, gap: SPACING.sm }}>
            {question.options.map(opt => {
              const on = multi ? (value || []).includes(opt.value) : value === opt.value
              return (
                <Pressable key={opt.value} onPress={() => (multi ? toggle(opt.value) : answer(question.id, opt.value))}
                  style={[styles.option, styles.optionRow, { backgroundColor: on ? colors.primarySoft : colors.card, borderColor: on ? colors.primary : colors.border }]}>
                  <Text style={[TYPE.bodyStrong, { color: on ? colors.primary : colors.text, flex: 1 }]}>{t(opt.label)}</Text>
                  {on ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
                </Pressable>
              )
            })}
          </View>
        )}
        {multi ? <PrimaryButton label="Next" disabled={!(value || []).length} onPress={() => next(answers)} /> : null}
      </Screen>
    )
  }

  // ---------- What's going on? (several at once) ----------
  const toggleIssue = id => setIssues(cur => (cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]))
  return (
    <Screen back title={t('Emergency Mode')}>
      <Text style={[TYPE.heading, { color: colors.text }]}>{t("What's going on?")}</Text>
      <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: 4 }]}>{t('Select everything that applies: we build one plan for all of it.')}</Text>
      <View style={styles.grid}>
        {ISSUES.map(s => {
          const on = issues.includes(s.id)
          return (
            <Pressable key={s.id} onPress={() => toggleIssue(s.id)}
              style={({ pressed }) => [styles.tile, { backgroundColor: on ? colors.primarySoft : colors.card, borderColor: on ? colors.primary : colors.border, opacity: pressed ? 0.85 : 1 }]}>
              <Ionicons name={s.icon} size={22} color={colors.primary} />
              <Text style={[TYPE.caption, { color: on ? colors.primary : colors.text, fontWeight: '600', flex: 1 }]}>{t(s.label)}</Text>
            </Pressable>
          )
        })}
        <Pressable
          onPress={() => navigation.navigate('Koda', { returnTo: 'Emergency', prefill: t("My skin isn't doing well and I'm not sure why. Can you help?") })}
          style={({ pressed }) => [styles.tile, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.primary} />
          <Text style={[TYPE.caption, { color: colors.text, fontWeight: '600', flex: 1 }]}>{t('Other')}</Text>
        </Pressable>
      </View>
      <PrimaryButton label="Continue" disabled={!issues.length} onPress={() => { setAnswers({}); setQIndex(0); setStage('quiz') }} />
      {active ? (
        <Pressable onPress={reset} style={{ alignSelf: 'center', padding: SPACING.md }}>
          <Text style={[TYPE.caption, { color: colors.textSecondary, fontWeight: '700' }]}>{t('See my current plan')}</Text>
        </Pressable>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginTop: SPACING.xl },
  tile: { width: '47%', flexGrow: 1, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg },
  lockCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, marginTop: SPACING.sm },
  lockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: SPACING.md },
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  planTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3, marginTop: SPACING.xs },
  card: { borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, marginTop: SPACING.lg, overflow: 'hidden' },
  dayRow: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  dayBody: { marginTop: SPACING.xs, marginLeft: 32 },
  partHead: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  part: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  suggest: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: SPACING.md },
  today: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  note: { borderRadius: RADIUS.md, padding: SPACING.lg, marginTop: SPACING.lg },
  option: { borderRadius: RADIUS.md, borderWidth: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  optionRow: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  primary: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl, marginBottom: SPACING.md },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})
