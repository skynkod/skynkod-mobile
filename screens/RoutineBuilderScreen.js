import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Animated, Easing, ActivityIndicator, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../components/ui'
import MatchBadge from '../components/MatchBadge'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { productMatch } from '../utils/ingredients-guide'
import { addToMyProducts, getProductsByIds } from '../utils/catalog'
import { saveRoutine } from '../utils/routines-service'
import { STEP_TYPES, STEP_ORDER, ESSENTIALS } from '../utils/routine-steps'
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
        setSlots(saved.map((s, i) => ({ uid: `${s.key || 'step'}-saved-${i}`, key: STEP_TYPES[s.key] ? s.key : 'serum', product: byId[s.product_id] || null })))
      })
      .catch(error => logError('RoutineBuilder_loadSaved', error, { period }, 'warn'))
  }, [route?.params?.startedAt])

  // A product chosen in the picker comes back here.
  useEffect(() => {
    const picked = route?.params?.picked
    if (!picked?.uid || !picked?.product) return
    setSlots(prev => {
      if (prev.some(slot => slot.uid === picked.uid)) {
        return prev.map(slot => (slot.uid === picked.uid ? { ...slot, product: picked.product } : slot))
      }
      // New slot goes after the others of its kind, in routine order.
      const next = [...prev, { uid: picked.uid, key: picked.stepKey, product: picked.product }]
      return next
        .map((slot, i) => ({ slot, i }))
        .sort((a, b) => STEP_ORDER.indexOf(a.slot.key) - STEP_ORDER.indexOf(b.slot.key) || a.i - b.i)
        .map(({ slot }) => slot)
    })
    navigation.setParams({ picked: undefined })
  }, [route?.params?.picked])

  useEffect(() => {
    enter.setValue(0)
    Animated.timing(enter, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
  }, [index])

  const inSummary = index >= essentials.length
  // Leaving always lands on Routines, not on the picker or Koda visited before.
  const leave = () => navigation.navigate({ name: 'Routines', params: { tab: period }, merge: true })
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

  const save = async () => {
    const chosen = slots.filter(slot => slot.product)
    if (!chosen.length) {
      Alert.alert(t('Add at least one product'), t('Pick a product for one of the steps first.'))
      return
    }
    setSaving(true)
    try {
      const routineSteps = chosen.map(({ key, product }) => ({
        key,
        action: STEP_TYPES[key].label,
        product: `${product.brand} ${product.name}`.trim(),
        product_id: product.id,
        image_url: product.image_url || null,
      }))
      const result = await saveRoutine(user.id, period, routineSteps)
      if (!result.success) throw new Error(result.error)
      await Promise.all(chosen.map(({ product }) => addToMyProducts(user.id, product).catch(() => {})))
      navigation.navigate('Routines', { tab: period, savedAt: Date.now() })
    } catch (error) {
      await logError('RoutineBuilder_save', error, { period }, 'warn')
      Alert.alert(t('Error'), t("Couldn't save your routine. Try again."))
    } finally {
      setSaving(false)
    }
  }

  const ProductCard = ({ product, onChange, onRemove }) => {
    const match = productMatch(product, profile)
    return (
      <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.photo} resizeMode="contain" />
        ) : (
          <View style={[styles.photo, styles.noPhoto, { backgroundColor: colors.surface }]}>
            <Ionicons name="water-outline" size={18} color={colors.muted} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.caption, { color: colors.textSecondary }]} numberOfLines={1}>{product.brand}</Text>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={2}>{product.name}</Text>
          <View style={{ marginTop: 4 }}><MatchBadge tone={match.tone} label={`${match.score}% · ${t(match.label)}`} /></View>
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
          {icon ? <Ionicons name={icon} size={18} color={secondary ? colors.primary : colors.onPrimary} /> : null}
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
                  <Pill title={t('Help me choose')} icon="sparkles-outline" secondary onPress={() => askKoda(stepKey)} />
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
                      <ProductCard product={slot.product} onChange={() => pick(slot.key, slot.uid)} onRemove={() => removeSlot(slot.uid)} />
                    ) : (
                      <Pressable onPress={() => pick(slot.key, slot.uid)} style={[styles.emptyStep, { borderColor: colors.border }]}>
                        <Ionicons name="add" size={18} color={colors.primary} />
                        <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Choose a product')}</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>

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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  footer: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md },
})
