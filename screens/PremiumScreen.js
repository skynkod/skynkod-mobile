import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'
import { isPremiumUser, setPremium } from '../utils/premium'

export default function PremiumScreen({ route }) {
  const { userId } = route.params
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    checkPremium()
  }, [userId])

  const checkPremium = async () => {
    const premium = await isPremiumUser(userId)
    setIsPremium(premium)
  }

  const handleUpgrade = async () => {
    Alert.alert(
      'Upgrade to Premium',
      'In a real app, this would open Stripe payment!\n\nFor now, we\'re adding 30 days free trial.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Start Free Trial',
          onPress: async () => {
            await setPremium(userId, true)
            setIsPremium(true)
            Alert.alert('Success', '🎉 You are now Premium!\n\nEnjoy unlimited features!')
          },
        },
      ]
    )
  }

  if (isPremium) {
    return (
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.crown}>👑</Text>
            <Text style={styles.title}>You're Premium!</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Active Benefits</Text>
            <Text style={styles.benefit}>✅ Unlimited Koda Chat</Text>
            <Text style={styles.benefit}>✅ Routine Generator</Text>
            <Text style={styles.benefit}>✅ Photo Analysis</Text>
            <Text style={styles.benefit}>✅ Export Reports</Text>
            <Text style={styles.benefit}>✅ No Ads</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Plan Details</Text>
            <Text style={styles.detail}>Plan: Premium Annual</Text>
            <Text style={styles.detail}>Status: Active</Text>
            <Text style={styles.detail}>Renews: In 30 days</Text>
          </View>

          <TouchableOpacity style={styles.manageBtn}>
            <Text style={styles.manageBtnText}>Manage Subscription</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Go Premium</Text>
          <Text style={styles.subtitle}>Unlock all features</Text>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.price}>$4.99</Text>
          <Text style={styles.period}>/month</Text>
          <Text style={styles.trial}>30 days free trial</Text>
        </View>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What's Included</Text>
          
          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🤖</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>Unlimited Koda</Text>
              <Text style={styles.featureDesc}>Chat with AI anytime</Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🔄</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>Routine Generator</Text>
              <Text style={styles.featureDesc}>AI creates custom routines</Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>📸</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>Photo Analysis</Text>
              <Text style={styles.featureDesc}>AI analyzes skin progress</Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>📊</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>Export Reports</Text>
              <Text style={styles.featureDesc}>Download your progress</Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureEmoji}>🚫</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>No Ads</Text>
              <Text style={styles.featureDesc}>Ad-free experience</Text>
            </View>
          </View>
        </View>

        <View style={styles.faqCard}>
          <Text style={styles.faqTitle}>FAQ</Text>
          <Text style={styles.faqQ}>Can I cancel anytime?</Text>
          <Text style={styles.faqA}>Yes! Cancel anytime from settings.</Text>
          <Text style={[styles.faqQ, { marginTop: 12 }]}>Do I get a refund?</Text>
          <Text style={styles.faqA}>30-day money-back guarantee!</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
        <Text style={styles.upgradeBtnText}>Start Free Trial</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg },
  scrollContent: { paddingBottom: 100 },
  header: { alignItems: 'center', paddingVertical: 40 },
  emoji: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  subtitle: { fontSize: 14, color: SKYNKOD_COLORS.muted, marginTop: 4 },
  crown: { fontSize: 50, marginBottom: 12 },
  priceCard: { backgroundColor: SKYNKOD_COLORS.primary, padding: 24, margin: 16, borderRadius: 12, alignItems: 'center' },
  price: { fontSize: 40, fontWeight: 'bold', color: 'white' },
  period: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  trial: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  card: { backgroundColor: 'white', padding: 16, margin: 16, borderRadius: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: SKYNKOD_COLORS.text, marginBottom: 12 },
  benefit: { color: SKYNKOD_COLORS.text, fontSize: 14, marginBottom: 8 },
  detail: { color: SKYNKOD_COLORS.muted, fontSize: 14, marginBottom: 6 },
  manageBtn: { backgroundColor: SKYNKOD_COLORS.border, padding: 12, margin: 16, borderRadius: 8 },
  manageBtnText: { color: SKYNKOD_COLORS.text, textAlign: 'center', fontWeight: 'bold' },
  featuresCard: { backgroundColor: 'white', padding: 16, margin: 16, borderRadius: 12 },
  featuresTitle: { fontSize: 16, fontWeight: 'bold', color: SKYNKOD_COLORS.text, marginBottom: 16 },
  feature: { flexDirection: 'row', marginBottom: 16 },
  featureEmoji: { fontSize: 24, marginRight: 12, width: 30 },
  featureText: { flex: 1 },
  featureName: { fontWeight: '600', color: SKYNKOD_COLORS.text, fontSize: 14 },
  featureDesc: { color: SKYNKOD_COLORS.muted, fontSize: 12, marginTop: 2 },
  faqCard: { backgroundColor: 'white', padding: 16, margin: 16, borderRadius: 12 },
  faqTitle: { fontSize: 16, fontWeight: 'bold', color: SKYNKOD_COLORS.text, marginBottom: 12 },
  faqQ: { fontWeight: '600', color: SKYNKOD_COLORS.text, fontSize: 13 },
  faqA: { color: SKYNKOD_COLORS.muted, fontSize: 12, marginTop: 4 },
  upgradeBtn: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: SKYNKOD_COLORS.primary, paddingVertical: 16, borderRadius: 12 },
  upgradeBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
})