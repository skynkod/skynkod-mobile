import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { purgeCardState, answerPurgeQuestions, answerPurgeFollowUp, markPurgeSeen } from '../utils/purge-check'
import { setProductPaused } from '../utils/paused-products'
import { logError } from '../utils/errorLogger'
import { SPACING, TYPE } from '../utils/theme'

// "Purging or a reaction?" (Lita, 2026-10-25), on Home and in the journal:
// the 3 questions one at a time, then the answer, then the 4- and 8-week follow-ups.

export const usePurgeCard = (userId) => {
  const [state, setState] = useState(null)
  const reload = useCallback(() => {
    if (!userId) return Promise.resolve()
    return purgeCardState(userId).then(setState).catch(error => { logError('Purge_load', error, {}, 'warn'); setState(null) })
  }, [userId])
  useFocusEffect(useCallback(() => { reload() }, [reload]))
  return { state, reload }
}

const WHY = {
  'not-active': '{product} isn’t a product that makes skin purge, so these spots are more likely a reaction to it.',
  'new-place': 'Spots in places where you don’t usually get them mean your skin is reacting to the product, not purging.',
  itch: 'Itching, stinging or burning mean your skin is irritated, not purging.',
  'too-long': '8 weeks without getting better: it isn’t a purge any more.',
}

export default function PurgeCard({ userId, state, onChange, style }) {
  const colors = useColors()
  const t = useT()
  const [answers, setAnswers] = useState({})
  const [busy, setBusy] = useState(false)
  if (!state) return null

  const run = async (fn) => {
    if (busy) return
    setBusy(true)
    try {
      await fn()
      setAnswers({})
      await onChange?.()
    } catch (error) {
      logError('Purge_save', error)
    } finally {
      setBusy(false)
    }
  }
  const option = (label, onPress, icon) => (
    <Pressable key={label} onPress={onPress} disabled={busy} style={({ pressed }) => [styles.option, { borderColor: colors.border, opacity: pressed || busy ? 0.6 : 1 }]}>
      {icon ? <Ionicons name={icon} size={18} color={colors.primary} /> : null}
      <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{label}</Text>
    </Pressable>
  )
  const head = (kicker, icon = 'help-circle-outline') => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.kicker, { color: colors.primary, flex: 1 }]}>{kicker}</Text>
    </View>
  )
  const body = text => <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, lineHeight: 21 }]}>{text}</Text>
  const small = text => <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm, lineHeight: 18 }]}>{text}</Text>
  const button = (label, onPress, primary = true) => (
    <Pressable key={label} onPress={onPress} disabled={busy} style={[styles.btn, primary ? { backgroundColor: colors.primary } : { borderWidth: 1, borderColor: colors.border }]}>
      <Text style={[TYPE.bodyStrong, { color: primary ? colors.onPrimary : colors.text }]}>{label}</Text>
    </Pressable>
  )
  const box = children => <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>

  // 1 · The 3 questions, one at a time.
  if (state.kind === 'ask') {
    const { product } = state
    const finish = next => run(() => answerPurgeQuestions(userId, product, { active: state.active ?? next.active, where: next.where, itch: next.itch }))
    const step = answers.where == null ? 'where' : answers.itch == null ? 'itch' : 'active'
    const total = state.active == null ? 3 : 2
    const n = step === 'where' ? 1 : step === 'itch' ? 2 : 3
    return box(<>
      {head(t('PURGING OR A REACTION?'))}
      {step === 'where' ? body(t(state.manual ? 'A few quick questions to know if your spots since {product} are normal.' : 'Spots keep showing up since you started {product}. A few quick questions to know if it’s normal.', { product: product.name })) : null}
      <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.md }]}>{t('Question {n} of {total}', { n, total })}</Text>
      {step === 'where' ? <>
        <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: 4 }]}>{t('Where are the spots?')}</Text>
        {option(t('Where I usually get them'), () => setAnswers({ where: 'usual' }), 'locate-outline')}
        {option(t('In new places'), () => setAnswers({ where: 'new' }), 'add-circle-outline')}
      </> : step === 'itch' ? <>
        <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: 4 }]}>{t('Does it itch, sting or burn?')}</Text>
        {option(t('Yes'), () => (total === 2 ? finish({ ...answers, itch: true }) : setAnswers({ ...answers, itch: true })), 'flame-outline')}
        {option(t('No'), () => (total === 2 ? finish({ ...answers, itch: false }) : setAnswers({ ...answers, itch: false })), 'checkmark-circle-outline')}
      </> : <>
        <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: 4 }]}>{t('Is {product} a strong active (retinol, acids, benzoyl peroxide)?', { product: product.name })}</Text>
        {option(t('Yes'), () => finish({ ...answers, active: true }), 'flask-outline')}
        {option(t('No, or I don’t know'), () => finish({ ...answers, active: false }), 'water-outline')}
      </>}
    </>)
  }

  const check = state.check
  const product = check.name
  const pause = () => run(async () => { await setProductPaused(userId, { id: check.productId, name: check.name }, true); await markPurgeSeen(userId, check) })
  const seen = () => run(() => markPurgeSeen(userId, check))

  // 3 · The follow-ups at 4 and 8 weeks.
  if (state.kind === 'followup') {
    const weeks = state.step === 'week4' ? 4 : 8
    return box(<>
      {head(t('{n} WEEKS WITH {product}', { n: weeks, product: product.toUpperCase() }), 'calendar-outline')}
      {body(t(state.step === 'week4' ? 'Are the spots getting better?' : 'Are the spots better now?'))}
      {option(t('Yes, better'), () => run(() => answerPurgeFollowUp(userId, check, state.step, true)), 'happy-outline')}
      {option(t('Not yet'), () => run(() => answerPurgeFollowUp(userId, check, state.step, false)), 'time-outline')}
    </>)
  }

  // 2 · The answer.
  if (check.verdict === 'purge') {
    const text = check.week4 === 'better' || check.week8 === 'better'
      ? t('Great: your skin got through the purge. Keep {product} in your routine.', { product })
      : check.week4 === 'not-yet'
        ? t('That happens. Keep going 4 more weeks, and we’ll ask you again. If it starts itching or spreading before, pause it.')
        : null
    return box(<>
      {head(t(text ? 'YOUR SKIN AND {product}' : 'PROBABLY A PURGE', { product: product.toUpperCase() }), 'leaf-outline')}
      {text ? body(text) : <>
        {body(t('{product} speeds up how fast your skin renews: clogs that were already there come out faster. It’s temporary and usually settles in 4 to 6 weeks.', { product }))}
        {small(`• ${t('Keep going, as planned.')}\n• ${t('Don’t add any new product for now.')}\n• ${t('Don’t pick at the spots.')}`)}
        {small(t('We’ll ask you how it’s going in 4 weeks.'))}
      </>}
      <View style={styles.row}>{button(t('OK'), seen)}</View>
    </>)
  }
  return box(<>
    {head(t('PROBABLY A REACTION'), 'alert-circle-outline')}
    {body(t(WHY[check.reason] || WHY.itch, { product }))}
    {small(check.reason === 'too-long'
      ? t('Pause it and talk to a dermatologist about these spots.')
      : t('Pause it for 2 weeks and see if your skin calms down. If it’s painful or swollen, see a doctor.'))}
    <View style={styles.row}>
      {button(t('Pause it'), pause)}
      {button(t('Keep it'), seen, false)}
    </View>
  </>)
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, marginTop: SPACING.xxl },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  option: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderRadius: 14, padding: SPACING.md, marginTop: SPACING.sm },
  row: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  btn: { flex: 1, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
})
