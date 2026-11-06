import React from 'react'
import { Image } from 'react-native'

// Rekod's official logo (Lita, 2026-11-06): the glossy renewal loop around a skin
// cell, the same image everywhere. It keeps its own colours; `dimmed` (an inactive
// tab) only fades it.
const LOGO = require('../assets/glossy/icon-rekod.png')

export default function RekodIcon({ size = 24, dimmed = false }) {
  return <Image source={LOGO} style={{ width: size * 1.15, height: size * 1.15, margin: -size * 0.075, opacity: dimmed ? 0.55 : 1 }} resizeMode="contain" />
}
