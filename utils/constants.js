// Color scheme
export const SKYNKOD_COLORS = {
  primary: '#B283AC',
  secondary: '#7A3E76',
  lightBg: '#F7F1F5',
  darkBg: '#1A1620',
  lightCard: '#FFFFFF',
  darkCard: '#2F2935',
  lightBorder: '#E8E1ED',
  darkBorder: '#2A2430',
  lightText: '#14121A',
  darkText: '#F5F1F8',
  lightMuted: '#9B97A0',
  darkMuted: '#6B6773',
}

// Skin moods
export const SKIN_MOODS = ['Poor', 'Okay', 'Good', 'Great']

// Skin conditions
export const SKIN_CONDITIONS = [
  'Acne',
  'Dryness',
  'Oiliness',
  'Sensitivity',
  'Redness',
  'Irritation',
  'Flakiness',
  'Texture',
  'Uneven tone',
  'Wrinkles',
]

// Skin types
export const SKIN_TYPES = {
  oily: {
    name: 'Oily',
    emoji: '💧',
    description: 'Excess sebum production, prone to breakouts',
  },
  dry: {
    name: 'Dry',
    emoji: '🏜️',
    description: 'Lacks moisture, may feel tight',
  },
  combination: {
    name: 'Combination',
    emoji: '⚖️',
    description: 'Oily T-zone, dry cheeks',
  },
  sensitive: {
    name: 'Sensitive',
    emoji: '🌸',
    description: 'Easily irritated, reactive',
  },
  normal: {
    name: 'Normal',
    emoji: '✨',
    description: 'Well-balanced, minimal issues',
  },
}

// Routine types
export const ROUTINE_TYPES = {
  morning: {
    name: 'Morning',
    emoji: '🌅',
    description: 'Start your day with a fresh routine',
  },
  evening: {
    name: 'Evening',
    emoji: '🌙',
    description: 'Wind down with your nighttime routine',
  },
}

// Product categories
export const PRODUCT_CATEGORIES = [
  'Cleanser',
  'Toner',
  'Essence',
  'Serum',
  'Moisturizer',
  'Eye Cream',
  'Sunscreen',
  'Mask',
  'Exfoliator',
  'Treatment',
  'Other',
]

// Expense categories
export const EXPENSE_CATEGORIES = ['Product', 'Service', 'Other']

// Notification times
export const NOTIFICATION_TIMES = {
  morning: { hour: 8, minute: 0 }, // 8 AM
  evening: { hour: 20, minute: 0 }, // 8 PM
  journal: { hour: 21, minute: 0 }, // 9 PM
}

// Freemium limits
export const FREEMIUM_LIMITS = {
  dailyKodaMessages: 5,
  monthlyRoutineReminders: 100,
}

// Premium features
export const PREMIUM_FEATURES = [
  'Unlimited Koda Chat',
  'Routine Generator',
  'Photo Analysis',
  'Export Reports',
  'Priority Support',
]

// App info
export const APP_INFO = {
  name: 'Skynkod',
  version: '1.0.0',
  tagline: 'Your AI Skin Coach',
}

// Languages
export const LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
}