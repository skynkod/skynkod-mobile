import React from 'react'
import Svg, { Defs, ClipPath, Path, Image as SvgImage, G } from 'react-native-svg'

const MOON = require('../assets/images/moon.png')
const SYNODIC = 29.530588853
// A known new moon: 6 January 2000, 18:14 UTC.
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)

// 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter.
export const moonPhase = (date = new Date()) => {
  const days = (date.getTime() - NEW_MOON) / 86400000
  return ((days % SYNODIC) + SYNODIC) % SYNODIC / SYNODIC
}

// Share of the disc that is lit (0–1).
export const moonLight = phase => (1 - Math.cos(2 * Math.PI * phase)) / 2

// The real moon photo, cut to tonight's shape; the dark side shows faintly
// (earthshine). Seen from the northern hemisphere: lit on the right while waxing.
export default function Moon({ size = 64, date = new Date() }) {
  const phase = moonPhase(date)
  if (moonLight(phase) < 0.02) return null // new moon: nothing to see
  const r = size / 2
  const waxing = phase < 0.5
  const rx = r * Math.abs(Math.cos(2 * Math.PI * phase))
  const gibbous = moonLight(phase) > 0.5
  // Lit area: the right half disc, then back up along the terminator ellipse.
  const lit = `M ${r} 0 A ${r} ${r} 0 0 1 ${r} ${size} A ${rx} ${r} 0 0 ${gibbous ? 1 : 0} ${r} 0 Z`
  return (
    <Svg width={size} height={size}>
      <Defs>
        <ClipPath id="moonLit">
          <Path d={lit} transform={waxing ? undefined : `translate(${size} 0) scale(-1 1)`} />
        </ClipPath>
      </Defs>
      <SvgImage href={MOON} width={size} height={size} opacity={0.06} />
      <G clipPath="url(#moonLit)">
        <SvgImage href={MOON} width={size} height={size} />
      </G>
    </Svg>
  )
}
