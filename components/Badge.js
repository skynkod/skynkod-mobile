import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import { TIERS } from '../utils/journey-core'

// Badge art, cut from Lita's badge mockup (assets/badges). Replace a file to
// update a badge; badges without art fall back to a soft hexagon.
export const BADGE_IMAGES = {
  'first-steps': require('../assets/badges/first-steps.png'),
  'routine-rookie': require('../assets/badges/routine-rookie.png'),
  'product-curator': require('../assets/badges/product-curator.png'),
  'shelf-organized': require('../assets/badges/shelf-organized.png'),
  'skin-scholar': require('../assets/badges/skin-scholar.png'),
  'ingredient-explorer': require('../assets/badges/ingredient-explorer.png'),
  'product-detective': require('../assets/badges/product-detective.png'),
  'skincare-expert': require('../assets/badges/skincare-expert.png'),
  'consistency-club': require('../assets/badges/consistency-club.png'),
  'one-month-strong': require('../assets/badges/one-month-strong.png'),
  'journal-keeper': require('../assets/badges/journal-keeper.png'),
  'self-care-queen': require('../assets/badges/self-care-queen.png'),
  'skincare-enthusiast': require('../assets/badges/skincare-enthusiast.png'),
  'skynkod-explorer': require('../assets/badges/skynkod-explorer.png'),
  'skinfluencer': require('../assets/badges/skinfluencer.png'),
  'skynkod-insider': require('../assets/badges/skynkod-insider.png'),
}

// Rarity colours: the pill, and the detail card (light, or dark for legendary).
export const TIER_STYLE = {
  common: { pill: '#A99DB8', card: '#F4F0F6', ink: '#3E3346', soft: '#7B6F86', bar: '#A99DB8' },
  rare: { pill: '#8768C4', card: '#ECE4F8', ink: '#352657', soft: '#6E5C93', bar: '#8768C4' },
  epic: { pill: '#D466A6', card: '#F9E3EF', ink: '#5A2443', soft: '#94607E', bar: '#D466A6' },
  legendary: { pill: '#C99A45', card: '#2D2329', ink: '#F7EBD3', soft: '#BBA88E', bar: '#C99A45' },
}

export function BadgeImage({ badge, size = 72, locked = false }) {
  const src = BADGE_IMAGES[badge.id]
  return (
    <View style={{ width: size, height: size * 0.96, alignItems: 'center', justifyContent: 'center' }}>
      {src ? (
        <Image source={src} style={{ width: size, height: size * 0.96, opacity: locked ? 0.32 : 1 }} resizeMode="contain" />
      ) : (
        <View style={{ opacity: locked ? 0.3 : 1, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size * 0.86} height={size * 0.94} viewBox="0 0 100 110">
            <Defs>
              <LinearGradient id={`rim-${badge.id}`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#F7F1F8" /><Stop offset="0.5" stopColor="#C9B8D3" /><Stop offset="1" stopColor="#EFE6F2" /></LinearGradient>
              <LinearGradient id={`in-${badge.id}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#B9A6D6" /><Stop offset="1" stopColor="#7E68A8" /></LinearGradient>
            </Defs>
            <Path d="M50 3 L94 28 L94 82 L50 107 L6 82 L6 28 Z" fill={`url(#rim-${badge.id})`} />
            <Path d="M50 13 L85 33 L85 77 L50 97 L15 77 L15 33 Z" fill={`url(#in-${badge.id})`} />
          </Svg>
          {badge.icon ? <Ionicons name={badge.icon} size={size * 0.36} color="#FBF3FF" style={{ position: 'absolute' }} /> : null}
        </View>
      )}
      {locked ? (
        <View style={[styles.lock, { width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16 }]}>
          <Ionicons name="lock-closed" size={size * 0.16} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  )
}

export function TierPill({ tier, style }) {
  return (
    <View style={[styles.pill, { backgroundColor: TIER_STYLE[tier].pill }, style]}>
      <Text style={styles.pillText}>{TIERS[tier].name.toUpperCase()}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  lock: { position: 'absolute', backgroundColor: 'rgba(62,51,70,0.75)', alignItems: 'center', justifyContent: 'center' },
  pill: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 999 },
  pillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
})
