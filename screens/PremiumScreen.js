import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, AsyncStorage } from 'react-native'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { logError } from '../utils/errorLogger'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { PREMIUM_FEATURES } from '../utils/constants'

export default function PremiumScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkPremiumStatus()
  }, [userId])

  const checkPremiumStatus = async () => {
    try {
      const premium = await AsyncStorage.getItem('skynkod_premium')
      setIsPremium(premium === 'true')
    } catch (error) {
      await logError('PremiumScreen_checkPremiumStatus', error, { userId }, 'warn')
    }
  }

  const handleStartPremium = async () => {
    try {
      Alert.alert(
        'Premium Coming Soon',
        'In-App Purchase integration will be available in the next update. Thank you for your interest!',
        [{ text: 'OK', onPress: () => {} }]
      )
    } catch (error) {
      await logError('PremiumScreen_handleStartPremium', error, { userId }, 'error')
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Skynkod Premium</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Unlock all features</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.statusCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.statusEmoji}>{isPremium ? '👑' : '✨'}</Text>
          <Text style={styles.statusText}>
            {isPremium ? 'You are a Premium Member!' : 'Upgrade to Premium'}
          </Text>
          <Text style={styles.statusSubtext}>
            {isPremium ? 'Enjoy unlimited features' : 'Get exclusive benefits'}
          </Text>
        </View>

        {!isPremium && (
          <View style={[styles.priceCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.price, { color: colors.primary }]}>$4.99</Text>
            <Text style={[styles.pricePeriod, { color: colors.muted }]}>/month</Text>
            <Text style={[styles.priceDescription, { color: colors.text }]}>
              Unlimited access to all features
            </Text>
          </View>
        )}

        <View style={[styles.featuresCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>Premium Features</Text>

          {PREMIUM_FEATURES.map((feature, idx) => (
            <View key={idx} style={[styles.feature, { borderBottomColor: colors.border }]}>
              <Text style={styles.featureEmoji}>✨</Text>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureName, { color: colors.text }]}>
                  {feature}
                </Text>
              </View>
              <Text style={{ color: colors.primary }}>✓</Text>
            </View>
          ))}
        </View>

        {!isPremium && (
          <TouchableOpacity
            style={[styles.upgradeBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
            onPress={handleStartPremium}
            disabled={loading}
          >
            <Text style={styles.upgradeBtnText}>Start Premium Now</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            💡 Premium members get priority support and exclusive features
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  statusCard: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24 },
  statusEmoji: { fontSize: 48, marginBottom: 12 },
  statusText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  statusSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  priceCard: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24 },
  price: { fontSize: 36, fontWeight: 'bold' },
  pricePeriod: { fontSize: 14 },
  priceDescription: { fontSize: 12, marginTop: 8 },
  featuresCard: { borderRadius: 12, marginBottom: 24, overflow: 'hidden' },
  featuresTitle: { fontSize: 16, fontWeight: 'bold', padding: 16, paddingBottom: 8 },
  feature: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  featureEmoji: { fontSize: 20, marginRight: 12 },
  featureInfo: { flex: 1 },
  featureName: { fontSize: 14, fontWeight: '500' },
  upgradeBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 24 },
  upgradeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  infoCard: { borderRadius: 12, padding: 16 },
  infoText: { fontSize: 12, lineHeight: 18 },
})
