import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColors } from './ui'
import ProductVerdict from './ProductVerdict'
import ExpectationLine from './ExpectationLine'
import StopAdvice from './StopAdvice'
import AskKodaLink from './AskKodaLink'
import { useT } from '../utils/LanguageContext'
import { expectationFor, expectationStatus } from '../utils/expectations'
import { SPACING } from '../utils/theme'
import { GTYPE, GFW } from './glossy'
import FeatureIcon from './FeatureIcon'

// Under each product of her routine (Lita's audit, 2026-10-24): one line, the
// most useful right now. Consider stopping first, then "time to look", then
// "Day 11", then the verdict. Everything else opens on tap.
export default function RoutineProductLine({ product, profile, stopAdvice, started, verdict, canAsk = true, onAnswer, onStop, kodaPrefill }) {
  const colors = useColors()
  const t = useT()
  const [open, setOpen] = useState(false)
  const advice = stopAdvice.adviceFor(product)
  const adviceShown = advice && (advice.free || stopAdvice.premium)
  const st = expectationStatus(expectationFor(product), started)
  const top = adviceShown ? 'stop' : st?.phase === 'look' && !verdict && canAsk ? 'look' : st ? 'day' : 'verdict'
  const tone = advice?.level === 'danger' ? colors.danger : colors.warning

  const stopCard = <StopAdvice advice={advice} product={product} inRoutine premium={stopAdvice.premium} onStop={onStop} onKeep={() => stopAdvice.keep(product, advice?.kind)} />
  const expect = <ExpectationLine product={product} startedAt={started} verdict={verdict} onAnswer={onAnswer} canAsk={canAsk} />

  return (
    <View>
      {top === 'stop' ? (
        open ? stopCard : (
          <Pressable onPress={() => setOpen(true)} style={styles.line} hitSlop={4}>
            <Ionicons name="alert-circle" size={14} color={tone} />
            <Text style={[GTYPE.caption, { color: tone, ...GFW('700'), flex: 1 }]} numberOfLines={1}>{t('Consider stopping')} · {t(advice.title)}</Text>
          </Pressable>
        )
      ) : top === 'verdict' ? <ProductVerdict product={product} profile={profile} /> : expect}

      {open ? (
        <View style={{ marginTop: SPACING.xs }}>
          {top !== 'verdict' ? <ProductVerdict product={product} profile={profile} /> : null}
          {top === 'stop' && st ? expect : null}
          {top !== 'stop' && advice ? stopCard : null}
          <AskKodaLink label="Ask Koda" returnTo="Routines" style={{ marginTop: SPACING.sm }} prefill={kodaPrefill} />
        </View>
      ) : null}

      <Pressable onPress={() => setOpen(o => !o)} hitSlop={8} style={styles.more} accessibilityRole="button">
        <Text style={[GTYPE.caption, { color: colors.muted, ...GFW('600') }]}>{open ? t('Less') : t('More')}</Text>
        <FeatureIcon name={open ? 'chevron-up' : 'chevron-down'} size={12} color={colors.muted} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', marginTop: 6 },
})
