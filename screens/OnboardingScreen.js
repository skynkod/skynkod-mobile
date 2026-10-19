import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Animated, Easing, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as WebBrowser from 'expo-web-browser'
import { updateUserProfile } from '../utils/supabase'
import { logError } from '../utils/errorLogger'
import { useColors } from '../components/ui'
import { useT } from '../utils/LanguageContext'
import { SPACING, TYPE } from '../utils/theme'

const LOGO = require('../assets/images/skynkod-logo.png')
const KODA = require('../assets/images/koda-logo.png')
const LOGO_RATIO = 1306 / 333
const BRAND_MAUVE = '#C5A8BB'

// Same six features, wording and order as the left column of the mockup.
const FEATURES = [
  { icon: 'koda', title: 'AI Skin Coach', text: 'Koda analyzes your skin and gives personalized advice.' },
  { icon: 'sync-outline', title: 'Dynamic Routines', text: "Smart routines that adapt to your skin's real-time needs." },
  { icon: 'book-outline', title: 'What your skin tells you', text: 'Your daily check-in learns what makes your skin react.' },
  { icon: 'shield-checkmark-outline', title: 'Emergency Mode', text: 'Get a 7-day plan to repair, calm or prepare your skin.' },
  { icon: 'wallet-outline', title: 'Skynbudget', text: 'Track your collection, spending and get smart buying advice.' },
  { icon: 'scan-outline', title: 'Product Scan', text: 'Scan any product to analyze ingredients and compatibility.' },
]

// Skin types match the names used by the routine builder and the quiz.
const SKIN_TYPES = [
  { value: 'Dry', label: 'Dry', hint: 'Feels tight, can flake' },
  { value: 'Oily', label: 'Oily', hint: 'Shiny by midday' },
  { value: 'Combination', label: 'Combination', hint: 'Oily T-zone, drier cheeks' },
  { value: 'Normal', label: 'Normal', hint: 'Balanced, rarely bothers you' },
  { value: 'Sensitive', label: 'Sensitive', hint: 'Reacts easily, turns red' },
  { value: null, label: "Not sure yet", hint: 'You can take the skin quiz later' },
]

const CONCERNS = ['Acne', 'Redness', 'Dryness', 'Dark spots', 'Fine lines', 'Large pores', 'Dullness', 'Sensitivity']

const GOALS = [
  { value: 'clear', label: 'Clearer skin' },
  { value: 'hydration', label: 'Deep hydration' },
  { value: 'even_tone', label: 'An even skin tone' },
  { value: 'anti_aging', label: 'Smoother, firmer skin' },
  { value: 'simple', label: 'A routine I actually stick to' },
]

// Optional follow-ups that sharpen the compatibility score. Values are stored
// in English (users.acne_types / skin_conditions / avoid_ingredients / pregnancy).
const ACNE_TYPES = [
  { value: 'Comedonal', label: 'Blackheads & whiteheads' },
  { value: 'Inflammatory', label: 'Red, inflamed spots' },
  { value: 'Cystic', label: 'Deep, painful cysts' },
  { value: 'Hormonal', label: 'Hormonal (jawline, around periods)' },
  { value: 'Fungal', label: 'Tiny itchy bumps (fungal acne)' },
  { value: 'Unsure', label: 'Not sure' },
]
const CONDITIONS = [
  { value: 'Rosacea', label: 'Rosacea' },
  { value: 'Eczema', label: 'Eczema or atopic skin' },
  { value: 'Perioral dermatitis', label: 'Perioral dermatitis' },
  { value: 'Seborrheic dermatitis', label: 'Seborrheic dermatitis' },
  { value: 'Psoriasis', label: 'Psoriasis' },
  { value: 'Melasma', label: 'Melasma' },
  { value: 'None', label: 'None of these' },
]
const AVOID = [
  { value: 'Fragrance', label: 'Fragrance' },
  { value: 'Essential oils', label: 'Essential oils' },
  { value: 'Nuts', label: 'Nuts' },
  { value: 'Lanolin', label: 'Lanolin' },
  { value: 'Alcohol', label: 'Alcohol' },
  { value: 'None', label: 'Nothing in particular' },
]
const PREGNANCY = [
  { value: 'no', label: 'No' },
  { value: 'pregnant', label: "I'm pregnant" },
  { value: 'breastfeeding', label: "I'm breastfeeding" },
  { value: 'unsaid', label: "I'd rather not say" },
]

const MAX_GOALS = 3

// Bump when the terms or privacy policy change, so users are asked again.
export const CONSENT_VERSION = 'v1-2026-10'
const TERMS_URL = 'https://skynkod.com/terms'
const PRIVACY_URL = 'https://skynkod.com/privacy'
// Questions about health-related skin data, only asked with explicit consent.
const SENSITIVE_STEPS = ['acneType', 'conditions', 'avoid', 'pregnancy']

const ALL_STEPS = ['welcome', 'features', 'name', 'consent', 'skinType', 'concerns', 'acneType', 'conditions', 'avoid', 'pregnancy', 'goal', 'summary']

// Glossier-inspired: lots of air, big plain headlines, pill buttons and soft
// transitions. The first page picks up the splash screen's mauve.
export default function OnboardingScreen({ userId, onComplete }) {
  const colors = useColors()
  const t = useT()
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [terms, setTerms] = useState(false)
  const [health, setHealth] = useState(false)
  const [research, setResearch] = useState(false)
  const [offers, setOffers] = useState(false)
  const [skinType, setSkinType] = useState(undefined)
  const [concerns, setConcerns] = useState([])
  const [goals, setGoals] = useState([]) // up to MAX_GOALS
  const [acneTypes, setAcneTypes] = useState([])
  const [conditions, setConditions] = useState([])
  const [avoid, setAvoid] = useState([])
  const [pregnancy, setPregnancy] = useState(null)
  const [saving, setSaving] = useState(false)

  // The acne question only shows when acne was picked as a concern.
  const STEPS = ALL_STEPS
    .filter(s => s !== 'acneType' || concerns.includes('Acne'))
    .filter(s => health || !SENSITIVE_STEPS.includes(s))
  const QUESTION_STEPS = STEPS.slice(STEPS.indexOf('name'))
  const name = STEPS[step]
  const enter = useRef(new Animated.Value(0)).current
  const progress = useRef(new Animated.Value(0)).current
  const direction = useRef(1)

  useEffect(() => {
    enter.setValue(0)
    Animated.timing(enter, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
    const q = QUESTION_STEPS.indexOf(name)
    Animated.timing(progress, {
      toValue: q < 0 ? 0 : (q + 1) / QUESTION_STEPS.length,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [step])

  const goTo = (i) => {
    direction.current = i > step ? 1 : -1
    setStep(i)
  }
  const next = () => goTo(step + 1)
  const back = () => goTo(step - 1)

  // Single-choice questions move on by themselves after a short beat.
  const pickAndContinue = (setter, value) => {
    setter(value)
    setTimeout(next, 260)
  }

  // Multi-select where "None" clears the rest (and the rest clear "None").
  const toggleIn = (setter, value) =>
    setter(prev => {
      if (value === 'None') return prev.includes('None') ? [] : ['None']
      const without = prev.filter(v => v !== 'None')
      return without.includes(value) ? without.filter(v => v !== value) : [...without, value]
    })

  const tagsQuestion = (title, subtitle, options, selected, setter) => (
    <>
      <Text style={[styles.headline, { color: colors.text }]}>{t(title)}</Text>
      <Text style={[TYPE.body, { color: colors.muted, marginTop: SPACING.sm }]}>{t(subtitle)}</Text>
      <View style={styles.tags}>
        {options.map(o => {
          const on = selected.includes(o.value)
          return (
            <Pressable
              key={o.value}
              onPress={() => toggleIn(setter, o.value)}
              style={[styles.tag, { backgroundColor: on ? colors.primarySoft : colors.card, borderColor: on ? colors.primary : colors.border }]}
            >
              <Text style={[styles.tagText, { color: on ? colors.primary : colors.text }]}>{t(o.label)}</Text>
            </Pressable>
          )
        })}
      </View>
    </>
  )

  const toggleConcern = (c) =>
    setConcerns(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]))

  const now = () => new Date().toISOString()
  const consentFields = () => ({
    consent_version: CONSENT_VERSION,
    consent_terms_at: terms ? now() : null,
    consent_health_at: health ? now() : null,
    consent_research: research,
    consent_offers: offers,
  })

  // "Skip" can't jump past the consent page; after it, it saves the consents
  // and the answers given so far.
  const skip = () => {
    const consentIdx = STEPS.indexOf('consent')
    if (step < consentIdx) return goTo(consentIdx)
    finish(true)
  }

  // Answers are saved to the profile so routines and Koda can use them; a
  // failed save never blocks the user from getting into the app.
  const finish = async (save) => {
    setSaving(true)
    try {
      if (save) {
        const clean = list => list.filter(v => v !== 'None')
        const answers = {
          firstName: firstName.trim() || null,
          skinType: skinType ?? null,
          concerns,
          goals,
          acneTypes: health && concerns.includes('Acne') ? acneTypes : [],
          conditions: health ? clean(conditions) : [],
          avoid: health ? clean(avoid) : [],
          pregnancy: health ? pregnancy : null,
        }
        await AsyncStorage.setItem('skynkod_skin_profile', JSON.stringify(answers))
        if (userId && answers.firstName) await AsyncStorage.setItem(`skynkod_first_name_${userId}`, answers.firstName)
        if (userId) {
          const saved = await updateUserProfile(userId, {
            first_name: answers.firstName,
            skin_type: answers.skinType,
            skin_concerns: answers.concerns,
            skin_goal: answers.goals[0] || null,
            skin_goals: answers.goals,
            acne_types: answers.acneTypes,
            skin_conditions: answers.conditions,
            avoid_ingredients: answers.avoid,
            pregnancy: answers.pregnancy,
            onboarding_complete: true,
            ...consentFields(),
          })
          if (!saved) await logError('OnboardingScreen_saveProfile', new Error('Profile not saved'), { userId }, 'warn')
        }
      }
      await onComplete()
    } catch (error) {
      await logError('OnboardingScreen_finish', error, { step }, 'warn')
      await onComplete().catch(() => {})
    }
  }

  const animatedStyle = {
    opacity: enter,
    transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [28 * direction.current, 0] }) }],
  }

  const Pill = ({ title, onPress, variant = 'dark', disabled, loading, style }) => {
    const v = {
      dark: { bg: colors.primary, fg: colors.onPrimary },
      light: { bg: '#FFFFFF', fg: colors.text },
      ghost: { bg: 'transparent', fg: colors.textSecondary },
    }[variant]
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.pill,
          { backgroundColor: v.bg, opacity: disabled ? 0.35 : pressed ? 0.85 : 1 },
          style,
        ]}
      >
        {loading ? <ActivityIndicator color={v.fg} /> : <Text style={[styles.pillText, { color: v.fg }]}>{title}</Text>}
      </Pressable>
    )
  }

  const Choice = ({ label, hint, selected, onPress }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: selected ? colors.primarySoft : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={[styles.choiceLabel, { color: selected ? colors.primary : colors.text }]}>{label}</Text>
      {hint ? <Text style={[TYPE.caption, { color: colors.muted }]}>{hint}</Text> : null}
    </Pressable>
  )

  // ---------- Page 1: the mockup's intro: logo, tagline, promise ----------
  if (name === 'welcome') {
    return (
      <View style={[styles.flex, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
        <View style={styles.topBar}>
          <View />
          <Pressable onPress={skip} hitSlop={12}>
            <Text style={[TYPE.bodyStrong, { color: colors.muted }]}>{t('Skip')}</Text>
          </Pressable>
        </View>
        <Animated.View style={[styles.welcomeBody, { opacity: enter }]}>
          <Image source={LOGO} resizeMode="contain" style={{ width: 230, height: 230 / LOGO_RATIO }} />
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>{t('Your skin. Your code.\nDecoded daily.')}</Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
            {t('The app that helps you understand your skin, your products, and your lifestyle.')}
          </Text>
        </Animated.View>
        <View style={styles.footer}>
          <Pill title={t("Let's start")} onPress={next} />
        </View>
      </View>
    )
  }

  const isQuestion = QUESTION_STEPS.includes(name)
  const typeLabel = t(SKIN_TYPES.find(type => type.value === skinType)?.label)
  const goalLabel = goals.map(v => t(GOALS.find(g => g.value === v)?.label)).join(' · ')

  let content
  let footer = null
  if (name === 'features') {
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>{t('Everything your skin needs, in one place.')}</Text>
        <View style={{ marginTop: SPACING.xxl, gap: SPACING.xl }}>
          {FEATURES.map(f => (
            <View key={f.title} style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primarySoft }]}>
                {f.icon === 'koda'
                  ? <Image source={KODA} style={{ width: 24, height: 24 }} />
                  : <Ionicons name={f.icon} size={22} color={BRAND_MAUVE} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{t(f.title).toUpperCase()}</Text>
                <Text style={[TYPE.caption, { color: colors.muted, marginTop: 3, lineHeight: 18 }]}>{t(f.text)}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={[styles.poweredCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Image source={KODA} style={{ width: 30, height: 30 }} />
          <View>
            <Text style={[TYPE.caption, { color: colors.muted }]}>{t('Powered by')}</Text>
            <Text style={[styles.poweredKoda, { color: BRAND_MAUVE }]}>KODA</Text>
          </View>
        </View>
      </>
    )
    footer = <Pill title={t('Continue')} onPress={next} />
  } else if (name === 'name') {
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>{t('What should we call you?')}</Text>
        <Text style={[TYPE.body, { color: colors.muted, marginTop: SPACING.sm }]}>{t("We'll use it to say hello.")}</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('Your first name')}
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="next"
          maxLength={40}
          onSubmitEditing={() => firstName.trim() && next()}
          style={[styles.nameInput, { color: colors.text, backgroundColor: colors.card, borderColor: firstName.trim() ? colors.primary : colors.border }]}
        />
      </>
    )
    footer = <Pill title={t('Continue')} onPress={next} disabled={!firstName.trim()} />
  } else if (name === 'consent') {
    const Check = ({ value, onChange, children, required }) => (
      <Pressable onPress={() => onChange(!value)} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: value }}>
        <View style={[styles.checkBox, { borderColor: value ? colors.primary : colors.border, backgroundColor: value ? colors.primary : colors.card }]}>
          {value ? <Ionicons name="checkmark" size={16} color={colors.onPrimary} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          {children}
          {required ? <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]}>{t('Required')}</Text> : null}
        </View>
      </Pressable>
    )
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>{t('Your data, your choice')}</Text>
        <Text style={[TYPE.body, { color: colors.muted, marginTop: SPACING.sm }]}>
          {t('We never sell your personal data. You can change these choices anytime in Settings.')}
        </Text>
        <View style={{ marginTop: SPACING.xl, gap: SPACING.lg }}>
          <Check value={terms} onChange={setTerms} required>
            <Text style={[TYPE.body, { color: colors.text }]}>
              {t('I accept the ')}
              <Text style={{ color: colors.primary, fontWeight: '700' }} onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>{t('Terms of use')}</Text>
              {t(' and the ')}
              <Text style={{ color: colors.primary, fontWeight: '700' }} onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>{t('Privacy policy')}</Text>
            </Text>
          </Check>
          <Check value={health} onChange={setHealth}>
            <Text style={[TYPE.body, { color: colors.text }]}>
              {t('Use my sensitive skin information (skin conditions, acne type, allergies, pregnancy) to personalise my advice')}
            </Text>
            <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]}>{t('Optional. Without it, we skip those questions.')}</Text>
          </Check>
          <Check value={research} onChange={setResearch}>
            <Text style={[TYPE.body, { color: colors.text }]}>{t('Help improve Skynkod with anonymous statistics')}</Text>
            <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]}>{t('Optional. Never linked to your name or email.')}</Text>
          </Check>
          <Check value={offers} onChange={setOffers}>
            <Text style={[TYPE.body, { color: colors.text }]}>{t('Get offers and product tests from brands')}</Text>
            <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]}>{t('Optional. Brands never see who you are.')}</Text>
          </Check>
        </View>
      </>
    )
    footer = <Pill title={t('Continue')} onPress={next} disabled={!terms} />
  } else if (name === 'skinType') {
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>{t('How would you describe your skin?')}</Text>
        <View style={styles.choices}>
          {SKIN_TYPES.map(type => (
            <Choice key={type.label} label={t(type.label)} hint={t(type.hint)} selected={skinType === type.value} onPress={() => pickAndContinue(setSkinType, type.value)} />
          ))}
        </View>
      </>
    )
  } else if (name === 'concerns') {
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>{t('What would you like to work on?')}</Text>
        <Text style={[TYPE.body, { color: colors.muted, marginTop: SPACING.sm }]}>{t('Pick as many as you like.')}</Text>
        <View style={styles.tags}>
          {CONCERNS.map(c => {
            const selected = concerns.includes(c)
            return (
              <Pressable
                key={c}
                onPress={() => toggleConcern(c)}
                style={[styles.tag, { backgroundColor: selected ? colors.primarySoft : colors.card, borderColor: selected ? colors.primary : colors.border }]}
              >
                <Text style={[styles.tagText, { color: selected ? colors.primary : colors.text }]}>{t(c)}</Text>
              </Pressable>
            )
          })}
        </View>
      </>
    )
    footer = <Pill title={t('Continue')} onPress={next} disabled={concerns.length === 0} />
  } else if (name === 'acneType') {
    content = tagsQuestion('What kind of breakouts do you get?', 'Optional. It changes which ingredients help.', ACNE_TYPES, acneTypes, setAcneTypes)
    footer = <Pill title={acneTypes.length ? t('Continue') : t('Skip')} onPress={next} />
  } else if (name === 'conditions') {
    content = tagsQuestion('Any skin conditions?', 'Optional. We use it to flag ingredients that can trigger flare-ups.', CONDITIONS, conditions, setConditions)
    footer = <Pill title={conditions.length ? t('Continue') : t('Skip')} onPress={next} />
  } else if (name === 'avoid') {
    content = tagsQuestion('Anything you need to avoid?', 'Optional. Products with these will be flagged.', AVOID, avoid, setAvoid)
    footer = <Pill title={avoid.length ? t('Continue') : t('Skip')} onPress={next} />
  } else if (name === 'pregnancy') {
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>{t('Are you pregnant or breastfeeding?')}</Text>
        <Text style={[TYPE.body, { color: colors.muted, marginTop: SPACING.sm }]}>{t('Optional. Some ingredients, like retinol, are best avoided during this time.')}</Text>
        <View style={styles.choices}>
          {PREGNANCY.map(o => (
            <Choice key={o.value} label={t(o.label)} selected={pregnancy === o.value} onPress={() => pickAndContinue(setPregnancy, o.value)} />
          ))}
        </View>
      </>
    )
    footer = <Pill title={t('Skip')} variant="ghost" onPress={next} />
  } else if (name === 'goal') {
    const toggleGoal = value =>
      setGoals(prev => (prev.includes(value) ? prev.filter(v => v !== value) : prev.length < MAX_GOALS ? [...prev, value] : prev))
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>{t('And your goals?')}</Text>
        <Text style={[TYPE.body, { color: colors.muted, marginTop: SPACING.sm }]}>
          {t('Pick up to 3.')}{goals.length ? ` ${goals.length}/3` : ''}
        </Text>
        <View style={styles.choices}>
          {GOALS.map(g => {
            const selected = goals.includes(g.value)
            const full = !selected && goals.length >= MAX_GOALS
            return (
              <View key={g.value} style={{ opacity: full ? 0.45 : 1 }}>
                <Choice label={t(g.label)} selected={selected} onPress={() => toggleGoal(g.value)} />
              </View>
            )
          })}
        </View>
      </>
    )
    footer = <Pill title={t('Continue')} onPress={next} disabled={!goals.length} />
  } else {
    content = (
      <>
        <Text style={[TYPE.overline, { color: colors.muted }]}>{t('Your skin profile')}</Text>
        <Text style={[styles.headline, { color: colors.text, marginTop: SPACING.sm }]}>
          {firstName.trim() ? t('Nice to meet you, {name}.', { name: firstName.trim() }) : t('Nice to meet your skin.')}
        </Text>
        <View style={[styles.summary, { backgroundColor: BRAND_MAUVE }]}>
          <Text style={styles.summaryLabel}>{t('Skin type')}</Text>
          <Text style={styles.summaryValue}>{typeLabel && skinType ? typeLabel : t('To discover')}</Text>
          <Text style={styles.summaryLabel}>{t('Working on')}</Text>
          <Text style={styles.summaryValue}>{concerns.map(c => t(c)).join(' · ')}</Text>
          <Text style={styles.summaryLabel}>{goals.length > 1 ? t('Goals') : t('Goal')}</Text>
          <Text style={[styles.summaryValue, { marginBottom: 0 }]}>{goalLabel}</Text>
        </View>
        <Text style={[TYPE.body, { color: colors.muted, marginTop: SPACING.xl }]}>
          {t('Your routines are ready, and Koda knows where to start.')}
        </Text>
      </>
    )
    footer = <Pill title={t('Get started')} onPress={() => finish(true)} loading={saving} />
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.flex, { backgroundColor: colors.bg }]}>
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
      <View style={styles.topBar}>
        <Pressable onPress={back} hitSlop={12} accessibilityLabel={t('Back')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        {name !== 'summary' && name !== 'consent' ? (
          <Pressable onPress={skip} hitSlop={12}>
            <Text style={[TYPE.bodyStrong, { color: colors.muted }]}>{t('Skip')}</Text>
          </Pressable>
        ) : <View />}
      </View>

      {isQuestion ? (
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: BRAND_MAUVE, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={animatedStyle}>{content}</Animated.View>
      </ScrollView>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, height: 52 },
  progressTrack: { height: 3, marginHorizontal: SPACING.xl, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  scroll: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.xxl, paddingBottom: SPACING.xxl },
  footer: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md },

  welcomeBody: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  welcomeTitle: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, lineHeight: 37, marginTop: SPACING.xxxl },
  welcomeText: { fontSize: 16, lineHeight: 23, marginTop: SPACING.lg },

  headline: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, lineHeight: 38 },

  pill: { height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  pillText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },

  nameInput: { marginTop: SPACING.xxl, height: 58, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: SPACING.xl, fontSize: 18, fontWeight: '600' },
  checkRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  checkBox: { width: 26, height: 26, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  choices: { marginTop: SPACING.xxl, gap: SPACING.sm },
  choice: { borderRadius: 999, borderWidth: 1, paddingVertical: 16, paddingHorizontal: SPACING.xl, gap: 2 },
  choiceLabel: { fontSize: 16, fontWeight: '600' },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xxl },
  tag: { borderRadius: 999, borderWidth: 1, paddingVertical: 12, paddingHorizontal: SPACING.lg },
  tagText: { fontSize: 15, fontWeight: '600' },

  feature: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  featureIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6 },
  poweredCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, alignSelf: 'flex-start', marginTop: SPACING.xxl, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg, borderRadius: 18, borderWidth: 1 },
  poweredKoda: { fontSize: 18, fontWeight: '700', letterSpacing: 1.2 },

  summary: { borderRadius: 28, padding: SPACING.xxl, marginTop: SPACING.xxl },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  summaryValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginTop: 4, marginBottom: SPACING.lg },
})
