import React, { useEffect } from 'react'
import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { unlock } from '../utils/privacy'
import { SPACING, TYPE } from '../utils/theme'

const LOGO = require('../assets/images/skynkod-logo.png')

// Face ID lock (Settings › Privacy): shown when the app opens or comes back.
export default function LockScreen({ onUnlock }) {
  const colors = useColors()
  const t = useT()
  const ask = async () => { if (await unlock(t('Unlock Skynkod')).catch(() => false)) onUnlock() }
  useEffect(() => { ask() }, [])
  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <Image source={LOGO} resizeMode="contain" style={{ width: 200, height: 52 }} />
      <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.lg }]}>{t('Your skin journal is locked.')}</Text>
      <Pressable onPress={ask} style={[styles.btn, { backgroundColor: colors.primary }]}>
        <Ionicons name="lock-open-outline" size={18} color={colors.onPrimary} />
        <Text style={[TYPE.bodyStrong, { color: colors.onPrimary }]}>{t('Unlock')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  btn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: 999, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, marginTop: SPACING.xxl },
})
