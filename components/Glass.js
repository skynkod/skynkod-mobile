import React from 'react'
import { View, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import { useTheme } from '../utils/ThemeContext'
import { RADIUS } from '../utils/theme'

// Frosted glass: blurs what's behind (the Home sky) under a soft veil.
export default function Glass({ children, style, radius = RADIUS.xl }) {
  const { isDark } = useTheme()
  return (
    <View style={[styles.wrap, { borderRadius: radius, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)' }, style]}>
      <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(36,31,35,0.45)' : 'rgba(255,255,255,0.55)' }]} />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
})
