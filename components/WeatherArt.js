import React from 'react'
import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg'

// Small weather drawings for the skin forecast (approved by Lita, 2026-10-23):
// soft sun, mauve clouds, light-blue rain. Drawn on a 64 × 52 grid.
const SUN = '#F6C97A'
const CLOUD = '#D9C9D3'
const RAIN = '#7FA6C9'
const SNOW = '#B9CFE3'

// WMO weather code (Open-Meteo) → which drawing.
export const skyKind = (code, isDay = true) => {
  if (code === 0) return isDay ? 'sunny' : 'night'
  if (code === 1 || code === 2) return isDay ? 'partly' : 'night'
  if (code === 45 || code === 48) return 'fog'
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
  if ([95, 96, 99].includes(code)) return 'storm'
  return 'cloudy'
}
export const SKY_LABEL = { sunny: 'Sunny', partly: 'Partly cloudy', cloudy: 'Cloudy', rain: 'Rain', storm: 'Storm', snow: 'Snow', night: 'Clear night', fog: 'Fog' }

const Cloud = ({ cloud = CLOUD, low }) => (
  low
    ? <><Ellipse cx="38" cy="36" rx="16" ry="9" fill={cloud} /><Circle cx="32" cy="30" r="9" fill={cloud} /></>
    : <><Ellipse cx="32" cy="22" rx="18" ry="10" fill={cloud} /><Circle cx="25" cy="16" r="9" fill={cloud} /><Circle cx="38" cy="14" r="8" fill={cloud} /></>
)

const DRAW = {
  sunny: () => (
    <>
      <Circle cx="32" cy="26" r="12" fill={SUN} />
      <G stroke={SUN} strokeWidth={3} strokeLinecap="round">
        <Line x1="32" y1="4" x2="32" y2="8" /><Line x1="32" y1="44" x2="32" y2="48" />
        <Line x1="10" y1="26" x2="14" y2="26" /><Line x1="50" y1="26" x2="54" y2="26" />
      </G>
    </>
  ),
  partly: () => <><Circle cx="24" cy="20" r="11" fill={SUN} /><Cloud low /></>,
  cloudy: () => <><Ellipse cx="32" cy="30" rx="20" ry="11" fill={CLOUD} /><Circle cx="24" cy="22" r="10" fill={CLOUD} /><Circle cx="38" cy="19" r="9" fill={CLOUD} /></>,
  rain: () => (
    <>
      <Cloud />
      <G stroke={RAIN} strokeWidth={3} strokeLinecap="round">
        <Line x1="22" y1="36" x2="19" y2="44" /><Line x1="32" y1="36" x2="29" y2="44" /><Line x1="42" y1="36" x2="39" y2="44" />
      </G>
    </>
  ),
  storm: () => <><Cloud /><Path d="M34 32l-6 10h6l-4 8" stroke={SUN} strokeWidth={3} fill="none" strokeLinejoin="round" /></>,
  snow: () => <><Cloud /><G fill={SNOW}><Circle cx="22" cy="40" r="3" /><Circle cx="32" cy="44" r="3" /><Circle cx="42" cy="40" r="3" /></G></>,
  night: () => <><Path d="M40 10a17 17 0 1 0 8 26A14 14 0 0 1 40 10z" fill="#E6D6A6" /><Circle cx="16" cy="12" r="1.5" fill="#C5A8BB" /><Circle cx="52" cy="10" r="1.5" fill="#C5A8BB" /></>,
  fog: () => (
    <G stroke={CLOUD} strokeWidth={4} strokeLinecap="round">
      <Line x1="12" y1="18" x2="44" y2="18" /><Line x1="18" y1="28" x2="52" y2="28" /><Line x1="10" y1="38" x2="40" y2="38" />
    </G>
  ),
}

// `light` draws the clouds paler, for the selected (plum) day tile.
export default function WeatherArt({ kind = 'cloudy', width = 64, light }) {
  const draw = DRAW[kind] || DRAW.cloudy
  return (
    <Svg width={width} height={(width * 52) / 64} viewBox="0 0 64 52">
      {light ? <G opacity={0.95}>{draw()}</G> : draw()}
    </Svg>
  )
}
