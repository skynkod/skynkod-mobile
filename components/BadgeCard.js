import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Platform, Easing } from 'react-native'
import Svg, { Rect, Circle, Line, Path, G, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg'
import { Ionicons } from '@expo/vector-icons'
import { TIERS } from '../utils/journey-core'

// A collectible badge card: metal frame by rarity, a deep jewel window, a
// medallion with the badge's icon, and a name plate. Same look in light and
// dark mode on purpose (a jewellery piece).
export const TIER_LOOK = {
  quartz: { metal: ['#F7DCE5', '#C98DA4', '#FBE9EF', '#B97A93', '#F1CFDB'], well: ['#7A3A57', '#3D1B2E', '#1E0D17'], plate: ['#3A1F2F', '#2A1622'], accent: '#FBE3EC', sub: '#D9A3B8', ray: '#F3BFD2' },
  pearl: { metal: ['#FFFFFF', '#D7D2E6', '#F4EFF8', '#C9D7E8', '#DCD6EA'], well: ['#3B4A7A', '#1E2546', '#0B0F22'], plate: ['#232A45', '#141A2E'], accent: '#F4F1FA', sub: '#B9C3E0', ray: '#C9D4FF' },
  gold: { metal: ['#FFF1C9', '#C9A055', '#FFE7A8', '#9E7531', '#F3D58E'], well: ['#5A2B4E', '#2E1429', '#140812'], plate: ['#2E1A2B', '#1B0F1A'], accent: '#FCE7B6', sub: '#D9B36A', ray: '#F3D58E' },
  prism: { metal: ['#F9D2E6', '#C9E7FF', '#D9FFE9', '#FFF3C4', '#E8D2FF'], well: ['#3A2A66', '#1A1233', '#07060E'], plate: ['#1B1530', '#0C0A14'], accent: '#FFFFFF', sub: '#CFC4F2', ray: '#CFC4F2' },
  locked: { metal: ['#6A6268', '#3F393D', '#7A7278', '#342F33', '#5A5458'], well: ['#2E292C', '#1C191B', '#0F0D0E'], plate: ['#221E21', '#171416'], accent: '#9A9098', sub: '#6F676D', ray: '#5A5458' },
}
const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' })

// state: 'earned' | 'locked' | 'mystery' (earned, waiting in the Koda box)
export default function BadgeCard({ badge, state = 'earned', width = 150, shine = false }) {
  const look = TIER_LOOK[state === 'earned' ? badge.tier : 'locked']
  const h = width * 1.4
  const uid = `${badge.id}-${state}`
  const s = width / 200 // drawing scale: the card is drawn in a 200 × 280 box
  const sweep = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!shine) return
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(sweep, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]))
    loop.start()
    return () => loop.stop()
  }, [shine])

  const rays = badge.tier === 'gold' || badge.tier === 'prism' ? 32 : 16
  const icon = state === 'locked' ? 'lock-closed' : state === 'mystery' ? 'gift-outline' : badge.icon
  const name = state === 'mystery' ? 'In your Koda box' : badge.name
  const tierName = state === 'mystery' ? 'Revealed on Monday' : TIERS[badge.tier]?.name

  return (
    <View style={{ width, height: h, borderRadius: 14 * s, overflow: 'hidden' }}>
      <Svg width={width} height={h} viewBox="0 0 200 280">
        <Defs>
          <LinearGradient id={`m-${uid}`} x1="0" y1="0" x2="1" y2="1">
            {look.metal.map((c, i) => <Stop key={i} offset={i / (look.metal.length - 1)} stopColor={c} />)}
          </LinearGradient>
          <RadialGradient id={`w-${uid}`} cx="50%" cy="38%" r="75%">
            <Stop offset="0" stopColor={look.well[0]} /><Stop offset="0.55" stopColor={look.well[1]} /><Stop offset="1" stopColor={look.well[2]} />
          </RadialGradient>
          <LinearGradient id={`p-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={look.plate[0]} /><Stop offset="1" stopColor={look.plate[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="200" height="280" rx="14" fill={`url(#m-${uid})`} />
        <Rect x="7" y="7" width="186" height="266" rx="9" fill={`url(#w-${uid})`} />
        <G opacity={state === 'locked' ? 0.15 : 0.3}>
          {Array.from({ length: rays }).map((_, i) => {
            const a = (i / rays) * Math.PI * 2
            return <Line key={i} x1={100 + Math.cos(a) * 46} y1={102 + Math.sin(a) * 46} x2={100 + Math.cos(a) * 130} y2={102 + Math.sin(a) * 130} stroke={look.ray} strokeWidth={i % 2 ? 0.6 : 1.2} />
          })}
        </G>
        <Circle cx="100" cy="102" r="74" fill="none" stroke={look.ray} strokeWidth="0.6" opacity="0.35" />
        {badge.tier === 'prism' && state === 'earned' ? <Circle cx="100" cy="102" r="60" fill="none" stroke={`url(#m-${uid})`} strokeWidth="1.2" strokeDasharray="3 5" /> : null}
        <Circle cx="100" cy="102" r="46" fill={`url(#m-${uid})`} />
        <Circle cx="100" cy="102" r="40" fill={look.well[2]} />
        <Circle cx="100" cy="102" r="40" fill="none" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1" />
        {state === 'earned' ? (
          <G fill={look.accent}>
            <Path d="M34 40 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2z" />
            <Path d="M166 150 l1.5 4.5 l4.5 1.5 l-4.5 1.5 l-1.5 4.5 l-1.5 -4.5 l-4.5 -1.5 l4.5 -1.5z" />
            {badge.tier !== 'quartz' ? <Path d="M160 34 l1.2 3.6 l3.6 1.2 l-3.6 1.2 l-1.2 3.6 l-1.2 -3.6 l-3.6 -1.2 l3.6 -1.2z" /> : null}
          </G>
        ) : null}
        <Rect x="7" y="200" width="186" height="73" fill={`url(#p-${uid})`} />
        <Line x1="7" y1="200" x2="193" y2="200" stroke="#FFFFFF" strokeOpacity="0.18" />
      </Svg>

      {/* Icon in the medallion */}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center' }]} pointerEvents="none">
        <View style={{ position: 'absolute', top: 80 * s, width: 44 * s, height: 44 * s, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={34 * s} color={look.accent} />
        </View>
        <View style={{ position: 'absolute', top: 210 * s, left: 12 * s, right: 12 * s, alignItems: 'center' }}>
          <Text numberOfLines={2} style={{ fontFamily: SERIF, color: look.accent, fontSize: 19 * s, textAlign: 'center', lineHeight: 22 * s }}>{name}</Text>
          <Text numberOfLines={1} style={{ color: look.sub, fontSize: 9.5 * s, letterSpacing: 1.6 * s, marginTop: 4 * s, textTransform: 'uppercase' }}>{tierName}</Text>
        </View>
      </View>

      {/* Light sweep for the reveal */}
      {shine ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', top: -h * 0.2, bottom: -h * 0.2, width: width * 0.35, backgroundColor: 'rgba(255,255,255,0.22)',
            transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.6, width * 1.3] }) }, { rotate: '20deg' }],
          }}
        />
      ) : null}
    </View>
  )
}
