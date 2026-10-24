import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useColors } from './ui'
import { usePremium } from './PremiumLock'
import { useT } from '../utils/LanguageContext'
import { getUserRoutines, saveRoutine } from '../utils/routines-service'
import { getProductsByIds } from '../utils/catalog'
import { getProductReactions } from '../utils/journal-day'
import { stopReason } from '../utils/stop-advice'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// "Consider stopping" (Lita, 2026-10-24): the data each screen needs (her
// routines, the journal's reactions, what she chose to keep), and the card.

const keptKey = userId => `stop_kept_${userId}`

export const useStopAdvice = (userId, profile) => {
  const premium = usePremium()
  const [ctx, setCtx] = useState({ routines: [], products: [], reactions: {}, kept: {} })
  const load = useCallback(async () => {
    if (!userId) return
    try {
      const [res, reactions, kept] = await Promise.all([
        getUserRoutines(userId),
        getProductReactions(userId).catch(() => []),
        AsyncStorage.getItem(keptKey(userId)).then(v => JSON.parse(v || '{}')).catch(() => ({})),
      ])
      const routines = res.success ? res.data || [] : []
      const ids = [...new Set(routines.flatMap(r => (r.steps || []).map(s => s.product_id)).filter(Boolean))]
      const products = ids.length ? await getProductsByIds(ids) : []
      setCtx({ routines, products, reactions: Object.fromEntries(reactions.map(r => [r.product.id, r])), kept })
    } catch (error) {
      logError('StopAdvice_load', error, {}, 'warn')
    }
  }, [userId])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const inRoutine = productId => ctx.routines.some(r => (r.steps || []).some(s => s.product_id === productId))
  const adviceFor = (product, row = null) => {
    if (!product) return null
    const life = row?.life || null
    const a = stopReason({ product, profile, reaction: ctx.reactions[product.id], life, others: ctx.products })
    return a && ctx.kept[`${product.id}:${a.kind}`] ? null : a
  }
  // Takes it out of every routine she has.
  const stop = async product => {
    for (const r of ctx.routines) {
      const steps = r.steps || []
      if (!steps.some(s => s.product_id === product.id)) continue
      const saved = await saveRoutine(userId, r.type, steps.filter(s => s.product_id !== product.id))
      if (!saved.success) throw new Error(saved.error)
    }
    await load()
  }
  const keep = async (product, kind) => {
    const kept = { ...ctx.kept, [`${product.id}:${kind}`]: Date.now() }
    setCtx(c => ({ ...c, kept }))
    AsyncStorage.setItem(keptKey(userId), JSON.stringify(kept)).catch(() => {})
  }
  return { premium, adviceFor, inRoutine, stop, keep, reload: load }
}

const ICON = { reaction: 'alert-circle', unsuitable: 'close-circle', expired: 'time-outline', duplicate: 'copy-outline', notNeeded: 'remove-circle-outline' }

export default function StopAdvice({ advice, product, inRoutine, premium, onStop, onKeep, style }) {
  const colors = useColors()
  const t = useT()
  const navigation = useNavigation()
  const [busy, setBusy] = useState(false)
  if (!advice) return null

  // Saving-money advice is Premium: a small teaser, never the reason itself.
  if (!advice.free && premium === false) {
    return (
      <Pressable onPress={() => navigation.navigate('Premium')} style={[styles.teaser, { borderColor: colors.border }, style]}>
        <Ionicons name="diamond" size={13} color={colors.primary} />
        <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1 }]}>{t('Skynkod has advice about this product')}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.muted} />
      </Pressable>
    )
  }
  if (!advice.free && premium === undefined) return null

  const tone = advice.level === 'danger' ? colors.danger : advice.level === 'warning' ? colors.warning : colors.muted
  const bg = advice.level === 'danger' ? colors.dangerSoft : advice.level === 'warning' ? colors.warningSoft : colors.surface

  const confirmStop = () => Alert.alert(
    t('Remove it from your routine?'),
    t('{product} will be taken out of your routines. You can add it back anytime.', { product: product.name }),
    [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Remove it'), style: 'destructive', onPress: async () => { setBusy(true); try { await onStop?.() } catch (e) { logError('StopAdvice_stop', e, {}, 'warn'); Alert.alert(t('Couldn’t save'), t('Check your connection and try again.')) } setBusy(false) } },
    ]
  )

  return (
    <View style={[styles.card, { backgroundColor: bg }, style]}>
      <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
        <Ionicons name={ICON[advice.kind] || 'alert-circle-outline'} size={16} color={tone} style={{ marginTop: 1 }} />
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.caption, { color: tone, fontWeight: '800', letterSpacing: 0.4 }]}>{t('CONSIDER STOPPING')} · {t(advice.title)}</Text>
          <Text style={[TYPE.caption, { color: colors.text, marginTop: 2, lineHeight: 18 }]}>{t(advice.text, advice.params)}</Text>
          {advice.kind === 'duplicate' || advice.kind === 'notNeeded' ? (
            <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2, lineHeight: 17 }]}>{t('It isn’t a bad product: it just doesn’t add much to your routine right now.')}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        {inRoutine ? (
          <Pressable onPress={confirmStop} disabled={busy} hitSlop={6} style={[styles.btn, { backgroundColor: tone }]}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>{t('Remove from routine')}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onKeep} hitSlop={6} style={[styles.btn, { borderWidth: 1, borderColor: tone }]}>
          <Text style={{ color: tone, fontWeight: '700', fontSize: 13 }}>{t('Keep it')}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm, marginLeft: 24 },
  btn: { borderRadius: 999, paddingHorizontal: SPACING.md, paddingVertical: 6 },
  teaser: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 8, marginTop: SPACING.sm },
})
