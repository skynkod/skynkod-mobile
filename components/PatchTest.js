import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useColors } from './ui'
import { useT, useLanguage } from '../utils/LanguageContext'
import { patchOfferFor, startPatchTest, declinePatchTest, duePatchTest, answerPatchTest } from '../utils/patch-test'
import { logError } from '../utils/errorLogger'
import { SPACING, TYPE } from '../utils/theme'

// "New product" mode (Lita, 2026-10-25): one discreet line when she adds a
// product, and one question on Home when the 7-day test ends. Nothing else.

// The line under a product she just added.
export function PatchTestOffer({ userId, product, profile, style }) {
  const colors = useColors()
  const t = useT()
  const { language } = useLanguage()
  const [offer, setOffer] = useState(null)
  const [done, setDone] = useState(null) // 'yes' | 'no'
  useEffect(() => {
    if (userId && product?.id && profile) patchOfferFor(userId, product, profile).then(setOffer).catch(() => setOffer(null))
  }, [userId, product?.id, profile])
  if (!offer || done === 'no') return null
  const date = d => d.toLocaleDateString(language, { day: 'numeric', month: 'short' })

  return (
    <View style={[styles.offer, { backgroundColor: colors.primarySoft }, style]}>
      <Ionicons name="flask-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        {done === 'yes' ? (
          <Text style={[TYPE.caption, { color: colors.text, lineHeight: 18 }]}>{t('Put a little on the inside of your elbow, morning and evening, for 7 days. Redness or itching before then? Stop it. In 7 days, we’ll ask you how it went.')}</Text>
        ) : <>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('New for your skin? Test it first on a small area.')}</Text>
          {offer.other ? (
            <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
              {t('You started {other} on {date}. One new product at a time: wait until {until} to know what suits your skin.', { other: offer.other.name, date: date(new Date(offer.other.date)), until: date(offer.other.until) })}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm }}>
            <Pressable hitSlop={6} onPress={() => { setDone('yes'); startPatchTest(userId, offer.product).catch(error => logError('Patch_start', error, {}, 'warn')) }}>
              <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Yes')}</Text>
            </Pressable>
            <Pressable hitSlop={6} onPress={() => { setDone('no'); declinePatchTest(userId).catch(() => {}) }}>
              <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '700' }]}>{t('No thanks')}</Text>
            </Pressable>
          </View>
        </>}
      </View>
    </View>
  )
}

// Home, on day 7: "Your test: all good?"
export const usePatchTestDue = (userId) => {
  const [test, setTest] = useState(null)
  const reload = useCallback(() => {
    if (!userId) return Promise.resolve()
    return duePatchTest(userId).then(setTest).catch(() => setTest(null))
  }, [userId])
  useFocusEffect(useCallback(() => { reload() }, [reload]))
  return { test, reload }
}

export function PatchTestCard({ userId, test, onChange, style }) {
  const colors = useColors()
  const t = useT()
  const [red, setRed] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!test) return null
  const answer = async ok => {
    if (busy) return
    setBusy(true)
    try {
      await answerPatchTest(userId, test, ok)
      if (ok) await onChange?.()
      else setRed(true)
    } catch (error) {
      logError('Patch_answer', error)
    } finally {
      setBusy(false)
    }
  }
  const option = (label, icon, onPress) => (
    <Pressable onPress={onPress} disabled={busy} style={({ pressed }) => [styles.option, { borderColor: colors.border, opacity: pressed || busy ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{label}</Text>
    </Pressable>
  )
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        <Ionicons name="flask-outline" size={16} color={colors.primary} />
        <Text style={[styles.kicker, { color: colors.primary, flex: 1 }]}>{t('YOUR PATCH TEST')}</Text>
      </View>
      {red ? <>
        <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, lineHeight: 21 }]}>{t('{product} is paused: it stays out of your routine.', { product: test.name })}</Text>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm, lineHeight: 18 }]}>{t('Rinse the area with water. If it swells or gets worse, see a doctor.')}</Text>
        <Pressable onPress={() => onChange?.()} style={[styles.btn, { backgroundColor: colors.primary }]}>
          <Text style={[TYPE.bodyStrong, { color: colors.onPrimary }]}>{t('OK')}</Text>
        </Pressable>
      </> : <>
        <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, lineHeight: 21 }]}>{t('You tested {product}. Any redness or itching?', { product: test.name })}</Text>
        {option(t('All good'), 'checkmark-circle-outline', () => answer(true))}
        {option(t('Redness or itching'), 'alert-circle-outline', () => answer(false))}
      </>}
    </View>
  )
}

const styles = StyleSheet.create({
  offer: { flexDirection: 'row', gap: SPACING.sm, borderRadius: 14, padding: SPACING.md, marginTop: SPACING.md },
  card: { borderWidth: 1, borderRadius: 20, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, marginTop: SPACING.xxl },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 },
  option: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderRadius: 14, padding: SPACING.md, marginTop: SPACING.sm },
  btn: { height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md },
})
