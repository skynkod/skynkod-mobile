import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Animated, Easing, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { updateUserProfile } from '../utils/supabase'
import { logError } from '../utils/errorLogger'
import { useColors } from '../components/ui'
import { SPACING, TYPE } from '../utils/theme'

const LOGO_WHITE = require('../assets/images/skynkod-logo-white.png')
const LOGO_RATIO = 1306 / 333
const BRAND_MAUVE = '#C5A8BB'

const FEATURES = [
  { title: 'Your skin journal', text: 'Log how your skin feels and see it change, day after day.' },
  { title: 'Routines that fit', text: 'Morning and evening steps made for your skin.' },
  { title: 'Meet Koda', text: 'Your AI skin coach, here for every question.' },
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

const STEPS = ['welcome', 'features', 'skinType', 'concerns', 'goal', 'summary']
const QUESTION_STEPS = ['skinType', 'concerns', 'goal', 'summary']

// Glossier-inspired: lots of air, big plain headlines, pill buttons and soft
// transitions. The first page picks up the splash screen's mauve.
export default function OnboardingScreen({ userId, onComplete }) {
  const colors = useColors()
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState(0)
  const [skinType, setSkinType] = useState(undefined)
  const [concerns, setConcerns] = useState([])
  const [goal, setGoal] = useState(null)
  const [saving, setSaving] = useState(false)

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

  const toggleConcern = (c) =>
    setConcerns(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]))

  // Answers are saved to the profile so routines and Koda can use them; a
  // failed save never blocks the user from getting into the app.
  const finish = async (save) => {
    setSaving(true)
    try {
      if (save) {
        const answers = { skinType: skinType ?? null, concerns, goal }
        await AsyncStorage.setItem('skynkod_skin_profile', JSON.stringify(answers))
        if (userId) {
          const saved = await updateUserProfile(userId, {
            skin_type: answers.skinType,
            skin_concerns: answers.concerns,
            skin_goal: answers.goal,
            onboarding_complete: true,
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
      dark: { bg: colors.text, fg: colors.bg },
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
          backgroundColor: selected ? colors.text : colors.card,
          borderColor: selected ? colors.text : colors.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={[styles.choiceLabel, { color: selected ? colors.bg : colors.text }]}>{label}</Text>
      {hint ? <Text style={[TYPE.caption, { color: selected ? colors.border : colors.muted }]}>{hint}</Text> : null}
    </Pressable>
  )

  // ---------- Page 1: mauve welcome, same look as the splash ----------
  if (name === 'welcome') {
    return (
      <View style={[styles.flex, { backgroundColor: BRAND_MAUVE, paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
        <StatusBar style="light" />
        <View style={styles.topBar}>
          <View />
          <Pressable onPress={() => finish(false)} hitSlop={12}>
            <Text style={[TYPE.bodyStrong, { color: '#FFFFFF' }]}>Skip</Text>
          </Pressable>
        </View>
        <Animated.View style={[styles.welcomeBody, { opacity: enter }]}>
          <Image source={LOGO_WHITE} resizeMode="contain" style={{ width: 220, height: 220 / LOGO_RATIO }} />
          <Text style={styles.welcomeTitle}>Good skin starts{'\n'}with knowing yours.</Text>
          <Text style={styles.welcomeText}>A few quick questions, then we set everything up for you.</Text>
        </Animated.View>
        <View style={styles.footer}>
          <Pill title="Let's start" variant="light" onPress={next} />
        </View>
      </View>
    )
  }

  const isQuestion = QUESTION_STEPS.includes(name)
  const typeLabel = SKIN_TYPES.find(t => t.value === skinType)?.label
  const goalLabel = GOALS.find(g => g.value === goal)?.label

  let content
  let footer = null
  if (name === 'features') {
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>Everything your skin needs, in one place.</Text>
        <View style={{ marginTop: SPACING.xxxl, gap: SPACING.xxl }}>
          {FEATURES.map((f, i) => (
            <View key={f.title} style={styles.feature}>
              <Text style={[styles.featureNumber, { color: BRAND_MAUVE }]}>{String(i + 1).padStart(2, '0')}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                <Text style={[TYPE.body, { color: colors.muted, marginTop: 4 }]}>{f.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </>
    )
    footer = <Pill title="Continue" onPress={next} />
  } else if (name === 'skinType') {
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>How would you describe your skin?</Text>
        <View style={styles.choices}>
          {SKIN_TYPES.map(t => (
            <Choice key={t.label} label={t.label} hint={t.hint} selected={skinType === t.value} onPress={() => pickAndContinue(setSkinType, t.value)} />
          ))}
        </View>
      </>
    )
  } else if (name === 'concerns') {
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>What would you like to work on?</Text>
        <Text style={[TYPE.body, { color: colors.muted, marginTop: SPACING.sm }]}>Pick as many as you like.</Text>
        <View style={styles.tags}>
          {CONCERNS.map(c => {
            const selected = concerns.includes(c)
            return (
              <Pressable
                key={c}
                onPress={() => toggleConcern(c)}
                style={[styles.tag, { backgroundColor: selected ? colors.text : colors.card, borderColor: selected ? colors.text : colors.border }]}
              >
                <Text style={[styles.tagText, { color: selected ? colors.bg : colors.text }]}>{c}</Text>
              </Pressable>
            )
          })}
        </View>
      </>
    )
    footer = <Pill title="Continue" onPress={next} disabled={concerns.length === 0} />
  } else if (name === 'goal') {
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>And your main goal?</Text>
        <View style={styles.choices}>
          {GOALS.map(g => (
            <Choice key={g.value} label={g.label} selected={goal === g.value} onPress={() => pickAndContinue(setGoal, g.value)} />
          ))}
        </View>
      </>
    )
  } else {
    content = (
      <>
        <Text style={[TYPE.overline, { color: colors.muted }]}>Your skin profile</Text>
        <Text style={[styles.headline, { color: colors.text, marginTop: SPACING.sm }]}>Nice to meet your skin.</Text>
        <View style={[styles.summary, { backgroundColor: BRAND_MAUVE }]}>
          <Text style={styles.summaryLabel}>Skin type</Text>
          <Text style={styles.summaryValue}>{typeLabel && skinType ? typeLabel : 'To discover'}</Text>
          <Text style={styles.summaryLabel}>Working on</Text>
          <Text style={styles.summaryValue}>{concerns.join(' · ')}</Text>
          <Text style={styles.summaryLabel}>Goal</Text>
          <Text style={[styles.summaryValue, { marginBottom: 0 }]}>{goalLabel}</Text>
        </View>
        <Text style={[TYPE.body, { color: colors.muted, marginTop: SPACING.xl }]}>
          Your routines are ready, and Koda knows where to start.
        </Text>
      </>
    )
    footer = <Pill title="Get started" onPress={() => finish(true)} loading={saving} />
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
      <View style={styles.topBar}>
        <Pressable onPress={back} hitSlop={12} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        {name !== 'summary' ? (
          <Pressable onPress={() => finish(false)} hitSlop={12}>
            <Text style={[TYPE.bodyStrong, { color: colors.muted }]}>Skip</Text>
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={animatedStyle}>{content}</Animated.View>
      </ScrollView>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
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
  welcomeTitle: { color: '#FFFFFF', fontSize: 34, fontWeight: '700', letterSpacing: -0.8, lineHeight: 40, marginTop: SPACING.xxxl },
  welcomeText: { color: 'rgba(255,255,255,0.85)', fontSize: 17, lineHeight: 24, marginTop: SPACING.lg },

  headline: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, lineHeight: 38 },

  pill: { height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  pillText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },

  choices: { marginTop: SPACING.xxl, gap: SPACING.sm },
  choice: { borderRadius: 999, borderWidth: 1, paddingVertical: 16, paddingHorizontal: SPACING.xl, gap: 2 },
  choiceLabel: { fontSize: 16, fontWeight: '600' },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xxl },
  tag: { borderRadius: 999, borderWidth: 1, paddingVertical: 12, paddingHorizontal: SPACING.lg },
  tagText: { fontSize: 15, fontWeight: '600' },

  feature: { flexDirection: 'row', gap: SPACING.lg },
  featureNumber: { fontSize: 15, fontWeight: '700', width: 28, marginTop: 2 },
  featureTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },

  summary: { borderRadius: 28, padding: SPACING.xxl, marginTop: SPACING.xxl },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  summaryValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginTop: 4, marginBottom: SPACING.lg },
})
