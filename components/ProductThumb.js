import React from 'react'
import { View, Image, StyleSheet } from 'react-native'
import Svg, { G, Path, Rect, Ellipse, Circle, Text as SvgText } from 'react-native-svg'
import { useColors } from './ui'
import { photoOf } from '../utils/catalog'

// Products without their own photo show a line drawing of what that kind of
// product looks like: a jar for creams, a tube marked SPF for sunscreen…
// (Lita, 2026-10-23). A real photo replaces it as soon as there is one.
const SHAPES = {
  // Pump bottle
  cleanser: c => (<><Path d="M12 3h7M16 3v4M19 3v2" stroke={c} /><Rect x="13" y="7" width="6" height="3" stroke={c} /><Rect x="9" y="10" width="14" height="19" rx="3" stroke={c} /></>),
  // Plain bottle
  toner: c => (<><Rect x="13" y="3" width="6" height="5" rx="1" stroke={c} /><Path d="M14 8h4v2h-4z" stroke={c} /><Rect x="10" y="10" width="12" height="19" rx="2" stroke={c} /></>),
  // Dropper bottle
  serum: c => (<><Ellipse cx="16" cy="5" rx="2.6" ry="3" stroke={c} /><Rect x="13" y="8" width="6" height="3" stroke={c} /><Rect x="10" y="11" width="12" height="18" rx="4" stroke={c} /></>),
  // Jar
  moisturizer: c => (<><Rect x="6" y="9" width="20" height="6" rx="2" stroke={c} /><Rect x="7" y="15" width="18" height="11" rx="3" stroke={c} /></>),
  // Tube marked SPF
  sunscreen: c => (<><Path d="M9 3h14l-2 21H11z" stroke={c} /><Rect x="12" y="24" width="8" height="5" rx="1" stroke={c} /><SvgText x="16" y="16.5" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={c}>SPF</SvgText></>),
  // Jar of pads
  exfoliant: c => (<><Ellipse cx="16" cy="10" rx="9" ry="3" stroke={c} /><Path d="M7 10v14a9 3 0 0 0 18 0V10" stroke={c} /><Path d="M11 17h10M11 21h10" stroke={c} strokeDasharray="1 2.4" /></>),
  // Sheet mask
  mask: c => (<><Ellipse cx="16" cy="16" rx="9.5" ry="12.5" stroke={c} /><Ellipse cx="12" cy="13" rx="2" ry="1.2" stroke={c} /><Ellipse cx="20" cy="13" rx="2" ry="1.2" stroke={c} /><Path d="M13 21q3 2 6 0" stroke={c} /></>),
  // Small tube with an eye
  'eye care': c => (<><Path d="M11 3h10l-1 19h-8z" stroke={c} /><Rect x="13" y="22" width="6" height="6" rx="1" stroke={c} /><Path d="M13 12q3-3 6 0q-3 3-6 0z" stroke={c} /><Circle cx="16" cy="12" r="0.9" fill={c} /></>),
}
SHAPES.body = SHAPES.cleanser
SHAPES['hand care'] = c => (<><Path d="M9 3h14l-2 21H11z" stroke={c} /><Rect x="12" y="24" width="8" height="5" rx="1" stroke={c} /></>)

export default function ProductThumb({ product, style }) {
  const colors = useColors()
  const uri = photoOf(product)
  if (uri) return <Image source={{ uri }} style={style} resizeMode="contain" />
  const size = Math.round((StyleSheet.flatten(style)?.width || 44) * 0.6)
  const draw = SHAPES[product?.category] || SHAPES.serum
  return (
    <View style={[style, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <G fill="none" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round">{draw(colors.primary)}</G>
      </Svg>
    </View>
  )
}
