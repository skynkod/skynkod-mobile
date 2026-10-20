import React from 'react'
import Svg, { Rect, Circle, Ellipse, Path, G } from 'react-native-svg'

// The Koda box that arrives every Monday, and the cup of tea for quiet weeks.
const C = {
  blush: '#F3D9E4', mauve: '#C5A8BB', plum: '#8A6380', deep: '#5E3F56', cream: '#FBF3EE',
  sage: '#C9D8C5', leaf: '#8FB08A', wood: '#D9B99B', woodDark: '#B8926F', marble: '#F1ECEA',
  vein: '#D9D0CC', gold: '#D9B76E', glass: '#E8EEF3', white: '#FFFFFF', peach: '#F6CDB8', lilac: '#DCCDEB',
}

export function TeaArt({ size = 120 }) {
  return <Svg width={size} height={size} viewBox="0 0 64 64"><G><Ellipse cx="32" cy="58" rx="22" ry="3" fill={C.vein} /><Path d="M16 38 h28 v8 C44 54 38 58 30 58 C22 58 16 54 16 46z" fill={C.cream} stroke={C.mauve} strokeWidth="1.5" /><Path d="M44 42 C52 42 52 52 43 51" stroke={C.mauve} strokeWidth="2" fill="none" /><Path d="M24 32 C22 28 26 26 24 22 M32 32 C30 28 34 26 32 22" stroke={C.mauve} strokeWidth="1.5" fill="none" opacity="0.6" /><Rect x="34" y="38" width="4" height="8" fill={C.leaf} /></G></Svg>
}

// The box: closed, or open with its flaps out.
export function BoxArt({ open = false, size = 160 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <Ellipse cx="80" cy="146" rx="62" ry="7" fill="#EADCE3" />
      {open ? (<G>
        <Path d="M28 62 L10 40 L58 34 L80 56z" fill="#E4C9A8" />
        <Path d="M132 62 L150 40 L102 34 L80 56z" fill="#E4C9A8" />
        <Rect x="28" y="56" width="104" height="86" rx="6" fill="#D9B99B" />
        <Path d="M28 56 h104 l-10 14 h-84z" fill="#B8926F" opacity="0.5" />
        <Circle cx="64" cy="48" r="10" fill={C.blush} /><Rect x="78" y="34" width="12" height="26" rx="4" fill={C.mauve} /><Circle cx="100" cy="50" r="8" fill={C.sage} />
      </G>) : (<G>
        <Rect x="28" y="56" width="104" height="86" rx="6" fill="#D9B99B" />
        <Path d="M24 46 h112 v16 h-112z" fill="#E4C9A8" />
        <Rect x="72" y="46" width="16" height="96" fill={C.blush} opacity="0.9" />
        <Path d="M80 46 C70 30 56 34 64 44 M80 46 C90 30 104 34 96 44" stroke={C.plum} strokeWidth="4" fill="none" strokeLinecap="round" />
      </G>)}
      <Rect x="44" y="96" width="40" height="20" rx="3" fill={C.cream} opacity="0.9" />
      <Path d="M50 104 h28 M50 110 h18" stroke={C.mauve} strokeWidth="2" />
    </Svg>
  )
}
