import React from 'react'
import Svg, { Path, Circle } from 'react-native-svg'

// Rekod's icon: renewal in a skin-tech style. A renewal loop (circular arrow)
// around a skin cell drawn as a hexagon. Filled cell when the tab is active.
export default function RekodIcon({ size = 24, color = '#000', focused = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Renewal loop, open at the top right, with its arrowhead */}
      <Path d="M19.4 8.2A8.2 8.2 0 1 0 20.2 12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M20.6 4.6l-1.1 3.7-3.7-1.1" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      {/* Skin cell */}
      <Path d="M12 7.9l3.55 2.05v4.1L12 16.1l-3.55-2.05v-4.1z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" fill={focused ? color : 'none'} />
      <Circle cx={12} cy={12} r={1.15} fill={focused ? '#FFFFFF' : color} />
    </Svg>
  )
}
