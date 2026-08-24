import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'
import { getProducts, initializeIAP, purchasePremium } from '../utils/inAppPurchases'
import { isPremiumUser, setPremium } from '../utils/premium'

export default function PremiumScreen({ route }) {
  const { userId } = route.params
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])

  useEffect(() => {
    checkPremium()
    setupIAP()
  }, [userId])

  const checkPremium = async () => {
    const premium = await isPremiumUser(userId)
    setIsPremium(premium)
  }

  const setupIAP = async () => {
    try {
      await initializeIAP()
      const prods = await getProducts()
      setProducts(prods)
    } catch (error) {
      console.error('Setup IAP error:', error)
    }
  }

  const handlePurchase = async () => {
    setLoading(true)
    try {
      const result = await purchasePremium(userId)
      if (result.success) {
        await setPremium(userId, true)
        setIsPremium(true)
        Alert.alert('Success', '🎉 Welcome to Premium!\n\nEnjoy unlimited features!')
      } else {
        Alert.alert('Error', 'Purchase failed. Please try again.')
      }
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
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
            <Text style={styles.detail}>Plan: Premium Monthly</Text>
            <Text style={styles.detail}>Status: Active</Text>
            <Text style={styles.detail}>Auto-renews monthly</Text>
          </View>
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
          <Text style={styles.trial}>Auto-renews. Cancel anytime.</Text>
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
          <Text style={styles.faqA}>Yes! Manage your subscription in App Store Settings.</Text>
          <Text style={[styles.faqQ, { marginTop: 12 }]}>Is there a free trial?</Text>
          <Text style={styles.faqA}>We offer a 30-day money-back guarantee!</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.upgradeBtn} onPress={handlePurchase} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.upgradeBtnText}>Start Premium Now</Text>
        )}
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