import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { isPremiumUser } from '../utils/premium'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function PremiumScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [isUserPremium, setIsUserPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkPremiumStatus()
  }, [userId])

  const checkPremiumStatus = async () => {
    try {
      const premium = await isPremiumUser(userId)
      setIsUserPremium(premium)
    } catch (error) {
      console.error('Error checking premium status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartPremium = () => {
    Alert.alert(
      'Start Premium',
      'Premium subscription: $4.99/month\n\nIncluding:\n✅ Unlimited Koda Chat\n✅ Routine Generator\n✅ Photo Analysis\n✅ Export Reports',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Subscribe',
          onPress: () => {
            Alert.alert('Coming Soon', 'In-App Purchase integration coming in next update!')
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (isUserPremium) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Premium</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>You're premium!</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.premiumCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.premiumEmoji}>👑</Text>
            <Text style={styles.premiumTitle}>Premium Member</Text>
            <Text style={styles.premiumDesc}>Enjoy unlimited access to all features!</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Benefits</Text>
            
            <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
              <Text style={styles.benefitEmoji}>✨</Text>
              <View style={styles.benefitContent}>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Unlimited Koda Chat</Text>
                <Text style={[styles.benefitDesc, { color: colors.muted }]}>Ask Koda anything, anytime</Text>
              </View>
            </View>

            <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
              <Text style={styles.benefitEmoji}>🔄</Text>
              <View style={styles.benefitContent}>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Routine Generator</Text>
                <Text style={[styles.benefitDesc, { color: colors.muted }]}>AI-generated personalized routines</Text>
              </View>
            </View>

            <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
              <Text style={styles.benefitEmoji}>📸</Text>
              <View style={styles.benefitContent}>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Photo Analysis</Text>
                <Text style={[styles.benefitDesc, { color: colors.muted }]}>AI analyzes your skin progress</Text>
              </View>
            </View>

            <View style={[styles.benefitCard, { backgroundColor: colors.card }]}>
              <Text style={styles.benefitEmoji}>📊</Text>
              <View style={styles.benefitContent}>
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Export Reports</Text>
                <Text style={[styles.benefitDesc, { color: colors.muted }]}>Download your skin data</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Go Premium</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Unlock all features</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.priceCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.priceEmoji}>👑</Text>
          <Text style={styles.price}>$4.99</Text>
          <Text style={styles.pricePeriod}>/month</Text>
          <Text style={styles.priceDesc}>Cancel anytime</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>What You Get</Text>
          
          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureCheckmark}>✅</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Unlimited Koda Chat</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Unlimited daily conversations with your AI skin coach</Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureCheckmark}>✅</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Routine Generator</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Get AI-generated personalized skincare routines</Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureCheckmark}>✅</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Photo Analysis</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>AI analyzes your photos for skin improvements</Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureCheckmark}>✅</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Export Reports</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Download your complete skin tracking data</Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureCheckmark}>✅</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Priority Support</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Get fast support from our team</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.faqCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.faqTitle, { color: colors.text }]}>Frequently Asked</Text>
            <Text style={[styles.faqText, { color: colors.muted }]}>
              <Text style={{ fontWeight: '600' }}>Can I cancel anytime?</Text>{'\n'}
              Yes, you can cancel your subscription at any time without penalties.
            </Text>
            <Text style={[styles.faqText, { color: colors.muted, marginTop: 12 }]}>
              <Text style={{ fontWeight: '600' }}>Is there a free trial?</Text>{'\n'}
              Coming soon! Free trial will be available in the next update.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
          onPress={handleStartPremium}
        >
          <Text style={styles.ctaBtnText}>Start Premium Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  priceCard: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24 },
  premiumCard: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24 },
  premiumEmoji: { fontSize: 60, marginBottom: 12 },
  premiumTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  premiumDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  priceEmoji: { fontSize: 48, marginBottom: 12 },
  price: { fontSize: 48, fontWeight: 'bold', color: 'white' },
  pricePeriod: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  priceDesc: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  featureCard: { flexDirection: 'row', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'flex-start' },
  benefitCard: { flexDirection: 'row', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'flex-start' },
  featureCheckmark: { fontSize: 20, marginRight: 12, marginTop: 2 },
  benefitEmoji: { fontSize: 24, marginRight: 12, marginTop: 2 },
  featureContent: { flex: 1 },
  benefitContent: { flex: 1 },
  featureTitle: { fontWeight: 'bold', fontSize: 14 },
  benefitTitle: { fontWeight: 'bold', fontSize: 14 },
  featureDesc: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  benefitDesc: { fontSize: 12, marginTop: 4 },
  faqCard: { borderRadius: 12, padding: 16 },
  faqTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 12 },
  faqText: { fontSize: 12, lineHeight: 18 },
  ctaBtn: { padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 24, marginTop: 24 },
  ctaBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
})