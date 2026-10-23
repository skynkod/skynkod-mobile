import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Animated, Easing, ActivityIndicator, Alert, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import FeatureIcon from '../components/FeatureIcon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CommonActions } from '@react-navigation/native'
import { useColors } from '../components/ui'
import ProductVerdict from '../components/ProductVerdict'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { productMatch } from '../utils/ingredients-guide'
import { addToMyProducts, getProductsByIds } from '../utils/catalog'
import ProductThumb from '../components/ProductThumb'
import { saveRoutine } from '../utils/routines-service'
import { STEP_TYPES, STEP_ORDER, ESSENTIALS } from '../utils/routine-steps'
import { checkRoutine, suggestedDays, describeDays, EVERY_DAY, DAY_LABELS } from '../utils/routine-checks'
import { getUserRoutines } from '../utils/routines-service'
import { BottomSheet } from '../components/ui'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// Guided "build your routine": one essential step per page (I have one /
// Help me choose / Skip), then a summary where more steps can be added.
export default function RoutineBuilderScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const period = route?.params?.period === 'evening' ? 'evening' : 'morning'
  const essentials = ESSENTIALS[period]

  const [index, setIndex] = useState(0) // essential step shown; essentials.length = summary
  // Each slot is one product in the routine; a step type can have any number.
  // The essential slots use their step key as id so the wizard can find them.
  const startSlots = p => ESSENTIALS[p].map(key => ({ uid: key, key, product: null }))
  const [slots, setSlots] = useState(() => startSlots(period))
  const [saving, setSaving] = useState(false)
  const enter = useRef(new Animated.Value(1)).current

  // Fresh start each time the builder is opened; "Edit" reopens the saved
  // routine straight on the summary.
  useEffect(() => {
    const saved = route?.params?.editSteps
    if (!saved?.length) {
      setIndex(0)
      setSlots(startSlots(period))
      return
    }
    setIndex(ESSENTIALS[period].length)
    getProductsByIds(saved.map(s => s.product_id).filter(Boolean))
      .then(products => {
        const byId = Object.fromEntries(products.map(p => [p.id, p]))
        setSlots(saved.map((s, i) => ({ uid: `${s.key || 'step'}-saved-${i}`, key: STEP_TYPES[s.key] ? s.key : 'serum', product: byId[s.product_id] || null, days: s.days || null, acks: s.acks || [] })))
      })
      .catch(error => logError('RoutineBuilder_loadSaved', error, { period }, 'warn'))
  }, [route?.params?.startedAt])

  // A product chosen in the picker comes back here.
  useEffect(() => {
    const picked = route?.params?.picked
    if (!picked?.uid || !picked?.product) return
    navigation.setParams({ picked: undefined })
    // The same product only once per routine.
    const duplicate = slots.find(slot => slot.product?.id === picked.product.id && slot.uid !== picked.uid)
    if (duplicate) {
      Alert.alert(
        t('Already in your routine'),
        t('{product} is already in this routine as your {step}.', {
          product: picked.product.name,
          step: t(STEP_TYPES[duplicate.key].label).toLowerCase(),
        })
      )
      return
    }
    const match = productMatch(picked.product, profile)
    if (match.avoid.length) {
      // Something the user must not use (allergy, pregnancy...): explain why.
      const first = match.avoid[0]
      Alert.alert(
        t('Not recommended for you'),
        `${t(first.text)}.\n\n${t(first.detail || '')}`,
        [
          { text: t('Keep anyway'), style: 'destructive' },
          { text: t('Choose another'), style: 'cancel', onPress: () => pick(picked.stepKey, picked.uid) },
        ]
      )
    } else if (match.triggered.length) {
      Alert.alert(
        t('Not for your skin'),
        `${t(match.triggered[0].text)}.\n\n${t(match.triggered[0].detail)}`,
        [
          { text: t('Keep anyway'), style: 'destructive' },
          { text: t('Choose another'), style: 'cancel', onPress: () => pick(picked.stepKey, picked.uid) },
        ]
      )
    } else if (match.tone === 'warning') {
      const first = match.triggers.find(tr => tr.level === 'patch') || match.care[0]
      Alert.alert(
        t('Patch test first'),
        `${t(first?.text || '')}.\n\n${t(first?.detail || '')}`,
        [
          { text: t('Choose another'), onPress: () => pick(picked.stepKey, picked.uid) },
          { text: t('Keep it'), style: 'cancel' },
        ]
      )
    }
    setSlots(prev => {
      if (prev.some(slot => slot.uid === picked.uid)) {
        return prev.map(slot => (slot.uid === picked.uid ? { ...slot, product: picked.product, days: suggestedDays(picked.product, period) } : slot))
      }
      // New slot goes after the others of its kind, in routine order.
      const next = [...prev, { uid: picked.uid, key: picked.stepKey, product: picked.product, days: suggestedDays(picked.product, period) }]
      return next
        .map((slot, i) => ({ slot, i }))
        .sort((a, b) => STEP_ORDER.indexOf(a.slot.key) - STEP_ORDER.indexOf(b.slot.key) || a.i - b.i)
        .map(({ slot }) => slot)
    })
  }, [route?.params?.picked])

  useEffect(() => {
    enter.setValue(0)
    Animated.timing(enter, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
  }, [index])

  const inSummary = index >= essentials.length
  // Leaving always lands on Routines, not on the picker or Koda visited before.
  // The builder, picker and scanner are dropped from the back history, so
  // Back on Routines returns to where she came from instead of looping here.
  const exitTo = params => {
    const state = navigation.getState()
    const target = state.routes.findIndex(route => route.name === 'Routines')
    if (target < 0 || !Array.isArray(state.history)) return navigation.navigate('Routines', params, { merge: true })
    const passing = new Set(state.routes.filter(route => ['RoutineBuilder', 'ProductPicker', 'Scanner', 'Routines'].includes(route.name)).map(route => route.key))
    navigation.dispatch(CommonActions.reset({
      ...state,
      index: target,
      routes: state.routes.map((route, i) => (i === target ? { ...route, params: { ...route.params, ...params } } : route)),
      history: [...state.history.filter(entry => !passing.has(entry.key)), { type: 'route', key: state.routes[target].key }],
    }))
  }
  const leave = () => exitTo({ tab: period })
  const stepKey = essentials[index]
  const step = STEP_TYPES[stepKey]
  const currentSlot = slots.find(slot => slot.uid === stepKey)

  const pick = (key, uid = key) => navigation.navigate('ProductPicker', { stepKey: key, uid, period })
  const addStep = key => pick(key, `${key}-${Date.now()}`)
  const removeSlot = uid => setSlots(prev => prev.filter(slot => slot.uid !== uid))
  const addable = STEP_ORDER.filter(key => period === 'morning' || key !== 'sunscreen')
  const askKoda = key =>
    navigation.navigate('Koda', {
      returnTo: 'RoutineBuilder',
      prefill: t("I'm building my {period} routine. Which {step} would you recommend for my skin?", {
        period: t(period === 'morning' ? 'morning' : 'night'),
        step: t(STEP_TYPES[key].label).toLowerCase(),
      }),
    })

  // The other routine (morning ↔ night), so checks can see the whole day.
  const [other, setOther] = useState({ steps: [], productsById: {} })
  useEffect(() => {
    if (!user?.id) return
    const otherType = period === 'morning' ? 'evening' : 'morning'
    getUserRoutines(user.id).then(async res => {
      const steps = (res.success ? res.data : []).find(r => r.type === otherType)?.steps || []
      const products = await getProductsByIds(steps.map(s => s.product_id).filter(Boolean)).catch(() => [])
      setOther({ steps, productsById: Object.fromEntries(products.map(p => [p.id, p])) })
    })
  }, [user?.id, period, route?.params?.startedAt])

  const chosenSlots = slots.filter(slot => slot.product)
  const issues = checkRoutine({
    period,
    steps: chosenSlots.map(slot => ({ product_id: slot.product.id, days: slot.days, acks: slot.acks || [] })),
    productsById: Object.fromEntries(chosenSlots.map(slot => [slot.product.id, slot.product])),
    otherSteps: other.steps,
    otherProductsById: other.productsById,
  })
  // "I'm used to this": the warning stays quiet for that product.
  const acknowledge = issue => {
    const uid = chosenSlots[issue.stepIndex]?.uid
    if (!uid) return
    setSlots(prev => prev.map(slot => (slot.uid === uid ? { ...slot, acks: [...new Set([...(slot.acks || []), issue.key])] } : slot)))
    Alert.alert(t("Got it, we won't remind you"), t('If your skin gets red, tight or stings, space it out a little.'))
  }

  const applyFix = fix => {
    const uid = chosenSlots[fix.stepIndex]?.uid
    if (uid && fix.days?.length) setSlots(prev => prev.map(slot => (slot.uid === uid ? { ...slot, days: fix.days } : slot)))
  }

  // Which days a product is used, edited in a small sheet.
  const [daysFor, setDaysFor] = useState(null) // slot uid
  const editingSlot = slots.find(slot => slot.uid === daysFor)
  const toggleDay = d =>
    setSlots(prev => prev.map(slot => {
      if (slot.uid !== daysFor) return slot
      const current = slot.days && slot.days.length ? slot.days : EVERY_DAY
      const next = current.includes(d) ? current.filter(x => x !== d) : [...current, d].sort()
      return { ...slot, days: next.length ? next : current }
    }))
  const setDays = days => setSlots(prev => prev.map(slot => (slot.uid === daysFor ? { ...slot, days } : slot)))

  const save = async () => {
    const chosen = slots.filter(slot => slot.product)
    // No products left: she can empty the routine, after a quick confirmation.
    if (!chosen.length) {
      Alert.alert(t('Empty this routine?'), t('All products will be removed from this routine. You can add them again anytime.'), [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('Empty it'), style: 'destructive', onPress: () => store(chosen) },
      ])
      return
    }
    store(chosen)
  }

  const store = async chosen => {
    setSaving(true)
    try {
      const routineSteps = chosen.map(({ key, product, days, acks }) => ({
        key,
        action: STEP_TYPES[key].label,
        product: `${product.brand} ${product.name}`.trim(),
        product_id: product.id,
        image_url: product.image_url || null,
        days: days && days.length < 7 ? days : null,
        acks: acks && acks.length ? acks : null,
      }))
      const result = await saveRoutine(user.id, period, routineSteps)
      if (!result.success) throw new Error(result.error)
      await Promise.all(chosen.map(({ product }) =>
        addToMyProducts(user.id, product, 'owned').catch(error => logError('RoutineBuilder_addProduct', error, { id: product.id }, 'warn'))
      ))
      exitTo({ tab: period, savedAt: Date.now() })
    } catch (error) {
      console.log('Routine save failed:', error?.message)
      await logError('RoutineBuilder_save', error, { period }, 'warn')
      Alert.alert(t('Error'), t("Couldn't save your routine. Try again."))
    } finally {
      setSaving(false)
    }
  }

  const ProductCard = ({ product, onChange, onRemove }) => {
    return (
      <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ProductThumb product={product} style={styles.photo} />
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.caption, { color: colors.textSecondary }]} numberOfLines={1}>{product.brand}</Text>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={2}>{product.name}</Text>
          <ProductVerdict product={product} profile={profile} />
        </View>
        <View style={{ alignItems: 'flex-end', gap: SPACING.md }}>
          {onRemove ? (
            <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel={t('Remove')}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
          {onChange ? (
            <Pressable onPress={onChange} hitSlop={10}>
              <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Change')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    )
  }

  const Pill = ({ title, onPress, secondary, icon, loading }) => (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: secondary ? colors.primarySoft : colors.primary, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? <ActivityIndicator color={secondary ? colors.primary : colors.onPrimary} /> : (
        <>
          {icon ? <FeatureIcon name={icon} size={18} color={secondary ? colors.primary : colors.onPrimary} /> : null}
          <Text style={[styles.pillText, { color: secondary ? colors.primary : colors.onPrimary }]}>{title}</Text>
        </>
      )}
    </Pressable>
  )

  const progress = Math.min(1, index / essentials.length)

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => (index > 0 && !route?.params?.editSteps?.length ? setIndex(index - 1) : leave())}
          hitSlop={12}
          accessibilityLabel={t('Back')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[TYPE.bodyStrong, { color: colors.text }]}>
          {period === 'morning' ? t('Morning routine') : t('Night routine')}
        </Text>
        <Pressable onPress={leave} hitSlop={12} accessibilityLabel={t('Close')}>
          <Ionicons name="close" size={24} color={colors.muted} />
        </Pressable>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { backgroundColor: colors.accent, width: `${(inSummary ? 1 : progress) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          {!inSummary ? (
            <>
              <Text style={[TYPE.overline, { color: colors.primary }]}>
                {t('Step {n} of {total}', { n: index + 1, total: essentials.length })}
              </Text>
              <View style={[styles.stepIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={step.icon} size={26} color={colors.primary} />
              </View>
              <Text style={[styles.headline, { color: colors.text }]}>{t(step.title)}</Text>
              <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.sm }]}>{t(step.why)}</Text>

              {currentSlot?.product ? (
                <View style={{ marginTop: SPACING.xl }}>
                  <ProductCard product={currentSlot.product} onChange={() => pick(stepKey)} />
                </View>
              ) : (
                <View style={{ marginTop: SPACING.xxl, gap: SPACING.sm }}>
                  <Pill title={t('I have one')} icon="checkmark-circle-outline" onPress={() => pick(stepKey)} />
                  <Pill title={t('Help me choose')} icon="koda" secondary onPress={() => askKoda(stepKey)} />
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={[TYPE.overline, { color: colors.primary }]}>{t('Almost done')}</Text>
              <Text style={[styles.headline, { color: colors.text }]}>
                {period === 'morning' ? t('Your morning routine') : t('Your night routine')}
              </Text>
              <View style={{ marginTop: SPACING.xl, gap: SPACING.md }}>
                {slots.map((slot, i) => (
                  <View key={slot.uid}>
                    <Text style={[styles.stepLabel, { color: colors.muted }]}>{`${i + 1}. ${t(STEP_TYPES[slot.key].label).toUpperCase()}`}</Text>
                    {slot.product ? (
                      <>
                        <ProductCard product={slot.product} onChange={() => pick(slot.key, slot.uid)} onRemove={() => removeSlot(slot.uid)} />
                        <Pressable onPress={() => setDaysFor(slot.uid)} style={[styles.daysChip, { backgroundColor: colors.primarySoft }]}>
                          <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t(describeDays(slot.days))}</Text>
                          <Ionicons name="chevron-down" size={12} color={colors.primary} />
                        </Pressable>
                      </>
                    ) : (
                      <Pressable onPress={() => pick(slot.key, slot.uid)} style={[styles.emptyStep, { borderColor: colors.border }]}>
                        <Ionicons name="add" size={18} color={colors.primary} />
                        <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Choose a product')}</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>

              {issues.length ? (
                <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
                  {issues.map((issue, idx) => (
                    <View key={idx} style={[styles.issue, { backgroundColor: issue.level === 'warning' ? colors.warningSoft : colors.surface }]}>
                      <View style={styles.issueHead}>
                        <Ionicons name={issue.level === 'warning' ? 'alert-circle' : 'information-circle'} size={18} color={issue.level === 'warning' ? colors.warning : colors.primary} />
                        <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{t(issue.title)}</Text>
                      </View>
                      <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>{t(issue.text)}</Text>
                      <View style={styles.issueActions}>
                        {issue.fix ? (
                          <Pressable onPress={() => applyFix(issue.fix)} style={[styles.fixButton, { backgroundColor: colors.card }]}>
                            <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>
                              {t('Fix: use it on {days}', { days: describeDays(issue.fix.days) })}
                            </Text>
                          </Pressable>
                        ) : null}
                        {issue.stepIndex !== undefined ? (
                          <Pressable onPress={() => acknowledge(issue)} style={[styles.fixButton, { backgroundColor: 'transparent' }]}>
                            <Text style={[TYPE.caption, { color: colors.textSecondary, fontWeight: '700' }]}>{t("I'm used to this")}</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {addable.length ? (
                <>
                  <Text style={[styles.stepLabel, { color: colors.muted, marginTop: SPACING.xl }]}>{t('ADD A STEP')}</Text>
                  <View style={styles.chips}>
                    {addable.map(k => (
                      <Pressable key={k} onPress={() => addStep(k)} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                        <Ionicons name="add" size={14} color={colors.primary} />
                        <Text style={[TYPE.caption, { color: colors.text, fontWeight: '600' }]}>{t(STEP_TYPES[k].label)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
            </>
          )}
        </Animated.View>
      </ScrollView>

      <Modal visible={!!editingSlot} transparent animationType="fade" onRequestClose={() => setDaysFor(null)}>
        <BottomSheet title={t('When do you use it?')} onClose={() => setDaysFor(null)}>
          {editingSlot ? (
            <>
              <Text style={[TYPE.body, { color: colors.textSecondary }]}>{editingSlot.product?.name}</Text>
              <View style={styles.dayRow}>
                {DAY_LABELS.map((label, d) => {
                  const on = (editingSlot.days && editingSlot.days.length ? editingSlot.days : EVERY_DAY).includes(d)
                  return (
                    <Pressable key={label} onPress={() => toggleDay(d)} style={[styles.day, { backgroundColor: on ? colors.primary : colors.card, borderColor: on ? colors.primary : colors.border }]}>
                      <Text style={{ color: on ? colors.onPrimary : colors.text, fontWeight: '700', fontSize: 12 }}>{t(label)}</Text>
                    </Pressable>
                  )
                })}
              </View>
              <View style={[styles.chips, { marginTop: SPACING.lg, marginBottom: SPACING.xl }]}>
                {[
                  { label: 'Every day', days: EVERY_DAY },
                  { label: '3 times a week', days: [1, 3, 5] },
                  { label: '2 times a week', days: [2, 6] },
                  { label: 'Once a week', days: [0] },
                ].map(p => (
                  <Pressable key={p.label} onPress={() => setDays(p.days)} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <Text style={[TYPE.caption, { color: colors.text, fontWeight: '600' }]}>{t(p.label)}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
        </BottomSheet>
      </Modal>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        {!inSummary ? (
          currentSlot?.product ? (
            <Pill title={t('Next')} icon="arrow-forward" onPress={() => setIndex(index + 1)} />
          ) : (
            <Pressable onPress={() => setIndex(index + 1)} style={{ alignSelf: 'center', padding: SPACING.md }}>
              <Text style={[TYPE.bodyStrong, { color: colors.muted }]}>{t('Skip this step')}</Text>
            </Pressable>
          )
        ) : (
          <Pill title={t('Save my routine')} icon="checkmark" onPress={save} loading={saving} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, height: 52 },
  track: { height: 3, marginHorizontal: SPACING.xl, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 2 },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  stepIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.lg },
  headline: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, lineHeight: 36, marginTop: SPACING.lg },
  productCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md },
  photo: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#FFFFFF' },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', gap: SPACING.sm, height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 16, fontWeight: '600' },
  stepLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
  emptyStep: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderRadius: RADIUS.md, padding: SPACING.lg },
  daysChip: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 6 },
  issue: { borderRadius: RADIUS.md, padding: SPACING.lg },
  issueHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  issueActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  fixButton: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: SPACING.sm },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.lg },
  day: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  footer: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md },
})
