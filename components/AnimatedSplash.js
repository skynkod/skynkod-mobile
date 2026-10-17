import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'

const LOGO_WHITE = require('../assets/images/skynkod-logo-white.png')
const LOGO_RATIO = 1306 / 333
const BRAND_MAUVE = '#C5A8BB' // the logo's own colour
const MIN_DURATION = 1200

// Simple splash: the white logo on the logo's mauve, shown while the app
// loads, then faded out once `ready` is true. Matches the native splash in
// app.json so there is no jump between the two.
export default function AnimatedSplash({ ready, onDone }) {
  const { width } = useWindowDimensions()
  const logoWidth = Math.min(width * 0.6, 260)

  const fade = useRef(new Animated.Value(1)).current
  const [minTimeDone, setMinTimeDone] = useState(false)

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
    const timer = setTimeout(() => setMinTimeDone(true), MIN_DURATION)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready || !minTimeDone) return
    Animated.timing(fade, { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true })
      .start(() => onDone?.())
  }, [ready, minTimeDone])

  return (
    <Animated.View
      pointerEvents={ready && minTimeDone ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, styles.container, { opacity: fade }]}
    >
      <Animated.Image source={LOGO_WHITE} resizeMode="contain" style={{ width: logoWidth, height: logoWidth / LOGO_RATIO }} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_MAUVE, zIndex: 100 },
})
