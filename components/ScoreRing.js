import React from 'react'
import Svg, { Circle } from 'react-native-svg'

// Thick progress ring, as on the mockup's skin score card.
export default function ScoreRing({ value = 0, size = 96, stroke = 12, color, trackColor }) {
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const progress = Math.max(0, Math.min(1, value / 100))
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={circumference * (1 - progress)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  )
}
