import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { supabase } from '../utils/supabase'
import { expectationFor, expectationStatus } from '../utils/expectations'
import { SPACING, TYPE } from '../utils/theme'

// "Your expectations" under each product in her routines (Lita, 2026-10-24):
// how long she has used it, and when it's fair to judge it. Free.

import { verdictKey, getVerdicts } from '../utils/expectation-verdicts'
import { trackVerdict } from '../utils/journey'

export { verdictKey, getVerdicts }

export const useExpectations = (userId, productIds = []) => {
  const [state, setState] = useState({ started: {}, verdicts: {} })
  const ids = productIds.filter(Boolean).join(',')
  useFocusEffect(useCallback(() => {
    if (!userId || !ids) return
    let active = true
    Promise.all([
      supabase.from('user_products').select('product_id, opened_at').eq('user_id', userId).in('product_id', ids.split(',')).not('opened_at', 'is', null),
      getVerdicts(userId),
    ]).then(([res, verdicts]) => {
      if (!active) return
      const started = {}
      for (const r of res.data || []) if (!started[r.product_id] || r.opened_at < started[r.product_id]) started[r.product_id] = r.opened_at
      setState({ started, verdicts })
    }).catch(() => {})
    return () => { active = false }
  }, [userId, ids]))
  const answer = async (productId, value) => {
    const verdicts = { ...state.verdicts, [productId]: { value, at: Date.now() } }
    setState(s => ({ ...s, verdicts }))
    await AsyncStorage.setItem(verdictKey(userId), JSON.stringify(verdicts)).catch(() => {})
    trackVerdict(userId)
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

export default function ExpectationLine({ product, startedAt, verdict, onAnswer }) {
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
        <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1, lineHeight: 17 }]}>
          {st.phase === 'early'
            ? t('Day {day} · too early to judge. {what}: first changes after {range} weeks.', { day: st.day, what: t(expect.what), range })
            : verdict ? t(SAID[verdict.value]) : t('Week {week} · time to look: how is your skin with it?', { week: st.week })}
        </Text>
      </View>
      {st.phase === 'look' && !verdict ? (
        <View style={styles.answers}>
          {ANSWERS.map(a => (
            <Pressable key={a.value} onPress={() => onAnswer?.(a.value)} hitSlop={4} style={[styles.answer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[TYPE.caption, { color: colors.text, fontWeight: '600' }]}>{a.emoji} {t(a.label)}</Text>
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
