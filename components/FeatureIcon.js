import React from 'react'
import { Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import RekodIcon from './RekodIcon'

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

export default function FeatureIcon({ name, size = 20, color, focused = false, style }) {
  const icon = FEATURE_ICONS[name] || name
  if (icon === 'rekod') return <RekodIcon size={size} color={color} focused={focused} />
  if (icon === 'koda') return <Image source={KODA} style={[{ width: size, height: size, tintColor: color }, style]} resizeMode="contain" />
  return <Ionicons name={icon} size={size} color={color} style={style} />
}
