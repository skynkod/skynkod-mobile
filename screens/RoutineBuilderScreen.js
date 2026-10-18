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
import { addToMyProducts } from '../utils/catalog'
import { saveRoutine } from '../utils/routines-service'
import { STEP_TYPES, ESSENTIALS, OPTIONAL, sortSteps } from '../utils/routine-steps'
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
  const [steps, setSteps] = useState(essentials) // step keys in the routine
  const [picks, setPicks] = useState({}) // stepKey → product
  const [saving, setSaving] = useState(false)
  const enter = useRef(new Animated.Value(1)).current

  // Fresh start each time the builder is opened from somewhere.
  useEffect(() => {
    setIndex(0)
    setSteps(ESSENTIALS[period])
    setPicks({})
  }, [route?.params?.startedAt])

  // A product chosen in the picker comes back here.
  useEffect(() => {
    const picked = route?.params?.picked
    if (!picked?.stepKey || !picked?.product) return
    setPicks(prev => ({ ...prev, [picked.stepKey]: picked.product }))
    setSteps(prev => (prev.includes(picked.stepKey) ? prev : sortSteps([...prev, picked.stepKey])))
    navigation.setParams({ picked: undefined })
  }, [route?.params?.picked])

  useEffect(() => {
    enter.setValue(0)
    Animated.timing(enter, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
  }, [index])

  const inSummary = index >= essentials.length
  const stepKey = essentials[index]
  const step = STEP_TYPES[stepKey]

  const pick = key => navigation.navigate('ProductPicker', { stepKey: key, period })
  const askKoda = key =>
    navigation.navigate('Koda', {
      prefill: t("I'm building my {period} routine. Which {step} would you recommend for my skin?", {
        period: t(period === 'morning' ? 'morning' : 'night'),
        step: t(STEP_TYPES[key].label).toLowerCase(),
      }),
    })

  const save = async () => {
    const chosen = steps.filter(k => picks[k])
    if (!chosen.length) {
      Alert.alert(t('Add at least one product'), t('Pick a product for one of the steps first.'))
      return
    }
    setSaving(true)
    try {
      const routineSteps = chosen.map(k => ({
        key: k,
        action: STEP_TYPES[k].label,
        product: `${picks[k].brand} ${picks[k].name}`.trim(),
        product_id: picks[k].id,
        image_url: picks[k].image_url || null,
      }))
      const result = await saveRoutine(user.id, period, routineSteps)
      if (!result.success) throw new Error(result.error)
      await Promise.all(chosen.map(k => addToMyProducts(user.id, picks[k]).catch(() => {})))
      navigation.navigate('Routines', { tab: period, savedAt: Date.now() })
    } catch (error) {
      await logError('RoutineBuilder_save', error, { period }, 'warn')
      Alert.alert(t('Error'), t("Couldn't save your routine. Try again."))
    } finally {
      setSaving(false)
    }
  }

  const ProductCard = ({ product, onChange }) => {
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
        {onChange ? (
          <Pressable onPress={onChange} hitSlop={10}>
            <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('Change')}</Text>
          </Pressable>
        ) : null}
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
  const addable = OPTIONAL[period].filter(k => !steps.includes(k))

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => (index > 0 ? setIndex(index - 1) : navigation.goBack())}
          hitSlop={12}
          accessibilityLabel={t('Back')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[TYPE.bodyStrong, { color: colors.text }]}>
          {period === 'morning' ? t('Morning routine') : t('Night routine')}
        </Text>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel={t('Close')}>
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

              {picks[stepKey] ? (
                <View style={{ marginTop: SPACING.xl }}>
                  <ProductCard product={picks[stepKey]} onChange={() => pick(stepKey)} />
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
                {steps.map((k, i) => (
                  <View key={k}>
                    <Text style={[styles.stepLabel, { color: colors.muted }]}>{`${i + 1}. ${t(STEP_TYPES[k].label).toUpperCase()}`}</Text>
                    {picks[k] ? (
                      <ProductCard product={picks[k]} onChange={() => pick(k)} />
                    ) : (
                      <Pressable onPress={() => pick(k)} style={[styles.emptyStep, { borderColor: colors.border }]}>
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
                      <Pressable key={k} onPress={() => pick(k)} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }]}>
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
          picks[stepKey] ? (
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
