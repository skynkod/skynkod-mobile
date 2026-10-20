import React from 'react'
import Svg, { Rect, Circle, Ellipse, Path, G, Line, Defs, LinearGradient, Stop } from 'react-native-svg'

// Hand-drawn style, pastel, in Skynkod's colours. Spaces are drawn in a
// 360 × 300 box; items in a 64 × 64 box standing on their base line.
const C = {
  blush: '#F3D9E4', mauve: '#C5A8BB', plum: '#8A6380', deep: '#5E3F56', cream: '#FBF3EE',
  sage: '#C9D8C5', leaf: '#8FB08A', wood: '#D9B99B', woodDark: '#B8926F', marble: '#F1ECEA',
  vein: '#D9D0CC', gold: '#D9B76E', glass: '#E8EEF3', white: '#FFFFFF', peach: '#F6CDB8', lilac: '#DCCDEB',
}

// ---------- Items ----------
export function ItemArt({ id, size = 56, tint }) {
  const art = {
    dropper: (<G><Rect x="22" y="22" width="20" height="36" rx="6" fill={tint || C.mauve} opacity="0.9" /><Rect x="26" y="12" width="12" height="11" rx="2" fill={C.deep} /><Rect x="29" y="4" width="6" height="9" rx="3" fill={C.plum} /><Rect x="25" y="34" width="14" height="10" rx="2" fill={C.white} opacity="0.8" /></G>),
    jar: (<G><Rect x="14" y="34" width="36" height="24" rx="8" fill={tint || C.blush} /><Rect x="12" y="26" width="40" height="10" rx="4" fill={C.plum} /><Rect x="20" y="42" width="24" height="8" rx="2" fill={C.white} opacity="0.85" /></G>),
    pump: (<G><Rect x="20" y="26" width="24" height="32" rx="7" fill={tint || C.cream} stroke={C.mauve} strokeWidth="2" /><Rect x="28" y="16" width="8" height="11" fill={C.deep} /><Path d="M28 16 h16 v4 h-16z" fill={C.deep} /><Rect x="24" y="36" width="16" height="10" rx="2" fill={C.blush} /></G>),
    tube: (<G><Path d="M22 58 h20 l-4 -38 h-12z" fill={tint || C.lilac} /><Rect x="26" y="12" width="12" height="8" rx="2" fill={C.plum} /><Rect x="27" y="34" width="10" height="10" rx="2" fill={C.white} opacity="0.8" /></G>),
    cotton: (<G><Rect x="12" y="36" width="40" height="22" rx="6" fill={C.glass} stroke={C.vein} strokeWidth="1.5" /><Circle cx="24" cy="38" r="8" fill={C.white} /><Circle cx="34" cy="36" r="8" fill={C.white} /><Circle cx="42" cy="40" r="7" fill={C.white} /></G>),
    plant: (<G><Path d="M22 58 h20 l3 -16 h-26z" fill={C.cream} stroke={C.wood} strokeWidth="1.5" /><Path d="M32 42 C30 30 20 26 16 18 C26 20 32 28 32 42" fill={C.leaf} /><Path d="M32 42 C34 28 44 24 48 14 C38 18 32 28 32 42" fill={C.sage} /><Path d="M32 42 C32 32 30 22 32 10 C35 22 34 32 32 42" fill={C.leaf} /></G>),
    vase: (<G><Path d="M26 58 C18 50 20 38 28 34 h8 C44 38 46 50 38 58z" fill={C.peach} /><Rect x="28" y="26" width="8" height="9" fill={C.peach} /><Path d="M32 26 C30 18 26 12 24 6" stroke={C.leaf} strokeWidth="2" fill="none" /><Circle cx="24" cy="6" r="4" fill={C.blush} /></G>),
    brush: (<G><Rect x="29" y="22" width="6" height="36" rx="3" fill={C.wood} /><Path d="M26 22 h12 l-2 -12 h-8z" fill={C.cream} stroke={C.woodDark} strokeWidth="1" /><Rect x="28" y="20" width="8" height="4" fill={C.gold} /></G>),
    candle: (<G><Rect x="18" y="32" width="28" height="26" rx="4" fill={C.white} stroke={C.vein} strokeWidth="1.5" /><Rect x="18" y="32" width="28" height="6" rx="3" fill={C.marble} /><Line x1="32" y1="32" x2="32" y2="26" stroke={C.deep} strokeWidth="1.5" /><Path d="M32 26 C29 22 31 17 32 14 C33 17 35 22 32 26" fill={C.gold} /></G>),
    tray: (<G><Ellipse cx="32" cy="54" rx="28" ry="6" fill={C.marble} stroke={C.vein} strokeWidth="1.5" /><Path d="M10 52 C20 50 26 56 40 52" stroke={C.vein} strokeWidth="1" fill="none" /><Rect x="20" y="40" width="8" height="12" rx="2" fill={C.blush} /><Rect x="34" y="36" width="9" height="16" rx="3" fill={C.lilac} /></G>),
    mirror: (<G><Circle cx="32" cy="28" r="20" fill={C.glass} stroke={C.gold} strokeWidth="3" /><Path d="M22 22 C24 16 30 13 34 13" stroke={C.white} strokeWidth="3" fill="none" strokeLinecap="round" /><Rect x="30" y="48" width="4" height="8" fill={C.gold} /><Rect x="22" y="55" width="20" height="4" rx="2" fill={C.gold} /></G>),
    perfume: (<G><Path d="M18 58 C14 46 18 34 32 32 C46 34 50 46 46 58z" fill={C.blush} /><Rect x="27" y="22" width="10" height="11" fill={C.plum} /><Circle cx="32" cy="16" r="7" fill={C.lilac} /><Path d="M24 44 C28 40 36 40 40 44" stroke={C.white} strokeWidth="2" fill="none" opacity="0.7" /></G>),
    scrunchie: (<G><Ellipse cx="32" cy="50" rx="20" ry="9" fill={C.peach} /><Ellipse cx="32" cy="50" rx="9" ry="3.5" fill={C.cream} /><Path d="M14 48 C20 42 26 52 32 44 C38 52 44 42 50 48" stroke={C.blush} strokeWidth="2" fill="none" /></G>),
    roller: (<G><Rect x="30" y="26" width="4" height="30" rx="2" fill={C.gold} /><Ellipse cx="32" cy="18" rx="12" ry="6" fill="#F4C6D3" /><Ellipse cx="32" cy="56" rx="7" ry="4" fill="#F4C6D3" /></G>),
    notebook: (<G><Rect x="14" y="40" width="38" height="18" rx="3" fill={C.blush} /><Rect x="14" y="40" width="38" height="5" rx="2" fill={C.plum} /><Rect x="40" y="44" width="4" height="14" fill={C.gold} /><Path d="M20 50 h14 M20 54 h10" stroke={C.white} strokeWidth="1.5" /></G>),
    tea: (<G><Ellipse cx="32" cy="58" rx="22" ry="3" fill={C.vein} /><Path d="M16 38 h28 v8 C44 54 38 58 30 58 C22 58 16 54 16 46z" fill={C.cream} stroke={C.mauve} strokeWidth="1.5" /><Path d="M44 42 C52 42 52 52 43 51" stroke={C.mauve} strokeWidth="2" fill="none" /><Path d="M24 32 C22 28 26 26 24 22 M32 32 C30 28 34 26 32 22" stroke={C.mauve} strokeWidth="1.5" fill="none" opacity="0.6" /><Rect x="34" y="38" width="4" height="8" fill={C.leaf} /></G>),
    'gold-mirror': (<G><Ellipse cx="32" cy="26" rx="18" ry="22" fill={C.glass} stroke={C.gold} strokeWidth="4" /><Circle cx="32" cy="4" r="4" fill={C.gold} /><Path d="M24 18 C26 12 32 9 36 10" stroke={C.white} strokeWidth="3" fill="none" strokeLinecap="round" /><Rect x="26" y="50" width="12" height="8" rx="2" fill={C.gold} /></G>),
    orchid: (<G><Rect x="24" y="44" width="16" height="14" rx="3" fill={C.white} stroke={C.vein} strokeWidth="1.5" /><Path d="M32 44 C32 30 36 20 44 14" stroke={C.leaf} strokeWidth="2" fill="none" /><Circle cx="44" cy="14" r="6" fill={C.white} stroke={C.lilac} strokeWidth="1.5" /><Circle cx="38" cy="22" r="5" fill={C.white} stroke={C.lilac} strokeWidth="1.5" /><Circle cx="44" cy="14" r="2" fill={C.plum} /></G>),
    crystal: (<G><Path d="M32 8 L46 24 L40 58 H24 L18 24z" fill={C.lilac} opacity="0.85" /><Path d="M32 8 L32 58 M18 24 H46" stroke={C.white} strokeWidth="1.5" opacity="0.8" /><Circle cx="40" cy="18" r="2" fill={C.white} /></G>),
  }[id]
  return <Svg width={size} height={size} viewBox="0 0 64 64">{art || <Circle cx="32" cy="40" r="14" fill={C.mauve} />}</Svg>
}

// ---------- Spaces: background + where items stand ----------
// Each slot is the bottom-centre of an item, in the 360 × 300 box.
const rowSlots = (y, n, from = 60, to = 300) => Array.from({ length: n }, (_, i) => ({ x: from + (n === 1 ? (to - from) / 2 : (i * (to - from)) / (n - 1)), y }))
export const SLOTS = {
  pouch: rowSlots(205, 4, 105, 255),
  case: [...rowSlots(150, 3, 110, 250), ...rowSlots(235, 3, 110, 250)],
  shelf: [...rowSlots(105, 3, 90, 270), ...rowSlots(185, 3, 90, 270), ...rowSlots(265, 3, 90, 270)],
  table: [...rowSlots(120, 3, 70, 120), ...rowSlots(120, 3, 240, 290), ...rowSlots(205, 6, 60, 300)],
  bathroom: [...rowSlots(95, 4, 40, 140), ...rowSlots(160, 4, 40, 140), ...rowSlots(225, 4, 200, 330), ...rowSlots(95, 4, 220, 330)],
}

export function SpaceArt({ id, width }) {
  const h = (width * 300) / 360
  return (
    <Svg width={width} height={h} viewBox="0 0 360 300">
      <Defs>
        <LinearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FBF3F6" /><Stop offset="1" stopColor="#F4E7EE" /></LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="360" height="300" rx="24" fill="url(#wall)" />
      {id === 'pouch' && (<G>
        <Path d="M70 210 C70 150 90 130 180 130 C270 130 290 150 290 210 C290 250 270 270 180 270 C90 270 70 250 70 210z" fill={C.blush} />
        <Path d="M78 150 C110 138 250 138 282 150" stroke={C.plum} strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="2 7" />
        <Circle cx="282" cy="150" r="8" fill={C.gold} />
        <Path d="M90 230 C130 250 230 250 270 230" stroke={C.white} strokeWidth="3" fill="none" opacity="0.6" />
      </G>)}
      {id === 'case' && (<G>
        <Path d="M150 60 C150 40 210 40 210 60" stroke={C.plum} strokeWidth="8" fill="none" strokeLinecap="round" />
        <Rect x="70" y="62" width="220" height="210" rx="20" fill={C.mauve} />
        <Rect x="82" y="74" width="196" height="88" rx="12" fill={C.blush} />
        <Rect x="82" y="168" width="196" height="92" rx="12" fill={C.blush} />
        <Rect x="170" y="268" width="20" height="8" rx="3" fill={C.gold} />
      </G>)}
      {id === 'shelf' && (<G>
        {[105, 185, 265].map(y => (<G key={y}><Rect x="50" y={y} width="260" height="10" rx="3" fill={C.wood} /><Rect x="70" y={y + 10} width="6" height="10" fill={C.woodDark} /><Rect x="284" y={y + 10} width="6" height="10" fill={C.woodDark} /></G>))}
      </G>)}
      {id === 'table' && (<G>
        <Ellipse cx="180" cy="90" rx="62" ry="72" fill={C.glass} stroke={C.gold} strokeWidth="5" />
        <Path d="M150 50 C160 36 180 30 196 32" stroke={C.white} strokeWidth="5" fill="none" strokeLinecap="round" />
        <Rect x="40" y="120" width="90" height="8" rx="3" fill={C.wood} />
        <Rect x="230" y="120" width="90" height="8" rx="3" fill={C.wood} />
        <Rect x="30" y="205" width="300" height="14" rx="5" fill={C.marble} stroke={C.vein} strokeWidth="1.5" />
        <Rect x="40" y="219" width="280" height="62" rx="8" fill={C.wood} />
        <Rect x="60" y="232" width="110" height="36" rx="6" fill={C.cream} /><Rect x="190" y="232" width="110" height="36" rx="6" fill={C.cream} />
        <Circle cx="115" cy="250" r="4" fill={C.gold} /><Circle cx="245" cy="250" r="4" fill={C.gold} />
      </G>)}
      {id === 'bathroom' && (<G>
        {Array.from({ length: 10 }).map((_, i) => <Line key={i} x1="0" y1={30 * i} x2="360" y2={30 * i} stroke="#EFE3EA" strokeWidth="1" />)}
        <Rect x="20" y="95" width="140" height="8" rx="3" fill={C.wood} /><Rect x="20" y="160" width="140" height="8" rx="3" fill={C.wood} />
        <Rect x="205" y="95" width="140" height="8" rx="3" fill={C.wood} />
        <Rect x="190" y="225" width="160" height="14" rx="5" fill={C.marble} stroke={C.vein} strokeWidth="1.5" />
        <Ellipse cx="270" cy="232" rx="34" ry="6" fill={C.white} stroke={C.vein} strokeWidth="1" />
        <Rect x="200" y="239" width="140" height="50" rx="8" fill={C.sage} />
        <Rect x="25" y="200" width="120" height="80" rx="10" fill={C.glass} stroke={C.white} strokeWidth="4" />
        <Path d="M45 270 C70 230 110 230 130 210" stroke={C.leaf} strokeWidth="3" fill="none" />
      </G>)}
    </Svg>
  )
}

export const SPARKLE_COLOR = C.gold

// The weekly box: closed, or open with its flaps out.
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
