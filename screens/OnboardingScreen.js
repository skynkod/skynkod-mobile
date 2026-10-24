import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Animated, Easing, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as WebBrowser from 'expo-web-browser'
import * as Haptics from 'expo-haptics'
import { supabase } from '../utils/supabase'
import { requestNotificationPermissions } from '../utils/notifications'
import { WHY_AFTER, whyAfter } from '../utils/onboarding-why'
import { updateUserProfile } from '../utils/supabase'
import { deleteAccount } from '../utils/account'
import { articlesIn } from '../utils/encyclopedia'
import ArticleBody from '../components/ArticleBody'
import { logError } from '../utils/errorLogger'
import { track } from '../utils/analytics'
import { useColors } from '../components/ui'
import QuizQuestion from '../components/QuizQuestion'
import FeatureIcon from '../components/FeatureIcon'
import { CHAPTERS, questionsFor, toColumns, computeSkinType, suspicionsFrom, SUSPICIONS, DOCTOR_NOTE, PHOTOTYPE } from '../utils/skin-quiz'
import { useT } from '../utils/LanguageContext'

const OFFERS_ENABLED = false
import { SPACING, TYPE } from '../utils/theme'

const LOGO = require('../assets/images/skynkod-logo.png')
const KODA = require('../assets/images/koda-logo.png')
const LOGO_RATIO = 1306 / 333
const BRAND_MAUVE = '#C5A8BB'

// Every feature, each with its official icon (Lita, 2026-10-23: "if we say it,
// say it all"), grouped after the audit (2026-10-24) so it stays short.
const FEATURES = [
  { icon: 'rekod', title: 'Rekod, your skin programme', text: 'A routine of proven actives, built for your skin and introduced week by week.' },
  { icon: 'dekod', title: 'Dekod, your skin scan', text: 'One selfie reads redness, shine, blemishes, dryness and tone, and follows how they change.' },
  { icon: 'koda', title: 'Koda, your AI skin coach', text: 'Knows your skin, your routine and your history, and answers about your situation.' },
  { icon: 'scan', title: 'Check any product', text: 'Scan it or search it: every ingredient is checked against your skin.' },
  { icon: 'bag-check-outline', title: 'Should I buy this?', text: 'Before you buy: does it suit your skin, and do you already own something that does the same job?' },
  { icon: 'remove-circle-outline', title: 'Fewer products, better skin', text: 'What to stop, what your shelf really needs, and your next best buy. Skynkod never pushes you to buy.' },
  { icon: 'progress', title: 'See what really works', text: 'A skin review every 2 weeks, your progress in numbers, when it’s too early to judge, and your skin timeline.' },
  { icon: 'forecast', title: 'Your skin forecast', text: 'The next 3 days: weather, your habits, your cycle and your travels, and what your skin will need.' },
  { icon: 'journal', title: 'What your skin tells you', text: 'A 10-second check-in and your glasses of water: it learns what makes your skin react.' },
  { icon: 'routines', title: 'Your routines, in the right order', text: 'Morning and evening, with your own products, how much, and which evening for each active.' },
  { icon: 'emergency', title: 'When your skin reacts', text: 'Space your actives or follow a gentle 7-day plan. Pregnancy and seasons adapt the whole app too.' },
  { icon: 'skyncyclopedia', title: 'Skyncyclopedia', text: '38 skin issues and every ingredient explained simply, with their sources.' },
  { icon: 'report', title: 'My skin report', text: 'One page to show your dermatologist.' },
  { icon: 'journey', title: 'Your skin journey', text: 'Badges and levels for good habits, never for buying more.' },
]


// Bump when the terms or privacy policy change, so users are asked again.
export const CONSENT_VERSION = 'v1-2026-10'
const TERMS_URL = 'https://skynkod.com/terms'
const PRIVACY_URL = 'https://skynkod.com/privacy'
// Questions about health-related skin data, only asked with explicit consent.
const INTRO_STEPS = ['welcome', 'features', 'name', 'birthday', 'consent']

// Glossier-inspired: lots of air, big plain headlines, pill buttons and soft
// transitions. The first page picks up the splash screen's mauve.
// Skynkod is for 18 and over (age from the date of birth, on today's date).
const MIN_AGE = 18
const ageOn = (birth, today = new Date()) => {
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
  return age
}
// Day / month / year typed by the user → a real date, or null.
const parseBirth = (d, m, y) => {
  const day = Number(d), month = Number(m), year = Number(y)
  if (!day || !month || String(y).length !== 4 || year < 1900 || year > new Date().getFullYear()) return null
  const date = new Date(year, month - 1, day)
  return date.getDate() === day && date.getMonth() === month - 1 && date <= new Date() ? date : null
}
const isoDay = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export default function OnboardingScreen({ userId, onComplete, onLeave }) {
  const colors = useColors()
  const t = useT()
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [minor, setMinor] = useState(false)
  const [minorArticle, setMinorArticle] = useState(null)
  const birthDate = parseBirth(birthDay, birthMonth, birthYear)
  const [terms, setTerms] = useState(false)
  const [health, setHealth] = useState(false)
  const [offers, setOffers] = useState(false)
  const [answers, setAnswers] = useState({}) // the skin quiz (utils/skin-quiz.js)
  const setAnswer = (id, value) => setAnswers(prev => ({ ...prev, [id]: value }))
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(0) // "Building your plan", 0 to 100
  const [productCount, setProductCount] = useState(null)
  const [committed, setCommitted] = useState(false)
  const hold = useRef(new Animated.Value(0)).current
  useEffect(() => {
    supabase.from('products').select('id', { count: 'exact', head: true }).then(({ count }) => setProductCount(count || null)).catch(() => {})
  }, [])

  // Quiz questions follow the answers (acne details only with acne, health
  // questions only with the health consent, pregnancy not for men…).
  const quiz = questionsFor(answers, health)
  // Inspired by Flo (Lita, 2026-10-23): the goal first, a screen after some
  // chapters saying what the answers change, a trust page, "building your
  // plan", then her profile, a small promise, reminders and the Premium offer.
  const quizSteps = []
  for (const c of CHAPTERS) {
    const qs = quiz.filter(q => q.chapter === c.id)
    if (!qs.length) continue
    qs.forEach(q => quizSteps.push(`q:${q.id}`))
    if (WHY_AFTER.includes(c.id)) quizSteps.push(`why:${c.id}`)
    if (c.id === 'bothers') quizSteps.push('trust')
  }
  const STEPS = [...INTRO_STEPS, ...quizSteps, 'loader', 'summary', 'commit', 'notify']
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

  // "Building your plan": the bar fills, then her profile appears by itself.
  useEffect(() => {
    if (STEPS[step] !== 'loader') return
    setLoaded(0)
    const bar = new Animated.Value(0)
    const id = bar.addListener(({ value }) => setLoaded(Math.round(value * 100)))
    Animated.timing(bar, { toValue: 1, duration: 5200, easing: Easing.inOut(Easing.quad), useNativeDriver: false }).start(({ finished }) => {
      if (finished) setTimeout(() => goTo(STEPS.indexOf('summary')), 450)
    })
    return () => { bar.stopAnimation(); bar.removeListener(id) }
  }, [step])

  const goTo = (i) => {
    direction.current = i > step ? 1 : -1
    setStep(i)
    track('onboarding_step', { step: STEPS[i] })
  }
  const next = () => goTo(step + 1)
  // Going back never replays the "Building your plan" bar.
  const back = () => goTo(STEPS[step - 1] === 'loader' ? step - 2 : step - 1)

  const now = () => new Date().toISOString()
  const consentFields = () => ({
    consent_version: CONSENT_VERSION,
    consent_terms_at: terms ? now() : null,
    consent_health_at: health ? now() : null,
    consent_offers: offers,
  })

  // "Skip" can't jump past the consent page; after it, it saves the consents
  // and the answers given so far.
  const skip = () => {
    const birthdayIdx = STEPS.indexOf('birthday')
    if (!birthDate && step < birthdayIdx) return goTo(birthdayIdx)
    const consentIdx = STEPS.indexOf('consent')
    if (step < consentIdx) return goTo(consentIdx)
    finish(true)
  }

  // Answers are saved to the profile so routines and Koda can use them; a
  // failed save never blocks the user from getting into the app.
  const finish = async (save, options) => {
    setSaving(true)
    try {
      if (save) {
        const columns = toColumns(answers, health)
        await AsyncStorage.setItem('skynkod_skin_profile', JSON.stringify(answers))
        const first = firstName.trim() || null
        if (userId && first) await AsyncStorage.setItem(`skynkod_first_name_${userId}`, first)
        if (userId) {
          const saved = await updateUserProfile(userId, {
            first_name: first,
            birth_date: birthDate ? isoDay(birthDate) : null,
            ...columns,
            onboarding_complete: true,
            ...consentFields(),
          })
          if (!saved) await logError('OnboardingScreen_saveProfile', new Error('Profile not saved'), { userId }, 'warn')
        }
      }
      if (userId && committed) await AsyncStorage.setItem(`skynkod_commitment_${userId}`, new Date().toISOString()).catch(() => {})
      await onComplete(options)
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

  // ---------- Under 18: a kind page with a few articles to read ----------
  if (minor) {
    const reads = [...articlesIn('basics'), ...articlesIn('myths')]
    const open = reads.find(a => a.id === minorArticle)
    return (
      <View style={[styles.flex, { backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
        <View style={styles.topBar}>
          {open ? (
            <Pressable onPress={() => setMinorArticle(null)} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          ) : <View />}
          <Pressable onPress={() => onLeave?.()} hitSlop={12}>
            <Text style={[TYPE.bodyStrong, { color: colors.muted }]}>{t('Close')}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {open ? (
            <>
              <Text style={[styles.headline, { color: colors.text }]}>{t(open.title)}</Text>
              <ArticleBody article={open} />
            </>
          ) : (
            <>
              <Text style={[styles.headline, { color: colors.text }]}>{t('See you soon!')}</Text>
              <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.md }]}>
                {t("Skynkod is for 18 and over for now. We can't wait to see you back! In the meantime, here are a few tips to care for your skin.")}
              </Text>
              <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
                {reads.map(a => (
                  <Pressable key={a.id} onPress={() => setMinorArticle(a.id)} style={[styles.minorRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name={a.icon} size={18} color={colors.primary} />
                    <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]} numberOfLines={2}>{t(a.title)}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    )
  }

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

  let content
  let footer = null
  if (name === 'features') {
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>{t('Everything your skin needs, in one place.')}</Text>
        <View style={{ marginTop: SPACING.xxl, gap: SPACING.lg }}>
          {FEATURES.map(f => (
            <View key={f.title} style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primarySoft }]}>
                <FeatureIcon name={f.icon} size={22} color={BRAND_MAUVE} focused={f.icon === 'rekod'} />
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
  } else if (name === 'birthday') {
    const field = (value, setter, placeholder, width, max) => (
      <TextInput
        value={value}
        onChangeText={v => setter(v.replace(/\D/g, '').slice(0, max))}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        maxLength={max}
        style={[styles.nameInput, styles.birthField, { width, color: colors.text, backgroundColor: colors.card, borderColor: value ? colors.primary : colors.border }]}
      />
    )
    content = (
      <>
        <Text style={[styles.headline, { color: colors.text }]}>{t("When's your birthday?")}</Text>
        <Text style={[TYPE.body, { color: colors.muted, marginTop: SPACING.sm }]}>{t('Skynkod is for people aged 18 and over.')}</Text>
        <View style={styles.birthRow}>
          {field(birthDay, setBirthDay, t('DD'), 72, 2)}
          {field(birthMonth, setBirthMonth, t('MM'), 72, 2)}
          {field(birthYear, setBirthYear, t('YYYY'), 104, 4)}
        </View>
        {birthDay && birthMonth && birthYear.length === 4 && !birthDate ? (
          <Text style={[TYPE.caption, { color: colors.danger, marginTop: SPACING.md }]}>{t('This date doesn’t look right.')}</Text>
        ) : null}
      </>
    )
    footer = (
      <Pill
        title={t('Continue')}
        disabled={!birthDate}
        onPress={() => {
          if (ageOn(birthDate) >= MIN_AGE) return next()
          // Under 18: no account can be kept. Delete it now, then show a kind page.
          setMinor(true)
          deleteAccount().catch(error => logError('Onboarding_minorDelete', error, {}, 'warn'))
        }}
      />
    )
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
          {/* Brand offers come back once real offers exist (no empty options in the stores). */}
          {OFFERS_ENABLED ? <Check value={offers} onChange={setOffers}>
            <Text style={[TYPE.body, { color: colors.text }]}>{t('Get offers and product tests from brands')}</Text>
            <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]}>{t('Optional. Brands never see who you are.')}</Text>
          </Check> : null}
          <Text style={[TYPE.caption, { color: colors.muted, lineHeight: 18 }]}>
            {t('Koda, our AI, runs on Anthropic (USA): your messages and a summary of your week are sent to it to answer you.')}
          </Text>
        </View>
      </>
    )
    footer = <Pill title={t('Continue')} onPress={next} disabled={!terms} />
  } else if (name.startsWith('why:')) {
    const why = whyAfter(name.slice(4), answers)
    content = (
      <>
        <View style={[styles.bigIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name={why.icon} size={30} color={colors.primary} /></View>
        <Text style={[styles.headline, { color: colors.text, marginTop: SPACING.xl }]}>{t(why.title, why.params)}</Text>
        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t(why.text)}</Text>
      </>
    )
    footer = <Pill title={t('Continue')} onPress={next} />
  } else if (name === 'trust') {
    content = (
      <>
        <View style={[styles.bigIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="shield-checkmark-outline" size={30} color={colors.primary} /></View>
        <Text style={[styles.headline, { color: colors.text, marginTop: SPACING.xl }]}>{t('No brand pays us')}</Text>
        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t('No verdict is for sale. Every rule in Skynkod comes from recognised dermatology sources, and each one shows where it comes from.')}</Text>
        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t('Safety alerts stay free for everyone.')}</Text>
        <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.xl }]}>{t('American Academy of Dermatology · Cleveland Clinic · published studies')}</Text>
      </>
    )
    footer = <Pill title={t('Continue')} onPress={next} />
  } else if (name === 'loader') {
    const message = loaded < 25 ? t('Reading your skin test…')
      : loaded < 50 ? t('Matching ingredients to your goals…')
      : loaded < 80 ? (productCount ? t('Checking {n} products for your skin…', { n: productCount.toLocaleString() }) : t('Checking our products for your skin…'))
      : loaded < 100 ? t('Setting up your skin forecast…') : t('Your plan is ready')
    content = (
      <View style={{ alignItems: 'center', paddingTop: SPACING.xxxl }}>
        <Text style={[TYPE.overline, { color: colors.muted }]}>{t('Building your plan')}</Text>
        <Text style={[styles.percent, { color: colors.primary }]}>{loaded} %</Text>
        <View style={[styles.loaderTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.loaderFill, { backgroundColor: colors.primary, width: `${loaded}%` }]} />
        </View>
        <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.lg, textAlign: 'center' }]}>{message}</Text>
      </View>
    )
  } else if (name === 'commit') {
    const press = () => {
      if (committed) return
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      Animated.timing(hold, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }).start(({ finished }) => {
        if (!finished) return
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
        setCommitted(true)
        setTimeout(next, 800)
      })
    }
    const release = () => { if (!committed) Animated.timing(hold, { toValue: 0, duration: 250, useNativeDriver: true }).start() }
    content = (
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.headline, { color: colors.text, textAlign: 'center' }]}>{t('One promise to yourself')}</Text>
        <Text style={[styles.promise, { color: colors.text }]}>{t('“I care for my skin, morning and evening.”')}</Text>
        <Pressable onPressIn={press} onPressOut={release} accessibilityLabel={t('Hold to commit')}
          style={[styles.holdRing, { borderColor: colors.primary }]}>
          <Animated.View style={[styles.holdFill, { backgroundColor: colors.primary, transform: [{ scale: hold }] }]} />
          <Ionicons name={committed ? 'checkmark' : 'finger-print-outline'} size={40} color={committed ? colors.onPrimary : colors.primary} />
        </Pressable>
        <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.md }]}>{committed ? t('Promise made 🌸') : t('Hold to commit')}</Text>
      </View>
    )
  } else if (name === 'notify') {
    const turnOn = async () => {
      await requestNotificationPermissions()
      finish(true, { offerPremium: true })
    }
    const later = async () => {
      if (userId) await AsyncStorage.setItem(`skynkod_notif_later_${userId}`, '1').catch(() => {})
      finish(true, { offerPremium: true })
    }
    content = (
      <>
        <View style={[styles.fakeNotif, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image source={LOGO} resizeMode="contain" style={{ width: 54, height: 54 / LOGO_RATIO }} />
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.caption, { color: colors.muted }]}>{t('now')}</Text>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Time for your evening routine 🌙')}</Text>
          </View>
        </View>
        <Text style={[styles.headline, { color: colors.text, marginTop: SPACING.xxl }]}>{t('A gentle reminder, morning and evening?')}</Text>
        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t('For your two routines and your daily skin check-in. You can change them anytime in your settings.')}</Text>
      </>
    )
    footer = (
      <View style={{ gap: SPACING.sm }}>
        <Pill title={t('Turn on reminders')} onPress={turnOn} loading={saving} />
        <Pill title={t('Not now')} variant="ghost" onPress={later} />
      </View>
    )
  } else if (name.startsWith('q:')) {
    const q = quiz.find(x => `q:${x.id}` === name)
    const firstOfChapter = quiz.findIndex(x => x.chapter === q.chapter) === quiz.indexOf(q)
    const chapter = CHAPTERS.find(c => c.id === q.chapter)
    const chapterNo = CHAPTERS.filter(c => quiz.some(x => x.chapter === c.id)).indexOf(chapter) + 1
    content = (
      <>
        <Text style={[TYPE.overline, { color: BRAND_MAUVE, marginBottom: SPACING.sm }]}>{t('Chapter {n}', { n: chapterNo })} · {t(chapter.label)}</Text>
        {firstOfChapter ? <Text style={[TYPE.body, { color: colors.textSecondary, marginBottom: SPACING.lg, fontStyle: 'italic' }]}>{t(chapter.cheer)}</Text> : null}
        <QuizQuestion question={q} value={answers[q.id]} onChange={v => setAnswer(q.id, v)} onPicked={() => setTimeout(next, 260)} />
      </>
    )
    footer = q.type === 'multi'
      ? <Pill title={(answers[q.id] || []).length ? t('Continue') : t('Skip')} onPress={next} />
      : <Pill title={t('Skip')} variant="ghost" onPress={next} />
  } else {
    content = (
      <>
        <Text style={[TYPE.overline, { color: colors.muted }]}>{t('Your skin profile')}</Text>
        <Text style={[styles.headline, { color: colors.text, marginTop: SPACING.sm }]}>
          {firstName.trim() ? t('Nice to meet you, {name}.', { name: firstName.trim() }) : t('Nice to meet your skin.')}
        </Text>
        <View style={[styles.summary, { backgroundColor: BRAND_MAUVE }]}>
          <Text style={styles.summaryLabel}>{t('Skin type')}</Text>
          <Text style={styles.summaryValue}>{computeSkinType(answers) ? t(computeSkinType(answers)) : t('To discover')}{answers.reactivity === 'often' ? ` · ${t('Sensitive')}` : ''}</Text>
          {answers.sun ? (<>
            <Text style={styles.summaryLabel}>{t('Sun phototype')}</Text>
            <Text style={styles.summaryValue}>{PHOTOTYPE[answers.sun]}</Text>
          </>) : null}
          <Text style={styles.summaryLabel}>{t('Working on')}</Text>
          <Text style={[styles.summaryValue, { marginBottom: 0 }]}>{(answers.concerns || []).map(c => t(c)).join(' · ') || t('Keeping my skin healthy')}</Text>
        </View>
        {health && suspicionsFrom(answers).map(id => (
          <View key={id} style={[styles.suspicion, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(SUSPICIONS[id].title)}</Text>
            <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>{t(SUSPICIONS[id].text)}</Text>
            <Text style={[TYPE.caption, { color: colors.primary, marginTop: 6, lineHeight: 18, fontWeight: '600' }]}>{t(DOCTOR_NOTE)}</Text>
          </View>
        ))}
        <Text style={[TYPE.body, { color: colors.muted, marginTop: SPACING.xl }]}>
          {t('You can change any answer later in Profile › My skin profile.')}
        </Text>
      </>
    )
    footer = <Pill title={t('Continue')} onPress={next} />
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.flex, { backgroundColor: colors.bg }]}>
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom + SPACING.lg }]}>
      <View style={styles.topBar}>
        <Pressable onPress={back} hitSlop={12} accessibilityLabel={t('Back')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        {!['summary', 'consent', 'birthday', 'loader', 'notify'].includes(name) ? (
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
  birthRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xxl },
  birthField: { textAlign: 'center', marginTop: 0, paddingHorizontal: 0 },
  minorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md },
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
  suspicion: { borderRadius: 20, borderWidth: 1, padding: SPACING.lg, marginTop: SPACING.md },

  bigIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  percent: { fontSize: 56, fontWeight: '700', letterSpacing: -1, marginTop: SPACING.lg },
  loaderTrack: { height: 6, borderRadius: 3, overflow: 'hidden', alignSelf: 'stretch', marginTop: SPACING.lg },
  loaderFill: { height: 6, borderRadius: 3 },
  promise: { fontSize: 22, fontWeight: '600', lineHeight: 30, textAlign: 'center', marginTop: SPACING.xl, fontStyle: 'italic' },
  holdRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: SPACING.xxxl },
  holdFill: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
  fakeNotif: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, marginTop: SPACING.lg },
})
