import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { supabase } from '../utils/supabase'
import { expectationFor, expectationStatus } from '../utils/expectations'
import { SPACING } from '../utils/theme'

// "Your expectations" under each product in her routines (Lita, 2026-10-24):
// how long she has used it, and when it's fair to judge it. Free.

import { verdictKey, getVerdicts, saveVerdicts } from '../utils/expectation-verdicts'
import { trackVerdict } from '../utils/journey'
import { markAsked, canAskAgain } from '../utils/ask-pace'
import { GTYPE, GFW, glassCard } from './glossy'

export { verdictKey, getVerdicts }

export const useExpectations = (userId, productIds = []) => {
  const [state, setState] = useState({ started: {}, verdicts: {}, canAsk: true })
  const ids = productIds.filter(Boolean).join(',')
  useFocusEffect(useCallback(() => {
    if (!userId || !ids) return
    let active = true
    Promise.all([
      supabase.from('user_products').select('product_id, opened_at').eq('user_id', userId).in('product_id', ids.split(',')).not('opened_at', 'is', null),
      getVerdicts(userId),
      canAskAgain(userId),
    ]).then(([res, verdicts, canAsk]) => {
      if (!active) return
      const started = {}
      for (const r of res.data || []) if (!started[r.product_id] || r.opened_at < started[r.product_id]) started[r.product_id] = r.opened_at
      setState({ started, verdicts, canAsk })
    }).catch(() => {})
    return () => { active = false }
  }, [userId, ids]))
  const answer = async (productId, value) => {
    const verdicts = { ...state.verdicts, [productId]: { value, at: Date.now() } }
    setState(s => ({ ...s, verdicts }))
    await saveVerdicts(userId, verdicts)
    trackVerdict(userId)
    markAsked(userId)
    setState(s => ({ ...s, canAsk: false }))
  }
  return { ...state, answer }
}

const ANSWERS = [
  { value: 'better', label: 'Better', emoji: '😊' },
  { value: 'same', label: 'Same', emoji: '😐' },
  { value: 'worse', label: 'Worse', emoji: '😣' },
]
const SAID = {
  better: 'You said it helps: keep going.',
  same: 'You said nothing changed: it may not do much for your skin.',
  worse: 'You said your skin got worse with it.',
}

export default function ExpectationLine({ product, startedAt, verdict, onAnswer, canAsk = true }) {
  const colors = useColors()
  const t = useT()
  const expect = expectationFor(product)
  const st = expectationStatus(expect, startedAt)
  if (!st) return null
  const range = `${expect.weeks[0]}–${expect.weeks[1]}`
  return (
    <View style={styles.wrap}>
      <View style={[styles.bar, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${Math.round(st.progress * 100)}%`, backgroundColor: st.phase === 'early' ? colors.primary : colors.success }]} />
      </View>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 6 }}>
        <Ionicons name="hourglass-outline" size={13} color={colors.muted} style={{ marginTop: 2 }} />
        <Text style={[GTYPE.caption, { color: colors.textSecondary, flex: 1, lineHeight: 17 }]}>
          {st.phase === 'early'
            ? t('Day {day} · too early to judge. {what}: first changes after {range} weeks.', { day: st.day, what: t(expect.what), range })
            : verdict ? t(SAID[verdict.value]) : canAsk ? t('Week {week} · time to look: how is your skin with it?', { week: st.week }) : t('Week {week} · we’ll ask how it’s going in a few days.', { week: st.week })}
        </Text>
      </View>
      {st.phase === 'look' && !verdict && canAsk ? (
        <View style={styles.answers}>
          {ANSWERS.map(a => (
            <Pressable key={a.value} onPress={() => onAnswer?.(a.value)} hitSlop={4} style={[styles.answer, { borderColor: colors.border, ...glassCard(colors) }]}>
              <Text style={[GTYPE.caption, { color: colors.text, ...GFW('600') }]}>{a.emoji} {t(a.label)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: SPACING.sm },
  bar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  answers: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm, marginLeft: 19 },
  answer: { borderWidth: 1, borderRadius: 999, paddingHorizontal: SPACING.md, paddingVertical: 5 },
})
