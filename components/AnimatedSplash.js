import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, View, Text, Image, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'

const LOGO_WHITE = require('../assets/images/skynkod-logo-white.png')
const KODA_WHITE = require('../assets/images/koda-logo-white.png')
const LOGO_RATIO = 1306 / 333
const BRAND_MAUVE = '#C5A8BB' // the logo's own colour
const MIN_DURATION = 2200
const POWERED_DELAY = 600

// Simple splash: the white logo on the logo's mauve, shown while the app
// loads, then faded out once `ready` is true. Matches the native splash in
// app.json so there is no jump between the two.
export default function AnimatedSplash({ ready, onDone }) {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const logoWidth = Math.min(width * 0.6, 260)

  const fade = useRef(new Animated.Value(1)).current
  const powered = useRef(new Animated.Value(0)).current
  const [minTimeDone, setMinTimeDone] = useState(false)

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
    // "Powered by KODA" comes in just after the logo.
    Animated.timing(powered, { toValue: 1, duration: 450, delay: POWERED_DELAY, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()
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

      <Animated.View
        style={[
          styles.powered,
          {
            bottom: insets.bottom + 36,
            opacity: powered,
            transform: [{ translateY: powered.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          },
        ]}
      >
        <Image source={KODA_WHITE} style={styles.kodaIcon} />
        <View>
          <Text style={styles.poweredBy}>Powered by</Text>
          <Text style={styles.koda}>KODA</Text>
        </View>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND_MAUVE, zIndex: 100 },
  powered: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 9 },
  kodaIcon: { width: 24, height: 24 },
  poweredBy: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '500' },
  koda: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 1.2, marginTop: -1 },
})
