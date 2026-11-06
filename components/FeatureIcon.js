import React from 'react'
import { Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import RekodIcon from './RekodIcon'
import { useTheme } from '../utils/ThemeContext'

// One icon per feature, the same everywhere in the app (Lita, 2026-10-23):
// Rekod and Koda use their official logos, Dekod the scan circle of the
// bottom bar. Any other name is a plain Ionicons name.
const KODA = require('../assets/images/koda-logo.png')

export const FEATURE_ICONS = {
  rekod: 'rekod',
  koda: 'koda',
  dekod: 'scan-circle-outline',
  scan: 'scan-outline',
  search: 'search-outline',
  journal: 'book-outline',
  forecast: 'partly-sunny-outline',
  routines: 'water-outline',
  layering: 'layers-outline',
  emergency: 'medkit-outline',
  skyncyclopedia: 'library-outline',
  modes: 'heart-outline',
  report: 'document-text-outline',
  progress: 'trending-up-outline',
  journey: 'ribbon-outline',
}

// The glossy versions of the same icons (Lita, 2026-11-06). An icon is glossy only
// where it stands for its own feature (`glossy`: the tab bar, the menu, Profile,
// Home's entry points); the same shape used for something else stays a line icon.
// Koda is always Koda.
const G = name => ({
  home: require('../assets/glossy/icon-home.png'), dekod: require('../assets/glossy/icon-dekod.png'), plus: require('../assets/glossy/icon-plus.png'),
  scan: require('../assets/glossy/icon-scan.png'), journal: require('../assets/glossy/icon-journal.png'), routines: require('../assets/glossy/icon-routines.png'),
  progress: require('../assets/glossy/icon-progress.png'), products: require('../assets/glossy/icon-products.png'), learn: require('../assets/glossy/icon-learn.png'),
  profile: require('../assets/glossy/icon-profile.png'), search: require('../assets/glossy/icon-search.png'), forecast: require('../assets/glossy/icon-forecast.png'),
  layering: require('../assets/glossy/icon-layering.png'), sos: require('../assets/glossy/icon-sos.png'), modes: require('../assets/glossy/icon-modes.png'),
  report: require('../assets/glossy/icon-report.png'), journey: require('../assets/glossy/icon-journey.png'),
  koda: require('../assets/glossy/icon-koda.png'), 'skyn-profile': require('../assets/glossy/icon-skyn-profile.png'),
  photos: require('../assets/glossy/icon-photos.png'), timeline: require('../assets/glossy/icon-timeline.png'),
  budget: require('../assets/glossy/icon-budget.png'), quiz: require('../assets/glossy/icon-quiz.png'),
  notifications: require('../assets/glossy/icon-notifications.png'), premium: require('../assets/glossy/icon-premium.png'),
  settings: require('../assets/glossy/icon-settings.png'), about: require('../assets/glossy/icon-about.png'),
  sun: require('../assets/glossy/icon-sun.png'), moon: require('../assets/glossy/icon-moon.png'),
  leaf: require('../assets/glossy/icon-leaf.png'), shield: require('../assets/glossy/icon-shield.png'),
}[name])
const GLOSSY_OF = {
  home: 'home', 'home-outline': 'home', 'scan-circle': 'dekod', 'scan-circle-outline': 'dekod', add: 'plus',
  'scan-outline': 'scan', 'barcode-outline': 'scan', 'book-outline': 'journal', 'water-outline': 'routines', 'trending-up-outline': 'progress',
  'flask-outline': 'products', 'library-outline': 'learn', 'person-outline': 'profile', 'search-outline': 'search',
  'partly-sunny-outline': 'forecast', 'layers-outline': 'layering', 'medkit-outline': 'sos', 'heart-outline': 'modes',
  'document-text-outline': 'report', 'ribbon-outline': 'journey', koda: 'koda', 'person-circle-outline': 'skyn-profile', 'camera-outline': 'photos', 'git-commit-outline': 'timeline', 'wallet-outline': 'budget', 'help-circle-outline': 'quiz', 'notifications-outline': 'notifications', 'diamond-outline': 'premium', 'settings-outline': 'settings', 'information-circle-outline': 'about', 'sunny-outline': 'sun', 'moon-outline': 'moon', 'leaf-outline': 'leaf', 'shield-checkmark-outline': 'shield',
}

// `dimmed`: an inactive tab, only faded.
export function GlossyIcon({ name, size = 20, dimmed = false, style }) {
  return <Image source={G(name)} style={[{ width: size * 1.15, height: size * 1.15, margin: -size * 0.075, opacity: dimmed ? 0.55 : 1 }, style]} resizeMode="contain" />
}

export default function FeatureIcon({ name, size = 20, color, focused = false, glossy = false, style }) {
  const theme = useTheme()
  const icon = FEATURE_ICONS[name] || name
  if (icon === 'rekod') return <RekodIcon size={size} />
  if (theme.glossy && GLOSSY_OF[icon] && (glossy || icon === 'koda')) return <GlossyIcon name={GLOSSY_OF[icon]} size={size} style={style} />
  if (icon === 'koda') return <Image source={KODA} style={[{ width: size, height: size, tintColor: color }, style]} resizeMode="contain" />
  return <Ionicons name={icon} size={size} color={color} style={style} />
}
