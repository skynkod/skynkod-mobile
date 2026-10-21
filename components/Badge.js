import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import { TIERS } from '../utils/journey-core'

// Badge art, cut from Lita's badge mockups (assets/badges). Replace a file to
// update a badge; badges without art fall back to a soft hexagon.
export const BADGE_IMAGES = {
  'active-ingredient-pro': require('../assets/badges/active-ingredient-pro.webp'),
  'barrier-expert': require('../assets/badges/barrier-expert.webp'),
  'barrier-healed': require('../assets/badges/barrier-healed.webp'),
  'bounce-back': require('../assets/badges/bounce-back.webp'),
  'brave-skin': require('../assets/badges/brave-skin.webp'),
  'calm-week': require('../assets/badges/calm-week.webp'),
  'collection-builder': require('../assets/badges/collection-builder.webp'),
  'comeback-queen': require('../assets/badges/comeback-queen.webp'),
  'community-star': require('../assets/badges/community-star.webp'),
  'consistency-club': require('../assets/badges/consistency-club.webp'),
  'curated-collection': require('../assets/badges/curated-collection.webp'),
  'deeper-insights': require('../assets/badges/deeper-insights.webp'),
  'first-entry': require('../assets/badges/first-entry.webp'),
  'first-light': require('../assets/badges/first-light.webp'),
  'first-question': require('../assets/badges/first-question.webp'),
  'first-steps': require('../assets/badges/first-steps.webp'),
  'gentle-comeback': require('../assets/badges/gentle-comeback.webp'),
  'glow-journey': require('../assets/badges/glow-journey.webp'),
  'glow-progress': require('../assets/badges/glow-progress.webp'),
  'habit-master': require('../assets/badges/habit-master.webp'),
  'halfway-glow': require('../assets/badges/halfway-glow.webp'),
  'helpful-friend': require('../assets/badges/helpful-friend.webp'),
  'ingredient-explorer': require('../assets/badges/ingredient-explorer.webp'),
  'ingredient-matcher': require('../assets/badges/ingredient-matcher.webp'),
  'journal-keeper': require('../assets/badges/journal-keeper.webp'),
  'kodas-companion': require('../assets/badges/kodas-companion.webp'),
  'mindful-beauty': require('../assets/badges/mindful-beauty.webp'),
  'minimalist': require('../assets/badges/minimalist.webp'),
  'morning-glow': require('../assets/badges/morning-glow.webp'),
  'new-chapter': require('../assets/badges/new-chapter.webp'),
  'night-ritual': require('../assets/badges/night-ritual.webp'),
  'no-waste-hero': require('../assets/badges/no-waste-hero.webp'),
  'one-month-strong': require('../assets/badges/one-month-strong.webp'),
  'perfect-balance': require('../assets/badges/perfect-balance.webp'),
  'product-curator': require('../assets/badges/product-curator.webp'),
  'product-detective': require('../assets/badges/product-detective.webp'),
  'profile-perfectionist': require('../assets/badges/profile-perfectionist.webp'),
  'progress-tracker': require('../assets/badges/progress-tracker.webp'),
  'real-results': require('../assets/badges/real-results.webp'),
  'rekod-master': require('../assets/badges/rekod-master.webp'),
  'routine-rookie': require('../assets/badges/routine-rookie.webp'),
  'secret-1': require('../assets/badges/secret-1.webp'),
  'secret-2': require('../assets/badges/secret-2.webp'),
  'secret-3': require('../assets/badges/secret-3.webp'),
  'self-care-fall': require('../assets/badges/self-care-fall.webp'),
  'self-care-queen': require('../assets/badges/self-care-queen.webp'),
  'shelf-organized': require('../assets/badges/shelf-organized.webp'),
  'skin-detective': require('../assets/badges/skin-detective.webp'),
  'skin-observer': require('../assets/badges/skin-observer.webp'),
  'skin-scholar': require('../assets/badges/skin-scholar.webp'),
  'skincare-advocate': require('../assets/badges/skincare-advocate.webp'),
  'skincare-enthusiast': require('../assets/badges/skincare-enthusiast.webp'),
  'skincare-expert': require('../assets/badges/skincare-expert.webp'),
  'skincare-genius': require('../assets/badges/skincare-genius.webp'),
  'skinfluencer': require('../assets/badges/skinfluencer.webp'),
  'skynkod-ambassador': require('../assets/badges/skynkod-ambassador.webp'),
  'skynkod-explorer': require('../assets/badges/skynkod-explorer.webp'),
  'skynkod-icon': require('../assets/badges/skynkod-icon.webp'),
  'skynkod-insider': require('../assets/badges/skynkod-insider.webp'),
  'spring-glow': require('../assets/badges/spring-glow.webp'),
  'star-dedicated': require('../assets/badges/star-dedicated.webp'),
  'star-expert': require('../assets/badges/star-expert.webp'),
  'star-explorer': require('../assets/badges/star-explorer.webp'),
  'star-loyal': require('../assets/badges/star-loyal.webp'),
  'star-veteran': require('../assets/badges/star-veteran.webp'),
  'star-welcome': require('../assets/badges/star-welcome.webp'),
  'summer-care': require('../assets/badges/summer-care.webp'),
  'sun-guardian': require('../assets/badges/sun-guardian.webp'),
  'unstoppable': require('../assets/badges/unstoppable.webp'),
  'winter-rituals': require('../assets/badges/winter-rituals.webp'),
}

// Seniority stars not earned yet are shown greyed (their shape and facets),
// rather than as a flat silhouette.
const LOCKED_IMAGES = {
  'star-welcome': require('../assets/badges/star-welcome-locked.webp'),
  'star-explorer': require('../assets/badges/star-explorer-locked.webp'),
  'star-dedicated': require('../assets/badges/star-dedicated-locked.webp'),
  'star-loyal': require('../assets/badges/star-loyal-locked.webp'),
  'star-expert': require('../assets/badges/star-expert-locked.webp'),
  'star-veteran': require('../assets/badges/star-veteran-locked.webp'),
}

// Rarity colours: the pill, and the detail card (light, or dark for legendary).
export const TIER_STYLE = {
  common: { pill: '#A99DB8', card: '#F4F0F6', ink: '#3E3346', soft: '#7B6F86', bar: '#A99DB8' },
  rare: { pill: '#8768C4', card: '#ECE4F8', ink: '#352657', soft: '#6E5C93', bar: '#8768C4' },
  epic: { pill: '#D466A6', card: '#F9E3EF', ink: '#5A2443', soft: '#94607E', bar: '#D466A6' },
  legendary: { pill: '#C99A45', card: '#2D2329', ink: '#F7EBD3', soft: '#BBA88E', bar: '#C99A45' },
  secret: { pill: '#4A2D52', card: '#231A26', ink: '#EADCF0', soft: '#A493AD', bar: '#7E5A8C' },
}

// A badge not earned yet is a mysterious silhouette: its shape only, with a
// question mark. The real art is revealed the moment it's earned.
export const SILHOUETTE = '#B7A6C4'

export function BadgeImage({ badge, size = 72, locked = false }) {
  const src = BADGE_IMAGES[badge.id]
  const h = size * 0.96
  if (locked && LOCKED_IMAGES[badge.id]) {
    return (
      <View style={{ width: size, height: h, alignItems: 'center', justifyContent: 'center' }}>
        <Image source={LOCKED_IMAGES[badge.id]} style={{ width: size, height: h, opacity: 0.8 }} resizeMode="contain" />
      </View>
    )
  }
  if (locked) {
    return (
      <View style={{ width: size, height: h, alignItems: 'center', justifyContent: 'center' }}>
        {src ? (
          <Image source={src} style={{ width: size, height: h, tintColor: SILHOUETTE, opacity: 0.5 }} resizeMode="contain" />
        ) : (
          <Svg width={size * 0.86} height={size * 0.94} viewBox="0 0 100 110" style={{ opacity: 0.5 }}>
            <Path d="M50 3 L94 28 L94 82 L50 107 L6 82 L6 28 Z" fill={SILHOUETTE} />
          </Svg>
        )}
        <Text style={[styles.mark, { fontSize: size * 0.3 }]}>?</Text>
      </View>
    )
  }
  return (
    <View style={{ width: size, height: h, alignItems: 'center', justifyContent: 'center' }}>
      {src ? (
        <Image source={src} style={{ width: size, height: h }} resizeMode="contain" />
      ) : (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
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
    </View>
  )
}

// Level emblems, cut from Lita's levels mockup (assets/levels).
export const LEVEL_IMAGES = {
  1: require('../assets/levels/level-01.webp'),
  2: require('../assets/levels/level-02.webp'),
  3: require('../assets/levels/level-03.webp'),
  4: require('../assets/levels/level-04.webp'),
  5: require('../assets/levels/level-05.webp'),
  6: require('../assets/levels/level-06.webp'),
  7: require('../assets/levels/level-07.webp'),
  8: require('../assets/levels/level-08.webp'),
  9: require('../assets/levels/level-09.webp'),
  10: require('../assets/levels/level-10.webp'),
  11: require('../assets/levels/level-11.webp'),
  12: require('../assets/levels/level-12.webp'),
  13: require('../assets/levels/level-13.webp'),
  14: require('../assets/levels/level-14.webp'),
  15: require('../assets/levels/level-15.webp'),
}

// A level emblem; a level not reached yet stays a silhouette.
export function LevelEmblem({ level, size = 64, locked = false }) {
  const src = LEVEL_IMAGES[level]
  return (
    <View style={{ width: size * 0.7, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={src} style={{ width: size * 0.7, height: size, ...(locked ? { tintColor: SILHOUETTE, opacity: 0.5 } : null) }} resizeMode="contain" />
      {locked ? <Text style={[styles.mark, { fontSize: size * 0.22 }]}>?</Text> : null}
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
  mark: { position: 'absolute', color: '#FFFFFF', fontWeight: '300', opacity: 0.9 },
  pill: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 999 },
  pillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
})
