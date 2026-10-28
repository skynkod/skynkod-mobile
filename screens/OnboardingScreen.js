import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Animated, Easing, TextInput, KeyboardAvoidingView, Platform, Share, useWindowDimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as WebBrowser from 'expo-web-browser'
import * as Haptics from 'expo-haptics'
import Svg, { Path, Circle, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { updateUserProfile } from '../utils/supabase'
import { requestNotificationPermissions, DEFAULT_TIMES } from '../utils/notifications'
import { startBasicRoutine } from '../utils/rekod'
import { deleteAccount } from '../utils/account'
import { articlesIn } from '../utils/encyclopedia'
import ArticleBody from '../components/ArticleBody'
import { logError } from '../utils/errorLogger'
import { track } from '../utils/analytics'
import { toColumns, computeSkinType, QUESTIONS } from '../utils/skin-quiz'
import { getIssue } from '../utils/skin-issues'
import { TOPICAL_RX, OTHER_RX, WEEK, planDone, isTopicalRx, isRetinoidRx } from '../utils/treatments'

// Sign-up v8 (Lita's mockup v3, 2026-10-27): soft pink glass, real skin photos,
// thin mauve line icons, one calm question per screen. The questions and their
// order follow docs/onboarding-algorithme.md; the answers are saved with the
// same keys as before (utils/skin-quiz.js toColumns), so Rekod, Koda and the
// product verdicts read them unchanged.

// Bump when the terms or privacy policy change, so users are asked again.
export const CONSENT_VERSION = 'v1-2026-10'
const TERMS_URL = 'https://skynkod.com/terms'
const PRIVACY_URL = 'https://skynkod.com/privacy'

const C = { ink: '#2F2230', soft: '#6E5F6B', mute: '#A0909B', mauve: '#8E6688', mauve2: '#A57B9C', line: '#EADCE5', bg1: '#FBF4F8', bg2: '#F3E3EC', glass: 'rgba(255,255,255,0.62)', glassLine: 'rgba(255,255,255,0.9)', icon: '#94557F' }

const IMG = {
  logo: require('../assets/images/skynkod-logo.png'),
  orb: require('../assets/onboarding/orb-welcome.png'),
  bubble: require('../assets/onboarding/bubble-empty.png'),
  sun: require('../assets/onboarding/sun-logo.png'),
  cards: require('../assets/onboarding/profile-cards.png'),
  introSkin: require('../assets/onboarding/intro-skin.jpg'),
  introProfile: require('../assets/onboarding/intro-profile.jpg'),
  faceZones: require('../assets/conditions/face-zones.jpg'),
  // Smooth gradients as images: they render the same on every phone.
  bg: require('../assets/onboarding/bg.jpg'),
  bgDeep: require('../assets/onboarding/bg-deep.jpg'),
  cardFade: require('../assets/onboarding/card-fade.png'),
  btn: require('../assets/onboarding/btn.png'),
  fadeIntro: require('../assets/onboarding/fade-intro.png'),
  fadeProfile: require('../assets/onboarding/fade-profile.png'),
}
const KODA = {
  happy: require('../assets/koda/koda-happy.png'),
  wink: require('../assets/koda/koda-wink.png'),
  joy: require('../assets/koda/koda-joy.png'),
  calm: require('../assets/koda/koda-calm.png'),
  curious: require('../assets/koda/koda-curious.png'),
}
// Card photos (assets/conditions), each tied to the skin issue it saves.
const CARD = {
  'skin-test-tight': require('../assets/conditions/skin-test-tight.jpg'),
  'skin-test-comfortable': require('../assets/conditions/skin-test-comfortable.jpg'),
  'skin-test-tzone': require('../assets/conditions/skin-test-tzone.jpg'),
  'skin-test-oily': require('../assets/conditions/skin-test-oily.jpg'),
  'family-breakouts': require('../assets/conditions/family-breakouts.jpg'),
  'family-redness': require('../assets/conditions/family-redness.jpg'),
  'family-spots': require('../assets/conditions/family-spots.jpg'),
  'family-pores': require('../assets/conditions/family-pores.jpg'),
  'family-dryness': require('../assets/conditions/family-dryness.jpg'),
  'family-lines': require('../assets/conditions/family-lines.jpg'),
  'card-blackheads': require('../assets/conditions/card-blackheads.jpg'),
  'card-red-spots': require('../assets/conditions/card-red-spots.jpg'),
  'card-deep-spots': require('../assets/conditions/card-deep-spots.jpg'),
  'card-hormonal': require('../assets/conditions/card-hormonal.jpg'),
  'card-fungal': require('../assets/conditions/card-fungal.jpg'),
  'card-scars': require('../assets/conditions/card-scars.jpg'),
  'card-red-marks': require('../assets/conditions/card-red-marks.jpg'),
  'card-vessels': require('../assets/conditions/card-vessels.jpg'),
  'card-reactive': require('../assets/conditions/card-reactive.jpg'),
  'card-brown-marks': require('../assets/conditions/card-brown-marks.jpg'),
  'card-sun-spots': require('../assets/conditions/card-sun-spots.jpg'),
  'card-dull': require('../assets/conditions/card-dull.jpg'),
  'card-nose-dots': require('../assets/conditions/card-nose-dots.jpg'),
  'card-uneven-texture': require('../assets/conditions/card-uneven-texture.jpg'),
  'card-deep-wrinkles': require('../assets/conditions/card-deep-wrinkles.jpg'),
  'card-sagging': require('../assets/conditions/card-sagging.jpg'),
  'card-eye-blue-circles': require('../assets/conditions/card-eye-blue-circles.jpg'),
  'card-eye-brown-circles': require('../assets/conditions/card-eye-brown-circles.jpg'),
  'card-eye-hollow': require('../assets/conditions/card-eye-hollow.jpg'),
  'card-eye-puffy': require('../assets/conditions/card-eye-puffy.jpg'),
  'card-eye-lines': require('../assets/conditions/card-eye-lines.jpg'),
  'card-eye-milia': require('../assets/conditions/card-eye-milia.jpg'),
  'card-lips-dry': require('../assets/conditions/card-lips-dry.jpg'),
  'card-lips-corners': require('../assets/conditions/card-lips-corners.jpg'),
  'card-lips-dark': require('../assets/conditions/card-lips-dark.jpg'),
  'card-lips-lines': require('../assets/conditions/card-lips-lines.jpg'),
  'card-lips-peeling': require('../assets/conditions/card-lips-peeling.jpg'),
  'card-neck-lines': require('../assets/conditions/card-neck-lines.jpg'),
  'card-neck-sagging': require('../assets/conditions/card-neck-sagging.jpg'),
  'card-neck-dry': require('../assets/conditions/card-neck-dry.jpg'),
  'card-neck-dark': require('../assets/conditions/card-neck-dark.jpg'),
}

// ---------- the content (docs/onboarding-algorithme.md) ----------
const STEPS = [
  { z: 'skin', t: 'Skin', s: 'Type, tone & goals', i: 'sun', d: 'Let\'s start with the basics. We\'ll look at your skin type, tone and goals.' },
  { z: 'face', t: 'Face', s: 'Zones & concerns', i: 'face' },
  { z: 'eyes', t: 'Eyes', s: 'Dark circles, puffiness, fine lines', i: 'eye' },
  { z: 'lips', t: 'Lips', s: 'Condition & texture', i: 'lips' },
  { z: 'neck', t: 'Neck', s: 'Firmness & lines', i: 'neck' },
  { z: 'life', t: 'Lifestyle', s: 'Sleep, stress, daily habits', i: 'leaf' },
  { z: 'safety', t: 'Safety', s: 'Pregnancy, allergies, treatments', i: 'shield' },
]
const SI = z => STEPS.findIndex(x => x.z === z)
const pad = n => String(n).padStart(2, '0')
const NEXT_LOOK = { face: 'your face', eyes: 'your eye area', lips: 'your lips', neck: 'your neck', life: 'your daily life', safety: 'your safety' }

const GOALS = [
  { v: 'clear', t: 'Clear skin', s: 'Breakouts, blackheads', ic: 'sparkles' },
  { v: 'hydration', t: 'Hydrated skin', s: 'Feels tight', ic: 'droplet' },
  { v: 'even_tone', t: 'Even tone', s: 'Spots, marks', ic: 'tone' },
  { v: 'anti_aging', t: 'Firmer skin', s: 'Fine lines, firmness', ic: 'hourglass' },
  { v: 'pores', t: 'Smaller pores', s: 'Shine, texture', ic: 'pores' },
  { v: 'calm', t: 'Calm skin', s: 'Redness', ic: 'leaf' },
]
const SEX = [{ v: 'woman', t: 'A woman' }, { v: 'man', t: 'A man' }]
const AGES = ['18–24', '25–34', '35–44', '45–54', '55 and over']
const AGE_SAY = ['A great time for good habits.', 'A great time to prevent.', 'We\'ll take care of your glow.', 'We\'ll take care of firmness and comfort.', 'We\'ll take care of firmness and comfort.']
const MENO = [{ v: 'not_yet', t: 'Not yet' }, { v: 'during', t: 'Going through it', s: 'Irregular periods, hot flushes' }, { v: 'after', t: 'After menopause' }]
const WASH = [
  { v: 'dry', t: 'Feels tight', s: 'A little rough', img: 'skin-test-tight' },
  { v: 'normal', t: 'Comfortable', s: 'Nothing to report', img: 'skin-test-comfortable' },
  { v: 'combo', t: 'Shiny in the center', s: 'Forehead and nose', img: 'skin-test-tzone' },
  { v: 'oily', t: 'Shiny all over', s: 'Whole face', img: 'skin-test-oily' },
]
const SHINE = [{ v: 'matte', t: 'Not at all' }, { v: 'tzone', t: 'In the center', s: 'Forehead, nose, chin' }, { v: 'all', t: 'All over' }]
const PORES = [{ v: 'small', t: 'Barely' }, { v: 'nose', t: 'On the nose' }, { v: 'cheeks', t: 'On the nose and cheeks' }]
const TONES = ['#F6E1D3', '#EBC8AE', '#D6A584', '#B07A55', '#7E5236', '#4A2E1F']
// Face zones on the photo (x, y in the 1145 × 1374 image).
const ZONES = [
  { t: 'Forehead', v: 'forehead', x: 575, y: 330, e: [[575, 330, 250, 105]] },
  { t: 'Cheeks', v: 'cheeks', x: 340, y: 830, e: [[340, 830, 120, 150], [810, 830, 120, 150]] },
  { t: 'Nose', v: 'nose', x: 575, y: 760, e: [[575, 760, 72, 150]] },
  { t: 'Chin', v: 'jaw', x: 575, y: 1175, e: [[575, 1175, 140, 80]] },
]
const FAMILIES = [
  { k: 'acne', t: 'Breakouts', s: 'Blackheads, cysts…', img: 'family-breakouts' },
  { k: 'red', t: 'Redness', s: 'Comes and goes', img: 'family-redness' },
  { k: 'spots', t: 'Dark spots', s: 'Marks, sun', img: 'family-spots' },
  { k: 'pores', t: 'Pores & shine', s: 'Texture', img: 'family-pores' },
  { k: 'dry', t: 'Dryness', s: 'Tight, flaky', img: 'family-dryness' },
  { k: 'age', t: 'Lines & firmness', s: 'Fine lines, sagging', img: 'family-lines' },
]
// id = the skin issue saved (utils/skin-issues.js); health = only with the health consent.
const DETAILS = {
  acne: ['What kind of breakouts?', [
    { id: 'comedonal-acne', t: 'Blackheads & whiteheads', img: 'card-blackheads' },
    { id: 'inflammatory-acne', t: 'Red spots', img: 'card-red-spots' },
    { id: 'cystic-acne', t: 'Deep, painful spots', img: 'card-deep-spots' },
    { id: 'hormonal-acne', t: 'Chin breakouts with your cycle or hormones', img: 'card-hormonal' },
    { id: 'fungal-acne', t: 'Small, itchy, identical bumps', img: 'card-fungal', health: true },
    { id: 'acne-scars', t: 'Acne scars', img: 'card-scars' },
  ]],
  red: ['What kind of redness?', [
    { id: 'post-acne-redness', t: 'Red marks after a spot', img: 'card-red-marks' },
    { id: 'visible-vessels', t: 'Small visible vessels', img: 'card-vessels' },
    { id: 'sensitive-skin', t: 'Skin that reacts fast', img: 'card-reactive' },
  ]],
  spots: ['What kind of spots?', [
    { id: 'pih', t: 'Brown marks after a spot', img: 'card-brown-marks' },
    { id: 'sun-spots', t: 'Sun spots', img: 'card-sun-spots' },
    { id: 'dullness', t: 'Dull complexion', img: 'card-dull' },
  ]],
  pores: ['What does it look like?', [
    { id: 'enlarged-pores', t: 'Enlarged pores', img: 'family-pores' },
    { id: 'sebaceous-filaments', t: 'Little dots on the nose', img: 'card-nose-dots' },
    { id: 'oily-skin', t: 'Oily skin', img: 'skin-test-oily' },
    { id: 'uneven-texture', t: 'Uneven texture', img: 'card-uneven-texture' },
  ]],
  dry: ['Dry or dehydrated?', [
    { id: 'dry-skin', t: 'Dry: lacks oil, flakes', img: 'skin-test-tight' },
    { id: 'dehydrated-skin', t: 'Dehydrated: lacks water, feels tight', img: 'family-dryness' },
  ]],
  age: ['What do you notice?', [
    { id: 'fine-lines', t: 'Fine lines', img: 'family-lines' },
    { id: 'deep-wrinkles', t: 'Deep wrinkles', img: 'card-deep-wrinkles' },
    { id: 'sagging', t: 'Sagging skin', img: 'card-sagging' },
  ]],
}
const EYES = [
  { id: 'dark-circles', d: 'blue', t: 'Blue or purple dark circles', s: 'Worse when you\'re tired', img: 'card-eye-blue-circles' },
  { id: 'dark-circles', d: 'brown', t: 'Brown dark circles', s: 'Always there, even rested', img: 'card-eye-brown-circles' },
  { id: 'dark-circles', d: 'hollow', t: 'Hollow dark circles', s: 'A shadow under the eye', img: 'card-eye-hollow' },
  { id: 'puffy-eyes', t: 'Puffiness', s: 'Swollen in the morning', img: 'card-eye-puffy' },
  { id: 'eye-lines', t: 'Fine lines at the corners', img: 'card-eye-lines' },
  { id: 'milia', t: 'Little white bumps', img: 'card-eye-milia' },
]
const LIPS = [
  { id: 'chapped-lips', t: 'Dry, chapped', img: 'card-lips-dry' },
  { id: 'angular-cheilitis', t: 'Cracked corners', img: 'card-lips-corners' },
  { id: 'lips-dark', t: 'Darker lips', img: 'card-lips-dark' },
  { id: 'lips-lines', t: 'Lines around the lips', img: 'card-lips-lines' },
  { id: 'lips-peeling', t: 'Peeling often', img: 'card-lips-peeling' },
]
const NECK = [
  { id: 'neck-lines', t: 'Neck lines', img: 'card-neck-lines' },
  { id: 'neck-sagging', t: 'Sagging skin', img: 'card-neck-sagging' },
  { id: 'neck-dry', t: 'Dry skin', img: 'card-neck-dry' },
  { id: 'neck-dark', t: 'Darker patches', img: 'card-neck-dark' },
]
const SKIN_STATEMENTS = ['Does your skin turn red or sting with a new product?', 'In the sun, do you burn before you tan?', 'Does your skin feel tight after a shower?']
const SKIN_SAYS = [['We\'ll go gently.', 'A resilient skin, great.'], ['Sunscreen will be your best friend.', 'Sunscreen still matters, promise.'], ['We\'ll hydrate it well.', 'Perfect.']]
const LIFE_CARDS = [
  { t: 'Stress', s: 'Lately', ic: 'pulse-outline', say: 'Stress shows on the skin, we\'ll follow it.' },
  { t: 'Makeup', s: 'Most days', ic: 'color-palette-outline', say: 'We\'ll think about makeup removal.' },
  { t: 'Outdoors', s: 'A lot of time', ic: 'sun', say: 'We\'ll boost your sun protection.' },
  { t: 'Sweat', s: 'Sport or heat', ic: 'droplet', say: 'We\'ll pick light textures.' },
  { t: 'None', s: 'None of these', ic: 'leaf', none: true },
]
const SAFETY = [
  { k: 'preg', t: 'Pregnancy or breastfeeding', i: 'heart', q: 'Which one?', one: true, o: [['pregnant', 'I\'m pregnant'], ['breastfeeding', 'I\'m breastfeeding']] },
  { k: 'avoid', t: 'An allergy to an ingredient', i: 'allergy', q: 'Which ones?', o: [['Fragrance', 'Fragrance'], ['Essential oils', 'Essential oils'], ['Nuts', 'Nuts'], ['Lanolin', 'Lanolin'], ['Alcohol', 'Alcohol'], ['Other', 'Other']] },
  // Diagnosed conditions switch on the product rules that protect these skins (logic audit, 2026-10-27).
  { k: 'conditions', t: 'A skin condition diagnosed by a doctor', i: 'shield-check', q: 'Which ones?', o: [['Rosacea', 'Rosacea'], ['Eczema', 'Eczema or atopic skin'], ['Psoriasis', 'Psoriasis'], ['Perioral dermatitis', 'Perioral dermatitis'], ['Seborrheic dermatitis', 'Seborrheic dermatitis'], ['Melasma', 'Melasma']] },
  // The exact treatment (Lita, 2026-10-27): each one has its own rules, and each cream becomes a step of her routine.
  { k: 'meds', t: 'A skin or hormonal treatment', i: 'pill', q: 'Which ones?', o: [...TOPICAL_RX, ...OTHER_RX].map(x => [x.id, x.label]),
    groups: [['On the skin', TOPICAL_RX.map(x => x.id)], ['By mouth or other', OTHER_RX.map(x => x.id)]] },
]
// Rosacea or eczema: retinol only if her dermatologist agreed (rulebook M1–M2).
const RETINOL_ASK = ['Rosacea', 'Eczema']
const SKIN_WHY = { Oily: 'It shines all over your face.', Combination: 'Shiny in the center, normal on the cheeks.', Dry: 'It lacks oil and feels tight.', Normal: 'Balanced: neither oily nor dry.' }

// ---------- My Skyn Profile: replay one step (Lita, 2026-10-27) ----------
// Saved answers → the sign-up's picks, so a step opens already filled in.
const AVOID_FIXED = ['Fragrance', 'Essential oils', 'Nuts', 'Lanolin', 'Alcohol']
export const fromAnswers = (a = {}, row = {}) => {
  const ids = a.issues || []
  const allFace = Object.values(DETAILS).flatMap(([, list]) => list)
  const face = []
  for (const id of ids) { const o = allFace.find(x => x.id === id); if (o && !face.includes(o)) face.push(o) }
  const kinds = a.eyeDetails || []
  const avoid = a.avoid || []
  const custom = avoid.filter(x => !AVOID_FIXED.includes(x))
  return {
    name: row?.first_name || null,
    goals: GOALS.filter(g => (a.goals || []).includes(g.v)),
    sex: a.sex || null, age: a.ageRange ?? null, meno: a.menopause || null,
    feel: a.feel || null, shine: a.shine || null, pores: a.pores || null,
    skinYes: a.reactivity ? [a.reactivity === 'often', ['burn', 'burntan'].includes(a.sun), !!a.tightAfterShower] : undefined,
    tone: a.tone ?? null,
    faceZones: ZONES.filter(z => (a.faceZones || []).includes(z.v)),
    face,
    eyes: EYES.filter(o => ids.includes(o.id) && (!o.d || kinds.includes(o.d) || (!kinds.length && o.d === 'blue'))),
    lips: LIPS.filter(o => ids.includes(o.id)),
    neck: NECK.filter(o => ids.includes(o.id)),
    priority: a.priority || null, secondary: a.secondary || null,
    sleep: a.sleepHours ?? ({ short: 5, ok: 7, long: 9 }[a.sleep]),
    lifeYes: a.stress || a.makeup || a.sunTime ? [a.stress === 'high', a.makeup === 'daily', a.sunTime === 'high', !!a.sweat] : undefined,
    preg: ['pregnant', 'breastfeeding'].includes(a.pregnancy) ? [a.pregnancy] : [],
    avoid: [...avoid.filter(x => AVOID_FIXED.includes(x)), ...(custom.length ? ['Other'] : [])],
    avoidOther: custom.join(', '),
    conditions: a.conditions || [], meds: a.meds || [], prefs: a.prefs || [],
    rxPlan: a.rxPlan || {}, medsOther: a.medsOther || '', retinolOk: !!a.retinolOk,
  }
}
// Where each step starts, which screen ends it, and the answers it owns.
const CHAPTER_START = { skin: 'goals', face: 'faceZones', eyes: 'eyes', lips: 'lips', neck: 'neck', life: 'sleep', safety: 'safety', priority: 'spotted' }
const CHAPTER_END = { skinDone: 'skin', faceDone: 'face', eyesDone: 'eyes', lipsDone: 'lips', neckDone: 'neck', lifeDone: 'life', last: 'safety' }
const ISSUE_KEYS = ['issues', 'eyeDetails', 'priority', 'secondary']
const CHAPTER_KEYS = {
  skin: ['goals', 'sex', 'ageRange', 'menopause', 'feel', 'shine', 'pores', 'reactivity', 'sun', 'tightAfterShower', 'tone'],
  face: ['faceZones', 'acneWhere', ...ISSUE_KEYS], eyes: ISSUE_KEYS, lips: ISSUE_KEYS, neck: ISSUE_KEYS,
  life: ['sleepHours', 'sleep', 'stress', 'makeup', 'sunTime', 'sweat', 'priority', 'secondary'],
  safety: ['pregnancy', 'avoid', 'conditions', 'meds', 'prefs', 'rxPlan', 'medsOther', 'retinolOk'],
  priority: ['priority', 'secondary'],
}

// ---------- small pieces ----------
// Lita's line icons (one ChatGPT sheet, 2026-10-27): same mauve stroke everywhere,
// recoloured with tintColor when needed. Other names fall back to Ionicons.
const ICON = {
  'face': require('../assets/onboarding/icons/face.png'),
  'eye': require('../assets/onboarding/icons/eye.png'),
  'lips': require('../assets/onboarding/icons/lips.png'),
  'neck': require('../assets/onboarding/icons/neck.png'),
  'leaf': require('../assets/onboarding/icons/leaf.png'),
  'shield': require('../assets/onboarding/icons/shield.png'),
  'lock': require('../assets/onboarding/icons/lock.png'),
  'unlock': require('../assets/onboarding/icons/unlock.png'),
  'sparkles': require('../assets/onboarding/icons/sparkles.png'),
  'droplet': require('../assets/onboarding/icons/droplet.png'),
  'tone': require('../assets/onboarding/icons/tone.png'),
  'hourglass': require('../assets/onboarding/icons/hourglass.png'),
  'pores': require('../assets/onboarding/icons/pores.png'),
  'heart': require('../assets/onboarding/icons/heart.png'),
  'allergy': require('../assets/onboarding/icons/allergy.png'),
  'pill': require('../assets/onboarding/icons/pill.png'),
  'document': require('../assets/onboarding/icons/document.png'),
  'shield-check': require('../assets/onboarding/icons/shield-check.png'),
}
const LineIcon = ({ name, size = 24, color = C.icon }) => name === 'sun'
  ? <Image source={IMG.sun} style={{ width: size * 1.15, height: size * 1.15 }} resizeMode="contain" />
  : ICON[name]
  ? <Image source={ICON[name]} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />
  : <Ionicons name={name} size={size} color={color} />

// One empty pearl bubble for every step; the symbol is added in code, so the
// sun is always the welcome orb's sun and the line icons always match.
const Bubble = ({ name, size }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <Image source={IMG.bubble} style={{ position: 'absolute', left: 0, top: 0, width: size, height: size }} resizeMode="contain" />
    <View style={{ zIndex: 1 }}>
      {name === 'sun'
        ? <Image source={IMG.sun} style={{ width: size * 0.58, height: size * 0.58 }} resizeMode="contain" />
        : <LineIcon name={name} size={size * 0.46} color={C.icon} />}
    </View>
  </View>
)

// The soft pink silk background with its two light halos.
const Backdrop = ({ deep }) => <Image source={deep ? IMG.bgDeep : IMG.bg} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" />

// Elements rise in one after the other when a screen opens.
const Rise = ({ i = 0, children, style }) => {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 480, delay: i * 50, easing: Easing.bezier(0.2, 0.9, 0.2, 1), useNativeDriver: true }).start() }, [])
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>{children}</Animated.View>
}
const Pop = ({ delay = 0, children, style }) => {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => { Animated.spring(v, { toValue: 1, delay, friction: 5, tension: 70, useNativeDriver: true }).start() }, [])
  return <Animated.View style={[style, { opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>{children}</Animated.View>
}
const Float = ({ children, style, range = 8, duration = 3600 }) => {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]))
    loop.start()
    return () => loop.stop()
  }, [])
  return <Animated.View style={[style, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -range] }) }] }]}>{children}</Animated.View>
}

// Everything the screens share (fonts, answers, navigation, Koda), so each
// screen keeps its own picks while Koda talks.
const Ob = React.createContext(null)
const useOb = () => React.useContext(Ob)
const useType = () => {
  const { F } = useOb()
  return {
    h1: { ...F.s, fontSize: 28, lineHeight: 33, letterSpacing: -0.6, color: C.ink },
    h2: { ...F.s, fontSize: 24, lineHeight: 29, letterSpacing: -0.4, color: C.ink },
    p: { ...F.r, fontSize: 14.5, lineHeight: 22, color: C.soft, marginTop: 10 },
    hint: { ...F.r, fontSize: 13, lineHeight: 19, color: C.soft, marginTop: 6 },
    step: { ...F.r, fontSize: 12, color: C.soft, marginBottom: 6, letterSpacing: 0.3 },
  }
}

// ---------- building blocks ----------
const GradientFill = ({ r }) => (
  <Image source={IMG.btn} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', borderRadius: r }]} resizeMode="stretch" />
)
const Btn = ({ title = 'Continue', onPress, disabled, style }) => {
  const { F } = useOb()
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={({ pressed }) => [styles.btn, { opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      <GradientFill r={26} />
      <Text style={[F.s, styles.btnText]}>{title}</Text>
      <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.btnArrow} />
    </Pressable>
  )
}
const Ghost = ({ title, onPress, icon }) => {
  const { F } = useOb()
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.ghost}>
      {icon ? <Ionicons name={icon} size={16} color={C.mauve2} /> : null}
      <Text style={[F.r, { color: C.mauve2, fontSize: 14 }]}>{title}</Text>
    </Pressable>
  )
}
const Bar = ({ z, noBack, skip, onPhoto }) => {
  const { F, back } = useOb()
  const i = z ? SI(z) : -1
  return (
    <View style={styles.bar}>
      {noBack ? null : <Pressable onPress={back} hitSlop={12} accessibilityLabel="Back"><Ionicons name="arrow-back" size={22} color={C.ink} /></Pressable>}
      {i >= 0 ? (
        <>
          <View style={styles.segs}>{STEPS.map((_, k) => <View key={k} style={[styles.seg, k <= i && styles.segOn]} />)}</View>
        </>
      ) : (
        <View style={{ flex: 1, alignItems: 'center' }}>
          {onPhoto ? null : <Image source={IMG.logo} style={{ height: 24, width: 24 * 1306 / 333 }} resizeMode="contain" />}
        </View>
      )}
      {skip
        ? <Pressable onPress={skip} hitSlop={12}><Text style={[F.r, { color: C.mauve2, fontSize: 13 }]}>Skip</Text></Pressable>
        : (noBack ? null : <View style={{ width: 24 }} />)}
    </View>
  )
}
const Head = ({ z, q, h, step = true }) => {
  const t = useType()
  return (
    <>
      <Bar z={z} />
      <Rise>
        {step ? <Text style={t.step}>{pad(SI(z) + 1)} / 07</Text> : null}
        <Text style={t.h2}>{q}</Text>
        {h ? <Text style={t.hint}>{h}</Text> : null}
      </Rise>
    </>
  )
}
const Page = ({ children, scroll = true }) => {
  const { insets } = useOb()
  const inner = { flexGrow: 1, paddingHorizontal: 22, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }
  return scroll
    ? <ScrollView contentContainerStyle={inner} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    : <View style={[inner, { flex: 1 }]}>{children}</View>
}
const Spacer = () => <View style={{ flex: 1, minHeight: 16 }} />
const Tick = ({ on }) => (
  <View style={[styles.tick, on && { backgroundColor: C.mauve2, borderColor: '#fff' }]}>
    {on ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
  </View>
)
// What she picked in the step she just finished: one small, quiet glass line.
const Summary = ({ label, items, d, empty = true }) => {
  const { F } = useOb()
  if (!items.length && !empty) return null
  return (
    <View style={styles.sum}>
      <Text style={[F.r, { fontSize: 12.5, lineHeight: 18, color: C.soft, textAlign: 'center' }]}>
        <Text style={[F.s, { color: C.mauve }]}>{label}: </Text>{items.length ? items.join(' · ') : 'nothing to report, lovely!'}{d ? ` ${d}` : ''}
      </Text>
    </View>
  )
}

// Photo or icon cards, 2 columns. one: picks and moves on; else up to max.
const PhotoPick = ({ z, q, h, opts, onDone, max = 0, one = false, initial = [] }) => {
  const { F, W, say } = useOb()
  const [sel, setSel] = useState(initial)
  const cardW = (W - 44 - 12) / 2
  const tap = (o) => {
    Haptics.selectionAsync().catch(() => {})
    if (one) { setSel([o]); setTimeout(() => onDone(o), 380); return }
    if (sel.includes(o)) return setSel(sel.filter(x => x !== o))
    if (max && sel.length >= max) return say(`Up to ${max}, one step at a time.`, 'curious')
    setSel([...sel, o])
  }
  return (
    <Page>
      <Head z={z} q={q} h={h} />
      <View style={styles.grid}>
        {opts.map((o, i) => {
          const on = sel.includes(o)
          return (
            <Rise key={o.t} i={i + 1}>
              <Pressable onPress={() => tap(o)} style={({ pressed }) => [styles.pc, { width: cardW }, on && styles.pcOn, pressed && { transform: [{ scale: 0.97 }] }]}>
                {o.img ? (
                  <>
                    <View style={{ width: '100%', height: cardW / 1.1 }}>
                      <Image source={CARD[o.img]} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <Image source={IMG.cardFade} style={{ position: 'absolute', left: 0, right: 0, bottom: -3, height: '62%', width: '100%' }} resizeMode="stretch" />
                    </View>
                    <View style={{ padding: 10, paddingTop: 0, marginTop: -30 }}>
                      <Text style={[F.s, styles.pcT]}>{o.t}</Text>
                      {o.s ? <Text style={[F.r, styles.pcS]}>{o.s}</Text> : null}
                    </View>
                  </>
                ) : (
                  <View style={{ alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, gap: 10 }}>
                    <View style={styles.gc}><LineIcon name={o.ic} size={24} /></View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={[F.s, styles.pcT, { textAlign: 'center' }]}>{o.t}</Text>
                      {o.s ? <Text style={[F.r, styles.pcS, { textAlign: 'center' }]}>{o.s}</Text> : null}
                    </View>
                  </View>
                )}
                <Tick on={on} />
              </Pressable>
            </Rise>
          )
        })}
      </View>
      <Spacer />
      {one ? null : <Btn disabled={!sel.length} onPress={() => onDone(sel)} />}
    </Page>
  )
}
const RowPick = ({ z, q, h, opts, onDone, extra, below }) => {
  const { F } = useOb()
  const [on, setOn] = useState(null)
  return (
    <Page>
      <Head z={z} q={q} h={h} />
      <View style={styles.rows}>
        {opts.map((o, i) => (
          <Rise key={o.t} i={i + 1}>
            <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); setOn(i); setTimeout(() => onDone(o, i), 380) }} style={[styles.row, on === i && styles.rowOn]}>
              <View style={{ flex: 1 }}>
                <Text style={[F.m, { fontSize: 15, color: C.ink }]}>{o.t}</Text>
                {o.s ? <Text style={[F.r, { fontSize: 12, color: C.mute, marginTop: 2 }]}>{o.s}</Text> : null}
              </View>
              <View style={[styles.radio, on === i && { borderWidth: 6, borderColor: C.mauve2 }]} />
            </Pressable>
          </Rise>
        ))}
      </View>
      {below}
      <Spacer />
      {extra}
    </Page>
  )
}
// "I'm under 18" (audit 2026-10-28): a small link under the ages, never where
// Continue sits on the other screens, and a confirmation before anything happens.
const UnderAge = ({ onConfirm }) => {
  const { F } = useOb()
  const [asking, setAsking] = useState(false)
  if (!asking) {
    return (
      <Pressable onPress={() => setAsking(true)} hitSlop={8} style={{ alignSelf: 'center', marginTop: 16 }}>
        <Text style={[F.r, { color: C.mute, fontSize: 13, textDecorationLine: 'underline' }]}>I'm under 18</Text>
      </Pressable>
    )
  }
  return (
    <View style={[styles.tg, { marginTop: 16 }]}>
      <Text style={[F.s, { fontSize: 15, color: C.ink }]}>Are you under 18?</Text>
      <Text style={[F.r, { fontSize: 13, lineHeight: 18, color: C.mute, marginTop: 4 }]}>Skynkod is for adults. If you are under 18, your answers and your account will be deleted.</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Pressable onPress={() => setAsking(false)} style={[styles.chip, { flex: 1, alignItems: 'center', paddingVertical: 10 }]}>
          <Text style={[F.m, { fontSize: 13, color: C.ink }]}>I made a mistake</Text>
        </Pressable>
        <Pressable onPress={onConfirm} style={[styles.chip, { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: C.mauve2, borderColor: C.mauve2 }]}>
          <Text style={[F.m, { fontSize: 13, color: '#fff' }]}>Yes, I'm under 18</Text>
        </Pressable>
      </View>
    </View>
  )
}
const YesNo = ({ z, q, h, onDone }) => {
  const { F } = useOb()
  return (
    <Page>
      <Head z={z} q={q} h={h} />
      <View style={{ flex: 1, minHeight: 200, alignItems: 'center', justifyContent: 'center' }}>
        <Pop delay={150}><Float><Bubble name={STEPS[SI(z)].i} size={170} /></Float></Pop>
      </View>
      <Rise i={2} style={styles.yes2}>
        <Pressable onPress={() => onDone(false)} style={styles.no}><Text style={[F.s, { fontSize: 15, color: C.ink }]}>No</Text></Pressable>
        <Pressable onPress={() => onDone(true)} style={styles.yes}>
          <GradientFill r={18} />
          <Text style={[F.s, { fontSize: 15, color: '#fff' }]}>Yes</Text>
        </Pressable>
      </Rise>
    </Page>
  )
}
const Statements = ({ z, q, h, items, reacts, initial, onDone }) => {
  const { F, say } = useOb()
  const [ans, setAns] = useState(initial || items.map(() => null))
  return (
    <Page>
      <Head z={z} q={q} h={h} />
      <View style={{ gap: 10, marginTop: 18 }}>
        {items.map((t, i) => (
          <Rise key={t} i={i + 1} style={styles.yni}>
            <Text style={[F.m, { fontSize: 14.5, lineHeight: 20, color: C.ink }]}>{t}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {[false, true].map(v => (
                <Pressable key={String(v)} onPress={() => { const next = [...ans]; next[i] = v; setAns(next); if (reacts?.[i]) say(reacts[i][v ? 0 : 1]) }}
                  style={[styles.ynb, ans[i] === v && { backgroundColor: C.mauve2, borderColor: C.mauve2 }]}>
                  <Text style={[F.s, { fontSize: 13.5, color: ans[i] === v ? '#fff' : C.soft }]}>{v ? 'Yes' : 'No'}</Text>
                </Pressable>
              ))}
            </View>
          </Rise>
        ))}
      </View>
      <Spacer />
      <Btn disabled={ans.some(a => a === null)} onPress={() => onDone(ans)} />
    </Page>
  )
}

// A chapter photo, slowly settling, faded into the page like the mockup.
const Hero = ({ source, height, fade }) => {
  const zoom = useRef(new Animated.Value(1.12)).current
  useEffect(() => { Animated.timing(zoom, { toValue: 1, duration: 9000, easing: Easing.out(Easing.quad), useNativeDriver: true }).start() }, [])
  return (
    <View style={[styles.hero, { height }]}>
      {/* The photo stops a little before the edge (it is fully faded there), so no line shows. */}
      <View style={{ height: height - 6, overflow: 'hidden' }}>
        <Animated.Image source={source} style={{ width: '100%', height: '100%', transform: [{ scale: zoom }] }} resizeMode="cover" />
      </View>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(246,214,228,0.10)' }]} />
      <Image source={fade} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="stretch" />
    </View>
  )
}

// ---------- the screens ----------
const Welcome = () => {
  const { F, W, go } = useOb()
  const t = useType()
  const orb = Math.min(340, W - 20)
  return (
    <Page>
      <Bar noBack />
      <Rise><Text style={[t.h1, { fontSize: 32, lineHeight: 37 }]}>Let's get to know your skin</Text></Rise>
      <Rise i={1}><Text style={t.p}>A few personal questions to understand your skin, your products and your lifestyle.</Text></Rise>
      <Rise i={2} style={{ alignItems: 'center', marginTop: 4, marginHorizontal: -12 }}>
        <Float duration={4000}><Image source={IMG.orb} style={{ width: orb, height: orb }} resizeMode="contain" /></Float>
      </Rise>
      <Rise i={3} style={styles.feats}>
        {[['sparkles', 'Personal'], ['shield-check', 'Ingredient-checked'], ['heart', 'Made for you']].map(([i, label]) => (
          <View key={label} style={{ alignItems: 'center', gap: 8 }}>
            <View style={styles.gc}><LineIcon name={i} size={24} /></View>
            <Text style={[F.s, { fontSize: 10, letterSpacing: 0.8, color: C.soft }]}>{label.toUpperCase()}</Text>
          </View>
        ))}
      </Rise>
      <Spacer />
      <Btn title="Start my journey" onPress={() => go('name')} />
    </Page>
  )
}

const NameScreen = () => {
  const { F, P, set, go } = useOb()
  const t = useType()
  const [v, setV] = useState(P.name || '')
  const next = () => {
    const name = v.trim()
    if (!name) return
    set({ name: name.charAt(0).toUpperCase() + name.slice(1) })
    go('consent')
  }
  return (
    <Page>
      <Bar />
      <Rise><Text style={t.h2}>What's your first name?</Text><Text style={t.hint}>So Koda can talk to you, and only you.</Text></Rise>
      <Rise i={1}>
        <TextInput value={v} onChangeText={setV} placeholder="Your first name" placeholderTextColor={C.mute} autoFocus
          autoCapitalize="words" autoComplete="given-name" textContentType="givenName" returnKeyType="next" maxLength={24}
          onSubmitEditing={next} style={[F.r, styles.inp, !!v.trim() && { borderColor: C.mauve2 }]} />
      </Rise>
      <Spacer />
      <Btn disabled={!v.trim()} onPress={next} />
    </Page>
  )
}

// The legal consents stay (terms required; sensitive skin data optional),
// drawn like the rest of the journey: a pearl bubble and glass switches.
const Consent = () => {
  const { F, terms, setTerms, health, setHealth, go, say } = useOb()
  const t = useType()
  const [nudged, setNudged] = useState(false)
  const next = () => {
    if (!health && !nudged) {
      setNudged(true)
      return say('Are you sure? Without it, we can\'t warn you about allergies, pregnancy or treatments. Tap Continue again to go on.', 'calm')
    }
    go('journey')
  }
  const body = { ...F.m, fontSize: 14.5, lineHeight: 20, color: C.ink }
  const small = { ...F.r, fontSize: 12.5, lineHeight: 17, color: C.mute, marginTop: 3 }
  const Switch = ({ on, onPress, icon, children }) => (
    <Pressable onPress={onPress} style={[styles.tg, styles.tgHd, on && { borderColor: C.mauve2 }]} accessibilityRole="switch" accessibilityState={{ checked: on }}>
      <View style={[styles.gc, { width: 40, height: 40 }]}><LineIcon name={icon} size={21} /></View>
      <View style={{ flex: 1 }}>{children}</View>
      <View style={[styles.toggle, on && { backgroundColor: C.mauve2 }]}><View style={[styles.knob, on && { left: 21 }]} /></View>
    </Pressable>
  )
  return (
    <Page>
      <Bar />
      <Pop style={{ alignSelf: 'center', marginTop: 4 }}><Bubble name="shield" size={120} /></Pop>
      <Rise style={{ alignItems: 'center', marginTop: 10 }}>
        <Text style={[t.h2, { textAlign: 'center' }]}>Your data, your choice</Text>
        <Text style={[t.hint, { textAlign: 'center' }]}>We never sell your personal data. You can change these choices anytime in Settings.</Text>
      </Rise>
      <Rise i={1} style={{ gap: 10, marginTop: 22 }}>
        <Switch on={terms} onPress={() => setTerms(!terms)} icon="document">
          <Text style={body}>
            I accept the <Text style={[F.s, { color: C.mauve }]} onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}>Terms of use</Text> and the <Text style={[F.s, { color: C.mauve }]} onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}>Privacy policy</Text>
          </Text>
          <Text style={small}>Required</Text>
        </Switch>
        <Switch on={health} onPress={() => setHealth(!health)} icon="shield-check">
          <View style={styles.reco}><Text style={[F.s, { fontSize: 10.5, letterSpacing: 0.6, color: C.mauve }]}>RECOMMENDED</Text></View>
          <Text style={body}>Let Skynkod keep my skin safe</Text>
          <Text style={small}>I allow Skynkod to collect and save my sensitive health information (allergies, pregnancy, skin conditions, treatments like Roaccutane) in my private profile. It's only used to check which products are safe for me, and never sold or shared. Without it, Skynkod can't warn me about a product that could harm my skin.</Text>
        </Switch>
      </Rise>
      <Spacer />
      <Btn disabled={!terms} onPress={next} />
    </Page>
  )
}

const Journey = () => {
  const { F, W, H, insets, P, go } = useOb()
  const t = useType()
  // Like the mockup: big pearl bubbles zigzagging down a glowing ribbon, Koda halfway.
  const w = W - 44
  const gap = Math.max(58, Math.min(84, (H - insets.top - insets.bottom - 250) / 8))
  const b = Math.min(66, gap * 0.86)
  const X = [0, 1, 0, 1, 0, 1, 0, 1].map(r => (r ? 0.4 : 0.17) * w + b / 2 - 0.08 * w)
  const Y = X.map((_, i) => b / 2 + 4 + i * gap)
  let d = `M${X[0]} ${Y[0]}`
  for (let i = 1; i < X.length; i++) d += ` C ${X[i - 1]} ${Y[i - 1] + gap * 0.55}, ${X[i]} ${Y[i] - gap * 0.55}, ${X[i]} ${Y[i]}`
  const all = [...STEPS, { t: 'Your Profile', s: 'Your personalized routine', i: 'lock' }]
  const height = Y[7] + b / 2 + 6
  return (
    <Page>
      <Bar />
      <Rise>
        <Text style={[t.h1, { textAlign: 'center', fontSize: 30, lineHeight: 36 }]}>Your Skyn Journey</Text>
        <Text style={[t.p, { textAlign: 'center', marginTop: 6 }]}>{P.name ? `${P.name}, 7` : '7'} steps to create your personalized routine.</Text>
      </Rise>
      <View style={{ width: w, height, marginTop: 16 }}>
        <Svg style={StyleSheet.absoluteFill} width={w} height={height}>
          <Path d={d} fill="none" stroke="#FFFFFF" strokeWidth={9} opacity={0.55} strokeLinecap="round" />
          <Path d={d} fill="none" stroke="#D7A3C4" strokeWidth={3} opacity={0.9} strokeLinecap="round" />
          <Path d={d} fill="none" stroke="#FFFFFF" strokeWidth={1} opacity={0.8} strokeLinecap="round" />
        </Svg>
        {all.map((s, i) => (
          <Rise key={s.t} i={i + 1} style={{ position: 'absolute', left: X[i] - b / 2, top: Y[i] - b / 2, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={i === 0 ? styles.cur : null}><Bubble name={s.i} size={b} /></View>
            <View>
              {i < 7 ? <Text style={[F.s, { fontSize: 11, color: C.soft }]}>{pad(i + 1)}</Text> : null}
              <Text style={[F.s, { fontSize: 16, lineHeight: 20, color: C.ink }]}>{s.t}</Text>
              <Text style={[F.r, { fontSize: 12, color: C.soft }]}>{s.s}</Text>
            </View>
          </Rise>
        ))}
        <Float style={{ position: 'absolute', left: w - 66, top: Y[4] - 34 }}>
          <Image source={KODA.happy} style={{ width: 64, height: 64 }} resizeMode="contain" />
        </Float>
      </View>
      <Spacer />
      <Btn title="Let's begin" onPress={() => go('intro')} />
    </Page>
  )
}

// The first chapter's intro, with the big photo and the thin circle; the text
// sits right under the photo, like the mockup.
const Intro = () => {
  const { F, W, H, insets, go } = useOb()
  const t = useType()
  const st = STEPS[0]
  const h = 0.56 * H
  return (
    <View style={{ flex: 1 }}>
      <Hero source={IMG.introSkin} height={h} fade={IMG.fadeIntro} />
      <Pop delay={300} style={[styles.lens, { left: W * 0.14, top: h * 0.1, width: W * 0.78, height: W * 0.78, borderRadius: W * 0.39 }]} />
      <Page>
        <Bar onPhoto />
        <View style={{ height: Math.max(0, h * 0.96 - insets.top - 58) }} />
        <Rise><Text style={t.step}>01 / 07</Text><Text style={[t.h1, { fontSize: 32, lineHeight: 38 }]}>{st.t}</Text><Text style={t.p}>{st.d}</Text></Rise>
        <Rise i={1} style={styles.info}>
          <Image source={IMG.sun} style={{ width: 30, height: 30 }} resizeMode="contain" />
          <Text style={[F.r, { flex: 1, fontSize: 12.5, lineHeight: 18, color: C.soft }]}>This helps us understand your unique skin and create a routine that actually fits you.</Text>
        </Rise>
        <Spacer />
        <Btn title="Start" onPress={() => go('goals')} />
      </Page>
    </View>
  )
}

// Little four-point sparkles of light, as on the mockup.
const Sparkles = ({ points, width, height }) => (
  <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
    {points.map(([x, y, r], i) => (
      <Path key={i} d={`M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`} fill="#FFFFFF" opacity={0.9} />
    ))}
  </Svg>
)

// Between two steps: "Great!", Koda, a ribbon of light around the next
// step's bubble, sparkles, and a small line with what she picked.
const Between = ({ from, next, onGo, summary }) => {
  const { W, nm } = useOb()
  const t = useType()
  const st = STEPS[SI(next)]
  const words = ['Great', 'Lovely', 'Nice work', 'Perfect', 'Beautiful', 'Almost there']
  const sw = W - 44
  const sh = 340
  const bub = Math.min(220, sw * 0.62)
  const cx = sw / 2 + 10
  const cy = 200
  const ribbon = `M${sw * 0.72} -10 C ${sw * 0.8} 40, ${sw * 0.45} 55, ${sw * 0.3} 80 S ${cx - bub * 0.62} ${cy - 20}, ${cx - bub * 0.45} ${cy + bub * 0.4} S ${sw * 0.3} ${sh - 10}, -20 ${sh - 40}`
  return (
    <Page>
      <Bar />
      <Rise style={{ alignItems: 'center' }}>
        <Text style={[t.h1, { textAlign: 'center' }]}>{words[SI(from) % words.length]}{nm} ✨</Text>
        <Text style={[t.p, { textAlign: 'center', marginTop: 6 }]}>Now let's look at {NEXT_LOOK[next]}.</Text>
      </Rise>
      <View style={{ height: sh, width: sw }}>
        <Svg style={StyleSheet.absoluteFill} width={sw} height={sh}>
          <Path d={ribbon} fill="none" stroke="#FFFFFF" strokeWidth={8} opacity={0.5} strokeLinecap="round" />
          <Path d={ribbon} fill="none" stroke="#C99BBB" strokeWidth={2.6} opacity={0.85} strokeLinecap="round" />
          <Path d={ribbon} fill="none" stroke="#FFFFFF" strokeWidth={0.9} opacity={0.9} strokeLinecap="round" />
        </Svg>
        <Pop delay={200} style={{ position: 'absolute', left: cx - bub / 2, top: cy - bub / 2 }}><Bubble name={st.i} size={bub} /></Pop>
        <Float style={{ position: 'absolute', left: sw * 0.04, top: 22 }} duration={3400}>
          <Image source={KODA.wink} style={{ width: 92, height: 92 }} resizeMode="contain" />
        </Float>
        <Sparkles width={sw} height={sh} points={[[sw * 0.86, 70, 7], [sw * 0.93, 230, 9], [sw * 0.06, 170, 6], [sw * 0.18, 290, 8], [sw * 0.75, 310, 5], [sw * 0.55, 40, 4]]} />
      </View>
      <Rise i={3} style={{ alignItems: 'center', marginTop: 4 }}>
        <Text style={t.step}>{pad(SI(next) + 1)} / 07</Text>
        <Text style={[t.h1, { fontSize: 28 }]}>{st.t}</Text>
        <Text style={[t.p, { marginTop: 4, textAlign: 'center' }]}>{st.s}.</Text>
      </Rise>
      {summary ? <Rise i={4} style={{ marginTop: 10 }}>{summary}</Rise> : null}
      <Spacer />
      <Btn onPress={onGo} />
    </Page>
  )
}

const FaceZones = () => {
  const { F, W, P, set, go } = useOb()
  const [on, setOn] = useState(P.faceZones)
  const fw = W - 44
  const fh = fw * 1374 / 1145
  const tap = z => {
    setOn(on.includes(z) ? on.filter(x => x !== z) : [...on, z])
  }
  return (
    <Page>
      <Head z="face" q="Where do you notice the most changes?" h="Tap the zones on the face." />
      <Rise i={1} style={[styles.fz, { width: fw, height: fh }]}>
        <Image source={IMG.faceZones} style={{ position: 'absolute', left: 0, top: 0, width: fw, height: fh }} resizeMode="cover" />
        <Svg style={StyleSheet.absoluteFill} width={fw} height={fh} viewBox="0 0 1145 1374">
          <Defs><RadialGradient id="zg"><Stop offset="0" stopColor="#F2A5C4" stopOpacity="0.75" /><Stop offset="0.6" stopColor="#F2A5C4" stopOpacity="0.45" /><Stop offset="1" stopColor="#F2A5C4" stopOpacity="0" /></RadialGradient></Defs>
          {ZONES.filter(z => on.includes(z)).flatMap(z => z.e.map(([cx, cy, rx, ry], i) => <Ellipse key={z.v + i} cx={cx} cy={cy} rx={rx * 1.2} ry={ry * 1.2} fill="url(#zg)" />))}
        </Svg>
        {/* Tap the face itself: each zone is a touch area; a picked zone glows and shows its name. */}
        {ZONES.flatMap(z => z.e.map(([cx, cy, rx, ry], i) => (
          <Pressable key={z.v + i} onPress={() => tap(z)} accessibilityLabel={z.t} accessibilityState={{ selected: on.includes(z) }}
            style={{ position: 'absolute', left: (cx - rx) / 1145 * fw, top: (cy - ry) / 1374 * fh, width: 2 * rx / 1145 * fw, height: 2 * ry / 1374 * fh, borderRadius: 999 }} />
        )))}
        {ZONES.filter(z => on.includes(z)).map(z => (
          <View key={z.v} pointerEvents="none" style={[styles.zp, { left: z.x / 1145 * fw, top: z.y / 1374 * fh, backgroundColor: C.mauve2, borderColor: C.mauve2 }]}>
            <Text style={[F.s, { fontSize: 12.5, color: '#fff' }]}>{z.t}</Text>
          </View>
        ))}
      </Rise>
      <View style={{ height: 16 }} />
      <Btn disabled={!on.length} onPress={() => { set({ faceZones: on }); go('face') }} />
    </Page>
  )
}

const Tone = () => {
  const { P, set, go, say } = useOb()
  const [on, setOn] = useState(P.tone ?? null)
  const pick = i => {
    setOn(i)
    say(i >= 3 ? 'Noted: sunscreens with no white cast, and gentle care for dark spots.' : 'Noted: we\'ll adapt your sun protection.')
    setTimeout(() => { set({ tone: i }); go('skinDone') }, 1100)
  }
  return (
    <Page>
      <Head z="skin" q="Which one is closest to your skin?" h="To suggest a sunscreen with no white cast, and gentle care for dark spots." />
      <View style={styles.sw}>
        {TONES.map((c, i) => (
          <Rise key={c} i={i + 1} style={{ width: '33.3%', alignItems: 'center', marginBottom: 18 }}>
            <Pressable onPress={() => pick(i)} style={[styles.swatch, { backgroundColor: c }, on === i && styles.swatchOn]} accessibilityLabel={`Skin tone ${i + 1}`} />
          </Rise>
        ))}
      </View>
      <Spacer />
    </Page>
  )
}

// Lifestyle as glass cards with an icon, like the mockup: tap the ones that fit.
const LifeCards = () => {
  const { F, W, P, set, go, say } = useOb()
  const [on, setOn] = useState(P.lifeYes ? LIFE_CARDS.filter((c, i) => c.none ? !P.lifeYes.some(Boolean) : P.lifeYes[i]) : [])
  const cw = (W - 44 - 12) / 2
  const tap = c => {
    Haptics.selectionAsync().catch(() => {})
    if (c.none) return setOn(on.includes(c) ? [] : [c])
    const next = on.includes(c) ? on.filter(x => x !== c) : [...on.filter(x => !x.none), c]
    if (!on.includes(c) && c.say) say(c.say)
    setOn(next)
  }
  return (
    <Page>
      <Head z="life" q="How would you describe your days?" h="Tap all that apply." />
      <View style={styles.grid}>
        {LIFE_CARDS.map((c, i) => {
          const sel = on.includes(c)
          return (
            <Rise key={c.t} i={i + 1}>
              <Pressable onPress={() => tap(c)} style={[styles.lifeCard, { width: cw }, sel && styles.pcOn]}>
                <View style={[styles.gc, { width: 38, height: 38 }]}><LineIcon name={c.ic} size={20} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[F.s, { fontSize: 14, color: C.ink }]}>{c.t}</Text>
                  <Text style={[F.r, { fontSize: 11.5, lineHeight: 15, color: C.soft }]}>{c.s}</Text>
                </View>
                <Tick on={sel} />
              </Pressable>
            </Rise>
          )
        })}
      </View>
      <Spacer />
      <Btn disabled={!on.length} onPress={() => { set({ lifeYes: LIFE_CARDS.filter(c => !c.none).map(c => on.includes(c)) }); go('lifeDone') }} />
    </Page>
  )
}

// The concerns behind her picks, each with the photo she tapped first.
const CONCERN_LABEL = { ...Object.fromEntries(QUESTIONS.find(q => q.id === 'priority').options.map(o => [o.value, o.label])), Acne: 'Breakouts' }
const concernsOf = picks => {
  const out = []
  for (const o of picks) {
    const c = getIssue(o.id)?.concern
    if (c && !out.some(x => x.c === c)) out.push({ c, t: CONCERN_LABEL[c] || c, img: o.img })
  }
  return out
}

// What we spotted, and what matters most (Lita, 2026-10-27): she ranks her
// main concern (and a second one when she has 3 or more). They lead the
// product verdicts, Rekod, the next buy and the week review.
const Spotted = () => {
  const { F, W, P, set, go } = useOb()
  const concerns = concernsOf([...P.face, ...P.eyes, ...P.lips, ...P.neck])
  const needs = concerns.length >= 3 ? 2 : 1
  const [rank, setRank] = useState([P.priority, P.secondary].filter(c => concerns.some(x => x.c === c)))
  const cw = (W - 44 - 12) / 2
  const tap = c => {
    Haptics.selectionAsync().catch(() => {})
    if (rank.includes(c)) return setRank(rank.filter(x => x !== c))
    if (rank.length < needs) setRank([...rank, c])
    else setRank([...rank.slice(0, needs - 1), c])
  }
  const q = rank.length === 0 || needs === 1 ? 'What matters most to you right now?' : 'And second?'
  return (
    <Page>
      <Head z="life" q={q} h={`We spotted ${concerns.length} things to track. Your choice leads every recommendation, and you can change it anytime.`} />
      <View style={styles.grid}>
        {concerns.map((x, i) => {
          const n = rank.indexOf(x.c)
          return (
            <Rise key={x.c} i={i + 1}>
              <Pressable onPress={() => tap(x.c)} style={({ pressed }) => [styles.pc, { width: cw }, n >= 0 && styles.pcOn, pressed && { transform: [{ scale: 0.97 }] }]}>
                <View style={{ width: '100%', height: cw / 1.3 }}>
                  <Image source={CARD[x.img]} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <Image source={IMG.cardFade} style={{ position: 'absolute', left: 0, right: 0, bottom: -3, height: '62%', width: '100%' }} resizeMode="stretch" />
                </View>
                <View style={{ padding: 10, paddingTop: 0, marginTop: -26 }}>
                  <Text style={[F.s, styles.pcT]}>{x.t}</Text>
                </View>
                {n >= 0 ? <View style={styles.rankBadge}><Text style={[F.b, { color: '#fff', fontSize: 13 }]}>{n + 1}</Text></View> : <Tick on={false} />}
              </Pressable>
            </Rise>
          )
        })}
      </View>
      <Spacer />
      <Btn disabled={rank.length < needs} onPress={() => { set({ priority: rank[0], secondary: rank[1] || null }); go('sleep') }} />
    </Page>
  )
}

const Sleep = () => {
  const { F, P, set, go, say } = useOb()
  const [h, setH] = useState(P.sleep ?? 7)
  const pick = v => {
    setH(v)
    Haptics.selectionAsync().catch(() => {})
    say(v < 6 ? 'A bit short. Your skin repairs mostly at night.' : v <= 8 ? 'Perfect for your skin.' : 'A lovely night, your skin loves it.')
  }
  return (
    <Page>
      <Head z="life" q="How many hours do you sleep?" h="On a normal night." />
      <Rise i={1}><Text style={[F.s, { fontSize: 44, textAlign: 'center', color: C.mauve, marginTop: 30, letterSpacing: -1 }]}>{h} h</Text></Rise>
      <Rise i={2} style={styles.hours}>
        {[4, 5, 6, 7, 8, 9, 10].map(v => (
          <Pressable key={v} onPress={() => pick(v)} style={[styles.hour, h === v && { backgroundColor: C.mauve2, borderColor: C.mauve2 }]}>
            <Text style={[F.s, { fontSize: 14, color: h === v ? '#fff' : C.soft }]}>{v}</Text>
          </Pressable>
        ))}
      </Rise>
      <Spacer />
      <Btn onPress={() => { set({ sleep: h }); go('life') }} />
    </Page>
  )
}

const Safety = () => {
  const { F, P, set, go, say, health, setHealth, mode } = useOb()
  const t = useType()
  const items = SAFETY.filter(x => x.k !== 'preg' || P.sex !== 'man')
  const [open, setOpen] = useState({ preg: !!P.preg?.length, avoid: !!P.avoid?.length, conditions: !!P.conditions?.length, meds: !!P.meds?.length })
  const [picked, setPicked] = useState({ preg: P.preg || [], avoid: P.avoid || [], conditions: P.conditions || [], meds: P.meds || [] })
  const [other, setOther] = useState(P.avoidOther || '')
  const [otherErr, setOtherErr] = useState(false)
  // When she uses each prescribed cream, as her doctor said: it becomes a step of her routine.
  const [rxPlan, setRxPlan] = useState(P.rxPlan || {})
  const [medsOther, setMedsOther] = useState(P.medsOther || '')
  const [rxErr, setRxErr] = useState(false)
  const [retinolOk, setRetinolOk] = useState(!!P.retinolOk)
  const planOf = id => rxPlan[id] || {}
  const setPlan = (id, change) => { setRxPlan({ ...rxPlan, [id]: { ...planOf(id), ...change } }); setRxErr(false) }
  // Product preferences: not health data, so always here (Lita, 2026-10-27).
  const [prefsOn, setPrefsOn] = useState(!!P.prefs?.length)
  const [prefs, setPrefs] = useState(P.prefs || [])
  const toggle = (k, v, one) => {
    const list = picked[k]
    setPicked({ ...picked, [k]: list.includes(v) ? list.filter(x => x !== v) : one ? [v] : [...list, v] })
    if (v === 'Other' && !list.includes(v)) say('Type the ingredient: we\'ll keep it out of all your advice.')
    if (k === 'meds' && isTopicalRx(v) && !list.includes(v)) say('Tell us when your doctor said to use it: it goes in your routine.', 'calm')
  }
  const done = () => {
    const pick = k => (health && open[k] ? picked[k] : [])
    if (pick('avoid').includes('Other') && !other.trim()) {
      setOtherErr(true)
      return say('Tell us which ingredient, or we can\'t avoid it.', 'curious')
    }
    const creams = pick('meds').filter(isTopicalRx)
    if (creams.some(id => !planDone(rxPlan[id])) || (creams.includes('rx_other') && !medsOther.trim())) {
      setRxErr(true)
      return say('Tell us when you use your treatment, so it fits in your routine.', 'curious')
    }
    set({
      preg: pick('preg'), avoid: pick('avoid'), conditions: pick('conditions'), meds: pick('meds'), avoidOther: other.trim(), prefs: prefsOn ? prefs : [],
      rxPlan: Object.fromEntries(creams.map(id => [id, rxPlan[id]])),
      medsOther: creams.includes('rx_other') ? medsOther.trim() : '',
      retinolOk: pick('conditions').some(c => RETINOL_ASK.includes(c)) && retinolOk,
    })
    go('last')
  }
  return (
    <Page>
      <Head z="safety" q="Does any of this apply to you?" h="You can change all of this later." />
      {!health ? (
        <Rise i={1} style={[styles.tg, { marginTop: 18 }]}>
          <Pressable onPress={() => setHealth(true)} style={styles.tgHd} accessibilityRole="switch" accessibilityState={{ checked: false }}>
            <View style={[styles.gc, { width: 40, height: 40 }]}><LineIcon name="shield" size={20} /></View>
            <Text style={[F.m, { flex: 1, fontSize: 14, lineHeight: 19, color: C.ink }]}>To ask about pregnancy, allergies, skin conditions and treatments, we need your OK to use this sensitive information.</Text>
            <View style={styles.toggle}><View style={styles.knob} /></View>
          </Pressable>
        </Rise>
      ) : (
        <View style={{ gap: 10, marginTop: 18 }}>
          {items.map((x, i) => (
            <Rise key={x.k} i={i + 1} style={styles.tg}>
              <Pressable onPress={() => { const on = !open[x.k]; setOpen({ ...open, [x.k]: on }); if (on) say('Thank you. Tell us which one, we\'ll be very careful.', 'calm') }}
                style={styles.tgHd} accessibilityRole="switch" accessibilityState={{ checked: !!open[x.k] }}>
                <View style={[styles.gc, { width: 40, height: 40 }]}><LineIcon name={x.i} size={21} /></View>
                <Text style={[F.m, { flex: 1, fontSize: 14.5, color: C.ink }]}>{x.t}</Text>
                <View style={[styles.toggle, open[x.k] && { backgroundColor: C.mauve2 }]}><View style={[styles.knob, open[x.k] && { left: 21 }]} /></View>
              </Pressable>
              {open[x.k] ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={t.hint}>{x.q}</Text>
                  {(x.groups || [[null, x.o.map(([v]) => v)]]).map(([title, ids]) => (
                    <View key={title || 'all'}>
                      {title ? <Text style={[F.m, styles.rxGroup]}>{title}</Text> : null}
                      <View style={styles.chipsel}>
                        {x.o.filter(([v]) => ids.includes(v)).map(([v, label]) => {
                          const on = picked[x.k].includes(v)
                          return (
                            <Pressable key={v} onPress={() => toggle(x.k, v, x.one)} style={[styles.chip, on && { backgroundColor: C.mauve2, borderColor: C.mauve2 }]}>
                              <Text style={[F.m, { fontSize: 12.5, color: on ? '#fff' : C.ink }]}>{label}</Text>
                            </Pressable>
                          )
                        })}
                      </View>
                    </View>
                  ))}
                  {x.k === 'conditions' && picked.conditions.some(c => RETINOL_ASK.includes(c)) ? (
                    <Pressable onPress={() => setRetinolOk(!retinolOk)} style={[styles.rxOk]} accessibilityRole="checkbox" accessibilityState={{ checked: retinolOk }}>
                      <View style={[styles.rxBox, retinolOk && { backgroundColor: C.mauve2, borderColor: C.mauve2 }]}>{retinolOk ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}</View>
                      <Text style={[F.r, { flex: 1, fontSize: 12.5, lineHeight: 17, color: C.ink }]}>My dermatologist said retinol is OK for my skin</Text>
                    </Pressable>
                  ) : null}
                  {x.k === 'meds' ? picked.meds.filter(isTopicalRx).map(id => {
                    const p = planOf(id)
                    const missing = rxErr && (!planDone(p) || (id === 'rx_other' && !medsOther.trim()))
                    const chip = (key, on, label, onPress) => (
                      <Pressable key={key} onPress={onPress} style={[styles.chip, styles.rxChip, on && { backgroundColor: C.mauve2, borderColor: C.mauve2 }]}>
                        <Text style={[F.m, { fontSize: 12, color: on ? '#fff' : C.ink }]}>{label}</Text>
                      </Pressable>
                    )
                    return (
                      <View key={id} style={[styles.rxCard, missing && { borderColor: '#C0577A' }]}>
                        <Text style={[F.s, { fontSize: 13, color: C.ink }]}>{x.o.find(o => o[0] === id)?.[1]}</Text>
                        {id === 'rx_other' ? (
                          <TextInput value={medsOther} onChangeText={v => { setMedsOther(v); setRxErr(false) }} placeholder="Its name (e.g. a cortisone cream)" placeholderTextColor={C.mute}
                            style={[F.r, styles.other, { marginTop: 8 }]} />
                        ) : null}
                        <Text style={[t.hint, { marginTop: 8 }]}>When do you use it?</Text>
                        <View style={styles.chipsel}>
                          {[['morning', 'Morning'], ['evening', 'Evening'], ['both', 'Morning and evening']].map(([v, label]) => chip(v, p.when === v, label, () => setPlan(id, { when: v })))}
                        </View>
                        <View style={[styles.chipsel, { marginTop: 6 }]}>
                          {chip('every', !!p.every, 'Every day', () => setPlan(id, { every: true, days: [] }))}
                          {chip('some', p.every === false, 'Some days', () => setPlan(id, { every: false }))}
                        </View>
                        {p.every === false ? (
                          <View style={[styles.chipsel, { marginTop: 6 }]}>
                            {WEEK.map(([d, letter]) => {
                              const on = (p.days || []).includes(d)
                              return chip(d, on, letter, () => setPlan(id, { days: on ? p.days.filter(x => x !== d) : [...(p.days || []), d] }))
                            })}
                          </View>
                        ) : null}
                      </View>
                    )
                  }) : null}
                  {x.k === 'meds' && picked.preg.length && open.preg && picked.meds.some(isRetinoidRx) ? (
                    <Text style={[F.m, { fontSize: 12.5, lineHeight: 17, color: '#C0577A', marginTop: 10 }]}>Retinoid treatments aren't recommended during pregnancy or breastfeeding: talk to your doctor as soon as you can.</Text>
                  ) : null}
                  {x.k === 'avoid' && picked.avoid.includes('Other') ? (
                    <TextInput value={other} onChangeText={v => { setOther(v); setOtherErr(false) }} placeholder="Which ingredient? (e.g. niacinamide)" placeholderTextColor={C.mute} autoFocus
                      style={[F.r, styles.other, otherErr && { borderColor: '#C0577A' }]} />
                  ) : null}
                </View>
              ) : null}
            </Rise>
          ))}
        </View>
      )}
      <Rise i={6} style={[styles.tg, { marginTop: 10 }]}>
        <Pressable onPress={() => setPrefsOn(!prefsOn)} style={styles.tgHd} accessibilityRole="switch" accessibilityState={{ checked: prefsOn }}>
          <View style={[styles.gc, { width: 40, height: 40 }]}><LineIcon name="leaf" size={21} /></View>
          <Text style={[F.m, { flex: 1, fontSize: 14.5, color: C.ink }]}>Product preferences</Text>
          <View style={[styles.toggle, prefsOn && { backgroundColor: C.mauve2 }]}><View style={[styles.knob, prefsOn && { left: 21 }]} /></View>
        </Pressable>
        {prefsOn ? (
          <View style={[styles.chipsel, { marginTop: 12 }]}>
            {[['fragrance_free', 'Fragrance-free'], ['vegan', 'Vegan']].map(([v, label]) => {
              const on = prefs.includes(v)
              return (
                <Pressable key={v} onPress={() => setPrefs(on ? prefs.filter(x => x !== v) : [...prefs, v])} style={[styles.chip, on && { backgroundColor: C.mauve2, borderColor: C.mauve2 }]}>
                  <Text style={[F.m, { fontSize: 12.5, color: on ? '#fff' : C.ink }]}>{label}</Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}
      </Rise>
      <Spacer />
      <Btn title={mode ? 'Save' : 'Build my profile'} onPress={done} />
    </Page>
  )
}

const Last = () => {
  const { F, H, nm, go } = useOb()
  const t = useType()
  const [unlocked, setUnlocked] = useState(false)
  const spin = useRef(new Animated.Value(0)).current
  const h = 0.46 * H
  const unlock = () => {
    if (unlocked) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    setUnlocked(true)
    Animated.sequence([
      Animated.timing(spin, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(spin, { toValue: 0, friction: 4, useNativeDriver: true }),
    ]).start()
    setTimeout(() => go('build', {}, { push: false }), 900)
  }
  return (
    <View style={{ flex: 1 }}>
      <Hero source={IMG.introProfile} height={h} fade={IMG.fadeProfile} />
      <Page>
        <Bar onPhoto />
        <View style={{ height: h * 0.42 }} />
        <Rise><Text style={t.step}>07 / 07</Text><Text style={t.h1}>Your Profile</Text><Text style={t.p}>We're almost there{nm}! We'll now create your personalized Skyn Profile based on your answers.</Text></Rise>
        <Rise i={1} style={styles.cl}>
          {STEPS.map(s => (
            <View key={s.z} style={styles.it}>
              <LineIcon name={s.i} size={17} />
              <Text style={[F.r, { flex: 1, fontSize: 13.5, color: C.ink }]}>{s.t}</Text>
              <Ionicons name="checkmark" size={16} color={C.mauve2} />
            </View>
          ))}
          <View style={[styles.it, { borderBottomWidth: 0 }]}>
            <Animated.View style={{ transform: [{ scale: spin.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }, { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-12deg'] }) }] }}>
              <LineIcon name={unlocked ? 'unlock' : 'lock'} size={20} color={unlocked ? C.mauve : C.mauve2} />
            </Animated.View>
            <Text style={[unlocked ? F.s : F.r, { flex: 1, fontSize: 13.5, color: unlocked ? C.mauve : C.ink }]}>Your Profile</Text>
            {unlocked ? <Ionicons name="checkmark" size={16} color={C.mauve2} /> : <View style={styles.oc} />}
          </View>
        </Rise>
        <Spacer />
        <Btn title="Unlock my profile" onPress={unlock} />
      </Page>
    </View>
  )
}

const Build = () => {
  const { F, go } = useOb()
  const t = useType()
  const [pc, setPc] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setPc(v => Math.min(100, v + 1)), 28)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (pc < 100) return
    const id = setTimeout(() => go('final', {}, { push: false }), 300)
    return () => clearTimeout(id)
  }, [pc])
  const msgs = ['Reading your skin…', 'Checking our products…', 'Finding what helps you…', 'Your plan is coming together…']
  return (
    <Page>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Svg width={150} height={150} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
            <Circle cx="50" cy="50" r="44" fill="none" stroke={C.line} strokeWidth={5} />
            <Circle cx="50" cy="50" r="44" fill="none" stroke={C.mauve2} strokeWidth={5} strokeLinecap="round" strokeDasharray="277" strokeDashoffset={277 - 277 * pc / 100} transform="rotate(-90 50 50)" />
          </Svg>
          <Text style={[F.s, { fontSize: 30, color: C.mauve }]}>{pc}%</Text>
        </View>
        <Text style={t.h2}>Preparing everything</Text>
        <Text style={[t.p, { textAlign: 'center' }]}>{msgs[Math.min(3, Math.floor(pc / 26))]}</Text>
      </View>
    </Page>
  )
}

const Final = () => {
  const { F, W, P, nm, answersOf, health, go } = useOb()
  const t = useType()
  const a = answersOf()
  const type = computeSkinType(a)
  const issues = [...P.face, ...P.eyes, ...P.lips, ...P.neck].map(o => o.t)
  const low = s => s.charAt(0).toLowerCase() + s.slice(1)
  const care = [
    ...(a.pregnancy && a.pregnancy !== 'no' ? [a.pregnancy === 'pregnant' ? 'Pregnancy' : 'Breastfeeding'] : []),
    ...a.conditions,
    ...a.meds.map(m => (m === 'rx_other' && a.medsOther ? a.medsOther : SAFETY.find(x => x.k === 'meds').o.find(o => o[0] === m)?.[1])).filter(Boolean),
  ]
  const choose = [
    // Each line matches a rule in the product verdicts (utils/ingredients-guide.js LIFE_BONUS).
    ...(P.age != null ? [['Gentle essentials', 'Prevention', 'Glow & fine lines', 'Firmness & comfort', 'Firmness & comfort'][P.age]] : []),
    ...(['during', 'after'].includes(P.meno) && health ? ['Well-nourished skin'] : []),
    ...(P.tone >= 3 ? ['SPF with no white cast', 'Gentle care for dark spots'] : []),
    ...(P.lifeYes?.[2] ? ['High sun protection'] : []),
    ...(P.lifeYes?.[3] ? ['Light textures'] : []),
  ]
  const sec = [
    ['sparkles', 'Your goals', P.goals.map(g => g.t)],
    ['sun', 'Your skin', type ? [`${type} skin${a.reactivity === 'often' ? ', sensitive' : ''}`] : []],
    ['sparkles', 'Your priority', [P.priority, P.secondary].filter(Boolean).map((c, n) => `${n + 1}. ${CONCERN_LABEL[c] || c}`)],
    ['eye', 'What we\'ll track', issues.length > 3 ? [...issues.slice(0, 3), `+ ${issues.length - 3} more`] : issues],
    ['ban-outline', 'What we avoid for you', [...a.avoid.map(x => `No ${low(x)}`), ...a.prefs.map(x => ({ fragrance_free: 'Fragrance-free', vegan: 'Vegan only' })[x])]],
    ['heart', 'We take care with', care],
    ['color-wand-outline', 'We choose for you', choose],
  ].filter(x => x[2].length)
  const share = () => Share.share({ message: `My Skyn Profile on Skynkod ✨\n${sec.map(([, k, v]) => `${k}: ${v.join(', ')}`).join('\n')}` }).catch(() => {})
  const cw = Math.min(W - 70, 290)
  return (
    <Page>
      <Bar />
      <Rise style={{ alignItems: 'center' }}>
        <Text style={[t.h1, { textAlign: 'center' }]}>All set{nm}! ✨</Text>
        <Text style={[t.p, { textAlign: 'center', marginTop: 6 }]}>Your Skyn Profile is ready.</Text>
      </Rise>
      <Pop delay={100} style={{ width: cw, height: cw, alignSelf: 'center', marginTop: 14, marginBottom: 4 }}>
        <Image source={IMG.cards} style={{ width: cw, height: cw }} resizeMode="contain" />
        <Text style={[F.s, styles.cardLabel, { left: cw * 0.31, right: cw * 0.03, top: cw * 0.69 }]}>YOUR SKYN PROFILE</Text>
      </Pop>
      {/* One glass card with a line per section, like the mockup, filled with her answers. */}
      <Rise i={3} style={styles.list}>
        {sec.map(([icon, label, list], i) => (
          <View key={label} style={[styles.listRow, i === sec.length - 1 && { borderBottomWidth: 0 }]}>
            <LineIcon name={icon} size={22} />
            <View style={{ flex: 1 }}>
              <Text style={[F.s, { fontSize: 14.5, color: C.ink }]}>{label}</Text>
              <Text style={[F.r, { fontSize: 12.5, lineHeight: 17, color: C.soft, marginTop: 1 }]}>{list.join(' · ')}</Text>
            </View>
          </View>
        ))}
      </Rise>
      <View style={{ height: 16 }} />
      <Btn title="See my results" onPress={() => go('notify')} />
      <Ghost title="Share my profile" icon="share-outline" onPress={share} />
    </Page>
  )
}

// Reminders, right after her profile (Lita, 2026-10-27): Koda, what a reminder
// looks like, her two times (same steps and ranges as Settings), then iOS asks.
const TIME_ROWS = [
  { key: 'morningTime', title: 'Morning check-in', s: 'How is your skin today? Then your routine.', icon: 'sun', range: [5 * 60, 11 * 60] },
  { key: 'eveningTime', title: 'Evening routine', s: 'Cleanse, then your evening routine.', icon: 'moon-outline', range: [18 * 60, 23 * 60 + 30] },
]
const toMin = text => { const [h, m] = String(text).split(':').map(Number); return h * 60 + m }
const toText = min => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
const Notify = () => {
  const { F, W, userId, finish, saving } = useOb()
  const t = useType()
  const [times, setTimes] = useState(DEFAULT_TIMES)
  const shift = (row, step) => {
    Haptics.selectionAsync().catch(() => {})
    setTimes({ ...times, [row.key]: toText(Math.min(row.range[1], Math.max(row.range[0], toMin(times[row.key]) + step))) })
  }
  const save = async (on) => {
    if (userId) {
      const key = `notifications_${userId}`
      const prev = JSON.parse((await AsyncStorage.getItem(key).catch(() => null)) || '{}')
      await AsyncStorage.setItem(key, JSON.stringify({ ...prev, ...times })).catch(() => {})
      if (!on) await AsyncStorage.setItem(`skynkod_notif_later_${userId}`, '1').catch(() => {})
    }
    if (on) await requestNotificationPermissions().catch(() => {})
    finish(true, { offerPremium: true })
  }
  return (
    <Page>
      <Bar noBack />
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <Float><Image source={KODA.happy} style={{ width: 84, height: 84 }} resizeMode="contain" /></Float>
        <Rise i={1} style={[styles.notif, { width: W - 44 }]}>
          <View style={styles.notifIcon}><Image source={IMG.sun} style={{ width: 24, height: 24 }} resizeMode="contain" /></View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[F.s, { fontSize: 11, letterSpacing: 0.6, color: C.soft }]}>SKYNKOD</Text>
              <Text style={[F.r, { fontSize: 11, color: C.mute }]}>now</Text>
            </View>
            <Text style={[F.s, { fontSize: 14, color: C.ink, marginTop: 2 }]}>Evening routine</Text>
            <Text style={[F.r, { fontSize: 13, color: C.soft }]}>Cleanse, then your evening routine.</Text>
          </View>
        </Rise>
      </View>
      <Rise i={2} style={{ marginTop: 22 }}>
        <Text style={[t.h2, { textAlign: 'center' }]}>A gentle reminder, morning and evening?</Text>
        <Text style={[t.hint, { textAlign: 'center' }]}>Tap the times that fit your day.</Text>
      </Rise>
      <Rise i={3} style={[styles.list, { marginTop: 16 }]}>
        {TIME_ROWS.map((row, i) => (
          <View key={row.key} style={[styles.listRow, i === TIME_ROWS.length - 1 && { borderBottomWidth: 0 }]}>
            <LineIcon name={row.icon} size={22} />
            <View style={{ flex: 1 }}>
              <Text style={[F.s, { fontSize: 14.5, color: C.ink }]}>{row.title}</Text>
              <Text style={[F.r, { fontSize: 12, color: C.soft }]}>{row.s}</Text>
            </View>
            <Pressable onPress={() => shift(row, -30)} hitSlop={8} accessibilityLabel="Earlier"><Ionicons name="chevron-back" size={18} color={C.mauve2} /></Pressable>
            <Text style={[F.s, { fontSize: 15, color: C.ink, minWidth: 48, textAlign: 'center' }]}>{times[row.key]}</Text>
            <Pressable onPress={() => shift(row, 30)} hitSlop={8} accessibilityLabel="Later"><Ionicons name="chevron-forward" size={18} color={C.mauve2} /></Pressable>
          </View>
        ))}
      </Rise>
      <Rise i={4}><Text style={[t.hint, { textAlign: 'center', marginTop: 12 }]}>If your evening routine isn't ticked by 21:00, one gentle nudge. Plus a water reminder in the afternoon. You can change everything in Settings.</Text></Rise>
      <Spacer />
      <Btn title="Turn on reminders" disabled={saving} onPress={() => save(true)} />
      <Ghost title="Not now" onPress={() => save(false)} />
    </Page>
  )
}

// Under 18: a kind page with a few articles to read (the account is deleted).
const Minor = ({ onLeave }) => {
  const { F, insets } = useOb()
  const t = useType()
  const [article, setArticle] = useState(null)
  const reads = [...articlesIn('basics'), ...articlesIn('myths')]
  const open = reads.find(a => a.id === article)
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}>
      <View style={styles.bar}>
        {open ? <Pressable onPress={() => setArticle(null)} hitSlop={12}><Ionicons name="arrow-back" size={22} color={C.ink} /></Pressable> : null}
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => onLeave?.()} hitSlop={12}><Text style={[F.s, { color: C.mauve2 }]}>Close</Text></Pressable>
      </View>
      {open ? (
        <>
          <Text style={t.h1}>{open.title}</Text>
          <ArticleBody article={open} />
        </>
      ) : (
        <>
          <Image source={KODA.calm} style={{ width: 120, height: 120, alignSelf: 'center' }} resizeMode="contain" />
          <Text style={[t.h2, { textAlign: 'center', marginTop: 16 }]}>Skynkod is for adults (18+)</Text>
          <Text style={[t.p, { textAlign: 'center' }]}>Meanwhile, the basics are enough: a gentle cleanser, a moisturizer and sunscreen every morning. For acne, talk to a doctor or a dermatologist.</Text>
          <View style={{ marginTop: 22, gap: 10 }}>
            {reads.map(a => (
              <Pressable key={a.id} onPress={() => setArticle(a.id)} style={styles.row}>
                <Ionicons name={a.icon} size={18} color={C.mauve2} />
                <Text style={[F.m, { flex: 1, fontSize: 14.5, color: C.ink }]}>{a.title}</Text>
                <Ionicons name="chevron-forward" size={16} color={C.mute} />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  )
}

// mode (My Skyn Profile): { chapters, answers, row, onDone(answers, health), onCancel }
export default function OnboardingScreen({ userId, onComplete, onLeave, mode }) {
  const insets = useSafeAreaInsets()
  const { width: W, height: H } = useWindowDimensions()
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold })
  const F = fontsLoaded
    ? { r: { fontFamily: 'Inter_400Regular' }, m: { fontFamily: 'Inter_500Medium' }, s: { fontFamily: 'Inter_600SemiBold' }, b: { fontFamily: 'Inter_700Bold' } }
    : { r: {}, m: { fontWeight: '500' }, s: { fontWeight: '600' }, b: { fontWeight: '700' } }

  // The screen shown, with a back stack.
  const devStart = __DEV__ && Platform.OS === 'web' ? new URLSearchParams(globalThis.location?.search || '').get('onboarding') : null
  const startOf = (chapter, picks) => (chapter === 'life' && concernsOf([...picks.face, ...picks.eyes, ...picks.lips, ...picks.neck]).length >= 2 ? 'spotted' : CHAPTER_START[chapter])
  const [cur, setCur] = useState(() => (mode
    ? { id: startOf(mode.chapters[0], { face: [], eyes: [], lips: [], neck: [], ...fromAnswers(mode.answers, mode.row) }) }
    : devStart && devStart !== '1' ? { id: devStart, ...(devStart === 'family' ? { k: 'acne', queue: ['acne'] } : {}) } : { id: 'welcome' }))
  const curRef = useRef(cur)
  curRef.current = cur
  const hist = useRef([])
  const step = (id, params = {}, { push = true } = {}) => {
    if (push) hist.current.push(curRef.current)
    setCur({ id, ...params })
    track('onboarding_step', { step: id })
  }
  // In My Skyn Profile, the end of a step opens the next chosen one, or saves.
  const [done, setDone] = useState(false)
  const endOnSleep = useRef(false)
  const go = (id, params = {}, opts) => {
    if (!mode) return step(id, params, opts)
    const ended = CHAPTER_END[id] || (id === 'sleep' && (mode.chapters[0] === 'priority' || endOnSleep.current) ? 'priority' : null)
    if (!ended) return step(id, params, opts)
    const i = mode.chapters.indexOf(ended)
    if (i >= 0 && i < mode.chapters.length - 1) return step(startOf(mode.chapters[i + 1], P))
    setDone(true)
  }
  const back = () => {
    const prev = hist.current.pop()
    if (prev) setCur(prev)
    else if (mode) mode.onCancel?.()
  }

  // Her answers (saved with the app's keys at the end).
  // Dev web preview only: ?onboarding=<screen> opens it filled with sample answers.
  const demo = devStart && devStart !== '1' ? {
    name: 'Lina', goals: [GOALS[0], GOALS[1]], sex: 'woman', age: 1, feel: 'combo', shine: 'tzone', pores: 'nose', skinYes: [true, false, false], tone: 2,
    faceZones: [ZONES[0], ZONES[1]], face: [DETAILS.acne[1][0], DETAILS.acne[1][1], DETAILS.spots[1][0]], eyes: [EYES[0], EYES[3]], lips: [LIPS[0]], neck: [], sleep: 6, lifeYes: [true, true, false, false],
  } : {}
  const [P, setP] = useState(() => ({ goals: [], faceZones: [], face: [], eyes: [], lips: [], neck: [], ...(mode ? fromAnswers(mode.answers, mode.row) : demo) }))
  const set = patch => setP(prev => ({ ...prev, ...patch }))
  const [terms, setTerms] = useState(false)
  const [health, setHealth] = useState(!!mode?.row?.consent_health_at)
  const [minor, setMinor] = useState(false)
  const [saving, setSaving] = useState(false)
  const nm = P.name ? `, ${P.name}` : ''

  // Koda's little word above the button.
  const [koda, setKoda] = useState(null)
  const kodaTimer = useRef(null)
  const kodaV = useRef(new Animated.Value(0)).current
  const say = (text, mood = 'happy') => {
    clearTimeout(kodaTimer.current)
    setKoda({ text, mood })
    kodaV.setValue(0)
    Animated.timing(kodaV, { toValue: 1, duration: 300, useNativeDriver: true }).start()
    kodaTimer.current = setTimeout(() => Animated.timing(kodaV, { toValue: 0, duration: 300, useNativeDriver: true }).start(), Math.max(2600, text.length * 55))
  }
  useEffect(() => () => clearTimeout(kodaTimer.current), [])

  // ---------- saving ----------
  const answersOf = () => {
    const issues = [...new Set([...P.face, ...P.eyes, ...P.lips, ...P.neck].map(o => o.id))]
    const zones = P.faceZones.map(z => z.v)
    const hasAcne = P.face.some(o => DETAILS.acne[1].includes(o))
    const otherAvoid = (P.avoidOther || '').trim()
    return {
      goals: P.goals.map(g => g.v),
      sex: P.sex || null,
      ageRange: P.age ?? null,
      menopause: P.meno || null,
      feel: P.feel || null,
      shine: P.shine || null,
      pores: P.pores || null,
      reactivity: P.skinYes ? (P.skinYes[0] ? 'often' : 'rarely') : null,
      sun: P.skinYes ? (P.skinYes[1] ? 'burntan' : 'tan') : null,
      tightAfterShower: P.skinYes ? P.skinYes[2] : null,
      tone: P.tone ?? null,
      faceZones: zones,
      acneWhere: hasAcne ? zones.filter(z => z !== 'nose') : [],
      issues,
      priority: P.priority || null,
      secondary: P.secondary || null,
      eyeDetails: P.eyes.filter(o => o.d).map(o => o.d),
      sleepHours: P.sleep ?? null,
      sleep: P.sleep == null ? null : P.sleep < 6 ? 'short' : P.sleep <= 8 ? 'ok' : 'long',
      stress: P.lifeYes ? (P.lifeYes[0] ? 'high' : 'low') : null,
      makeup: P.lifeYes ? (P.lifeYes[1] ? 'daily' : 'rarely') : null,
      sunTime: P.lifeYes ? (P.lifeYes[2] ? 'high' : 'low') : null,
      sweat: P.lifeYes ? P.lifeYes[3] : null,
      pregnancy: health && P.sex !== 'man' ? (P.preg?.[0] || 'no') : null,
      avoid: health ? (P.avoid || []).flatMap(a => (a === 'Other' ? otherAvoid.split(',').map(x => x.trim()) : [a])).filter(Boolean) : [],
      prefs: P.prefs || [],
      conditions: health ? P.conditions || [] : [],
      meds: health ? P.meds || [] : [],
      rxPlan: health ? P.rxPlan || {} : {},
      medsOther: health ? P.medsOther || '' : '',
      retinolOk: health && (P.conditions || []).some(c => RETINOL_ASK.includes(c)) ? !!P.retinolOk : false,
    }
  }

  useEffect(() => {
    if (!done || !mode) return
    setDone(false)
    const concerns = concernsOf([...P.face, ...P.eyes, ...P.lips, ...P.neck])
    if (!endOnSleep.current && concerns.length >= 2 && !concerns.some(x => x.c === P.priority)) {
      endOnSleep.current = true
      return step('spotted')
    }
    const fresh = { ...answersOf(), ...(concerns.length < 2 ? { priority: concerns[0]?.c || null, secondary: null } : {}) }
    const keys = [...new Set([...mode.chapters, ...(endOnSleep.current ? ['priority'] : [])].flatMap(c => CHAPTER_KEYS[c] || []))]
    mode.onDone({ ...mode.answers, ...Object.fromEntries(keys.map(k => [k, fresh[k]])) }, health)
  }, [done, P])

  // Answers are saved to the profile so routines and Koda can use them; a
  // failed save never blocks the user from getting into the app.
  const finish = async (save, options) => {
    if (saving) return
    setSaving(true)
    try {
      if (save) {
        const answers = answersOf()
        await AsyncStorage.setItem('skynkod_skin_profile', JSON.stringify(answers))
        const first = P.name || null
        if (userId && first) await AsyncStorage.setItem(`skynkod_first_name_${userId}`, first)
        if (userId) {
          const now = new Date().toISOString()
          const saved = await updateUserProfile(userId, {
            first_name: first,
            ...toColumns(answers, health),
            onboarding_complete: true,
            consent_version: CONSENT_VERSION,
            consent_terms_at: terms ? now : null,
            consent_health_at: health ? now : null,
            consent_offers: false,
          })
          if (!saved) await logError('OnboardingScreen_saveProfile', new Error('Profile not saved'), { userId }, 'warn')
          // Her free basic routine, ready on Home from the first evening (Lita, 2026-10-27).
          else await startBasicRoutine(userId).catch(error => logError('OnboardingScreen_basicRoutine', error, { userId }, 'warn'))
        }
      }
      await onComplete(options)
    } catch (error) {
      await logError('OnboardingScreen_finish', error, { step: cur.id }, 'warn')
      await onComplete().catch(() => {})
    }
  }

  const ctx = { F, W, H, insets, P, set, go, back, say, nm, terms, setTerms, health, setHealth, answersOf, finish, saving, userId, mode }

  let content
  switch (cur.id) {
    case 'welcome': content = <Welcome />; break
    case 'name': content = <NameScreen />; break
    case 'consent': content = <Consent />; break
    case 'journey': content = <Journey />; break
    case 'intro': content = <Intro />; break
    case 'goals': content = <PhotoPick z="skin" q="What do you want to change?" h="Up to 3." opts={GOALS} max={3} initial={P.goals} onDone={sel => { set({ goals: sel }); go('you') }} />; break
    case 'you': content = <RowPick z="skin" q="You are…" opts={SEX} onDone={o => { set({ sex: o.v }); go('age') }} />; break
    case 'age': content = (
      <RowPick z="skin" q="How old are you?" h="Your skin changes over the years: we adapt your routine to your age." opts={AGES.map(t => ({ t }))}
        onDone={(o, i) => { say(AGE_SAY[i]); setTimeout(() => { set({ age: i }); go(i >= 3 && P.sex !== 'man' ? 'meno' : 'wash') }, 900) }}
        below={<UnderAge onConfirm={() => { setMinor(true); if (userId) deleteAccount().catch(error => logError('Onboarding_minorDelete', error, {}, 'warn')) }} />} />
    ); break
    case 'meno': content = <RowPick z="skin" q="Where are you with menopause?" h="It changes the skin a lot: drier, thinner, less firm. We adapt your care." opts={MENO} onDone={o => { set({ meno: o.v }); go('wash') }} />; break
    case 'wash': content = <PhotoPick z="skin" q="2 hours after washing, your skin…" h="Think of a normal day." opts={WASH} one onDone={o => { set({ feel: o.v }); go('shine') }} />; break
    case 'shine': content = <RowPick z="skin" q="At midday, your skin shines…" opts={SHINE} onDone={o => { set({ shine: o.v }); go('pores') }} />; break
    case 'pores': content = <RowPick z="skin" q="Your pores, you see them…" opts={PORES} onDone={o => { set({ pores: o.v }); go('react') }} />; break
    case 'react': content = <Statements z="skin" q="A few quick ones" h="Yes or no." items={SKIN_STATEMENTS} reacts={SKIN_SAYS} initial={P.skinYes} onDone={a => { set({ skinYes: a }); go('tone') }} />; break
    case 'tone': content = <Tone />; break
    case 'skinDone': {
      const type = computeSkinType(answersOf())
      content = (
        <Between from="skin" next="face" onGo={() => go('faceZones')} summary={
          <>
            <Summary label="Your skin type" items={type ? [`${type}${P.skinYes?.[0] ? ', sensitive' : ''}`] : []} d={SKIN_WHY[type]} empty={false} />
            <Summary label="Your goals" items={P.goals.map(g => g.t)} empty={false} />
          </>
        } />
      )
      break
    }
    case 'faceZones': content = <FaceZones />; break
    case 'face': content = <YesNo z="face" q="Is anything bothering you on your face?" h="Breakouts, redness, spots, pores, lines…" onDone={y => { if (y) return go('families'); set({ face: [] }); go('faceDone') }} />; break
    case 'families': content = (
      <PhotoPick z="face" q="What bothers you?" h="Pick the families, we'll look at each one in detail." opts={FAMILIES}
        onDone={sel => { set({ face: [] }); if (!sel.length) return go('faceDone'); go('family', { queue: sel.map(x => x.k), k: sel[0].k }) }} />
    ); break
    case 'family': {
      const [title, opts] = DETAILS[cur.k]
      const rest = cur.queue.slice(1)
      content = (
        <PhotoPick key={cur.k} z="face" q={title} h="Select all that apply." opts={opts.filter(o => health || !o.health)}
          onDone={sel => { setP(prev => ({ ...prev, face: [...prev.face.filter(o => !opts.includes(o)), ...sel] })); if (rest.length) go('family', { queue: rest, k: rest[0] }); else go('faceDone') }} />
      )
      break
    }
    case 'faceDone': content = <Between from="face" next="eyes" onGo={() => go('eyes')} summary={<Summary label="You identified" items={[...P.faceZones.map(z => `Zone: ${z.t}`), ...P.face.map(o => o.t)]} />} />; break
    case 'eyes': content = <YesNo z="eyes" q="Anything around your eyes?" h="Dark circles, puffiness, fine lines…" onDone={y => { if (y) return go('eyeTypes'); set({ eyes: [] }); go('eyesDone') }} />; break
    case 'eyeTypes': content = <PhotoPick z="eyes" q="What do you notice?" h="Dark circles don't all have the same cause, so not the same solution." opts={EYES} initial={P.eyes} onDone={sel => { set({ eyes: sel }); go('eyesDone') }} />; break
    case 'eyesDone': content = <Between from="eyes" next="lips" onGo={() => go('lips')} summary={<Summary label="You identified" items={P.eyes.map(o => o.t)} />} />; break
    case 'lips': content = <YesNo z="lips" q="Any concern with your lips?" h="Dry, cracked, darker…" onDone={y => { if (y) return go('lipTypes'); set({ lips: [] }); go('lipsDone') }} />; break
    case 'lipTypes': content = <PhotoPick z="lips" q="Which ones?" h="Select all that apply." opts={LIPS} initial={P.lips} onDone={sel => { set({ lips: sel }); go('lipsDone') }} />; break
    case 'lipsDone': content = <Between from="lips" next="neck" onGo={() => go('neck')} summary={<Summary label="You identified" items={P.lips.map(o => o.t)} />} />; break
    case 'neck': content = <YesNo z="neck" q="Do you notice anything on your neck?" h="Lines, sagging, dryness, dark patches…" onDone={y => { if (y) return go('neckTypes'); set({ neck: [] }); go('neckDone') }} />; break
    case 'neckTypes': content = <PhotoPick z="neck" q="What do you notice?" h="Select all that apply." opts={NECK} initial={P.neck} onDone={sel => { set({ neck: sel }); go('neckDone') }} />; break
    case 'neckDone': content = (
      <Between from="neck" next="life" summary={<Summary label="You identified" items={P.neck.map(o => o.t)} />}
        onGo={() => {
          const concerns = concernsOf([...P.face, ...P.eyes, ...P.lips, ...P.neck])
          if (concerns.length >= 2) return go('spotted')
          set({ priority: concerns[0]?.c || null, secondary: null })
          if (!concerns.length) say('Nothing to report: your skin is doing well!')
          go('sleep')
        }} />
    ); break
    case 'spotted': content = <Spotted />; break
    case 'sleep': content = <Sleep />; break
    case 'life': content = <LifeCards />; break
    case 'lifeDone': content = <Between from="life" next="safety" onGo={() => go('safety')} />; break
    case 'safety': content = <Safety />; break
    case 'last': content = <Last />; break
    case 'build': content = <Build />; break
    case 'final': content = <Final />; break
    case 'notify': content = <Notify />; break
    default: content = <Welcome />
  }

  return (
    <Ob.Provider value={ctx}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Backdrop deep={['skinDone', 'faceDone', 'eyesDone', 'lipsDone', 'neckDone', 'lifeDone', 'final'].includes(cur.id)} />
        {minor ? <Minor onLeave={onLeave} /> : <View key={cur.id + (cur.k || '')} style={{ flex: 1 }}>{content}</View>}
        {koda ? (
          <Animated.View pointerEvents="none" style={[styles.kd, { bottom: insets.bottom + 84, opacity: kodaV, transform: [{ translateY: kodaV.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
            <Image source={KODA[koda.mood] || KODA.happy} style={{ width: 40, height: 40 }} resizeMode="contain" />
            <View style={styles.kdb}><Text style={[F.m, { fontSize: 12.5, lineHeight: 17, color: C.ink }]}>{koda.text}</Text></View>
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </Ob.Provider>
  )
}

const shadow = { shadowColor: '#AA789B', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 }
const glass = { backgroundColor: C.glass, borderWidth: 1.5, borderColor: C.glassLine, borderRadius: 16, ...shadow }

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22, minHeight: 28 },
  segs: { flex: 1, flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 4, borderRadius: 4, backgroundColor: C.line },
  segOn: { backgroundColor: C.mauve2 },
  btn: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', shadowColor: '#86607F', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  btnText: { color: '#fff', fontSize: 15.5 },
  btnArrow: { position: 'absolute', right: 22 },
  ghost: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, marginTop: 6 },
  gc: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(250,236,244,0.85)', borderWidth: 1, borderColor: C.glassLine, ...shadow },
  feats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  pc: { backgroundColor: '#FDF7FA', borderRadius: 16, borderWidth: 1.5, borderColor: 'transparent', overflow: 'hidden', ...shadow },
  pcOn: { borderColor: C.mauve2, shadowOpacity: 0.25 },
  pcT: { fontSize: 13, lineHeight: 16, color: C.ink },
  pcS: { fontSize: 11, lineHeight: 14, color: C.mute, marginTop: 2 },
  rankBadge: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: C.mauve2, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tick: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  rows: { marginTop: 18, gap: 10 },
  row: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  rowOn: { borderColor: C.mauve2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#D9C6D3' },
  yes2: { flexDirection: 'row', gap: 12, paddingTop: 16 },
  no: { ...glass, flex: 1, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  yes: { flex: 1, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...shadow },
  yni: { ...glass, padding: 14, paddingBottom: 12 },
  ynb: { flex: 1, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: C.line, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  inp: { ...glass, marginTop: 22, height: 56, paddingHorizontal: 18, fontSize: 17, color: C.ink },
  cur: { borderRadius: 999, shadowColor: '#E8AACD', shadowOpacity: 0.9, shadowRadius: 13, shadowOffset: { width: 0, height: 0 } },
  hero: { position: 'absolute', left: 0, right: 0, top: 0, overflow: 'hidden' },
  lens: { position: 'absolute', borderWidth: 1.2, borderColor: 'rgba(255,255,255,0.75)', shadowColor: '#fff', shadowOpacity: 0.35, shadowRadius: 9 },
  info: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, marginTop: 18, marginBottom: 14 },
  sum: { ...glass, alignSelf: 'stretch', paddingVertical: 8, paddingHorizontal: 14, marginTop: 6, borderRadius: 14 },
  k: { fontSize: 11, color: C.mute, letterSpacing: 0.5, textTransform: 'uppercase' },
  fz: { borderRadius: 20, overflow: 'hidden', marginTop: 16, ...shadow },
  zp: { position: 'absolute', transform: [{ translateX: -40 }, { translateY: -16 }], minWidth: 80, alignItems: 'center', paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)', backgroundColor: 'rgba(255,255,255,0.78)' },
  sw: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 28 },
  swatch: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#fff', shadowColor: '#785064', shadowOpacity: 0.18, shadowRadius: 9, shadowOffset: { width: 0, height: 8 } },
  swatchOn: { transform: [{ scale: 1.12 }], borderColor: C.mauve2 },
  sec: { ...glass, paddingVertical: 10, paddingHorizontal: 14, marginTop: 10 },
  hours: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 },
  hour: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: C.line, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  tg: { ...glass, padding: 14 },
  notif: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginTop: 8, borderRadius: 20 },
  notifIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  lifeCard: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingLeft: 12, paddingRight: 22, minHeight: 72 },
  tgHd: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reco: { alignSelf: 'flex-start', backgroundColor: 'rgba(246,226,238,0.95)', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8, marginBottom: 5 },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: '#E6D8E1' },
  knob: { position: 'absolute', top: 3, left: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
  chipsel: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { borderWidth: 1.5, borderColor: C.line, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  rxGroup: { fontSize: 11.5, color: C.mute, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  rxCard: { marginTop: 10, padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: C.line, backgroundColor: 'rgba(255,255,255,0.7)' },
  rxChip: { paddingVertical: 6, paddingHorizontal: 11 },
  rxOk: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  rxBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.line, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  other: { marginTop: 8, height: 42, borderRadius: 12, borderWidth: 1.5, borderColor: C.line, backgroundColor: '#fff', paddingHorizontal: 12, fontSize: 13.5, color: C.ink },
  cl: { ...glass, borderRadius: 18, paddingVertical: 6, paddingHorizontal: 14, marginTop: 16, marginBottom: 14 },
  it: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(234,220,229,0.7)' },
  oc: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#D9C6D3' },
  cardLabel: { position: 'absolute', textAlign: 'center', fontSize: 9.5, letterSpacing: 1.1, color: C.mauve },
  list: { ...glass, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 16, marginTop: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(234,220,229,0.7)' },
  kd: { position: 'absolute', left: 18, right: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  kdb: { flexShrink: 1, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: C.glassLine, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, ...shadow },
})

// Shared with My Skyn Profile, so it looks and reads like the sign-up.
export { Backdrop, Bubble, LineIcon, C as GLOSSY, STEPS, CONCERN_LABEL, AGES, SAFETY, ZONES, LIFE_CARDS }
