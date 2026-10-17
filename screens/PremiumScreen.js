import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { logError } from '../utils/errorLogger'
import { PREMIUM_FEATURES } from '../utils/constants'
import { Screen, Card, Button, IconCircle, useColors } from '../components/ui'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const FEATURE_ICONS = ['chatbubbles-outline', 'water-outline', 'scan-outline', 'document-text-outline', 'heart-outline']

export default function PremiumScreen({ route }) {
  const { userId } = route.params
  const colors = useColors()
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('skynkod_premium')
      .then(v => setIsPremium(v === 'true'))
      .catch(error => logError('PremiumScreen_status', error, { userId }))
  }, [userId])

  const handleStart = () => {
    Alert.alert('Premium coming soon', 'In-app purchases will be available in the next update. Thank you for your interest!')
  }

  return (
    <Screen
      back
      footer={!isPremium ? <Button title="Start Premium · $4.99/month" icon="diamond-outline" onPress={handleStart} /> : null}
    >
      <View style={styles.hero}>
        <IconCircle name="diamond" size={80} />
        <Text style={[TYPE.overline, { color: colors.primary, marginTop: SPACING.xl }]}>Skynkod Premium</Text>
        <Text style={[TYPE.title, { color: colors.text, textAlign: 'center', marginTop: SPACING.sm }]}>
          {isPremium ? "You're Premium ✨" : 'Your best skin, unlocked'}
        </Text>
        <Text style={[TYPE.body, { color: colors.muted, textAlign: 'center', marginTop: SPACING.sm }]}>
          {isPremium ? 'Enjoy every feature, no limits.' : 'Unlimited Koda, smarter routines and deeper insights.'}
        </Text>
      </View>

      <Card>
        {PREMIUM_FEATURES.map((feature, idx) => (
          <View key={feature} style={[styles.feature, idx === PREMIUM_FEATURES.length - 1 && { marginBottom: 0 }]}>
            <IconCircle name={FEATURE_ICONS[idx] || 'sparkles-outline'} size={36} />
            <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{feature}</Text>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>
        ))}
      </Card>

      {!isPremium ? (
        <View style={[styles.price, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}>
          <View>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>Monthly</Text>
            <Text style={[TYPE.caption, { color: colors.muted }]}>Cancel anytime</Text>
          </View>
          <Text style={[TYPE.heading, { color: colors.primary }]}>$4.99</Text>
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: SPACING.xxl },
  feature: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  price: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.xl },
})
