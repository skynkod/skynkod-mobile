import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function AboutScreen() {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>About Skynkod</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Your AI Skin Coach</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.heroTitle}>Skynkod v1.0.0</Text>
          <Text style={styles.heroSubtitle}>AI-Powered Skincare Tracking</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About Us</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionText, { color: colors.text }]}>
              Skynkod is a comprehensive skincare app powered by artificial intelligence. We help you track your skin's daily progress, manage your skincare routine, and get personalized advice from Koda, your AI skin coach.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Features</Text>
          
          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureEmoji}>📔</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Daily Journal</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Track your skin's mood and conditions</Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureEmoji}>✨</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Koda AI Coach</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Get personalized skincare advice</Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureEmoji}>🔄</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Routine Tracking</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Build streaks with daily reminders</Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureEmoji}>📸</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Photo Timeline</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Visualize your skin progress</Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureEmoji}>🧴</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Product Tracker</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>Manage your skincare products</Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <Text style={styles.featureEmoji}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>Analytics</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>See your skin improvement trends</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Technology</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <View style={styles.techRow}>
              <Text style={[styles.techLabel, { color: colors.muted }]}>Backend:</Text>
              <Text style={[styles.techValue, { color: colors.text }]}>Supabase</Text>
            </View>
            <View style={styles.techRow}>
              <Text style={[styles.techLabel, { color: colors.muted }]}>AI:</Text>
              <Text style={[styles.techValue, { color: colors.text }]}>Claude by Anthropic</Text>
            </View>
            <View style={styles.techRow}>
              <Text style={[styles.techLabel, { color: colors.muted }]}>Framework:</Text>
              <Text style={[styles.techValue, { color: colors.text }]}>React Native Expo</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact & Support</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.contactText, { color: colors.text }]}>
              📧 Email: support@skynkod.com{'\n\n'}
              🌐 Website: www.skynkod.com{'\n\n'}
              📱 Follow us on social media for skincare tips!
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Made with ❤️ for better skin
          </Text>
          <Text style={[styles.footerText, { color: colors.muted, marginTop: 8 }]}>
            © 2026 Skynkod. All rights reserved.
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
  heroCard: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24 },
  heroEmoji: { fontSize: 60, marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  sectionCard: { borderRadius: 12, padding: 16 },
  sectionText: { fontSize: 14, lineHeight: 20 },
  featureCard: { flexDirection: 'row', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'flex-start' },
  featureEmoji: { fontSize: 24, marginRight: 12, marginTop: 2 },
  featureContent: { flex: 1 },
  featureTitle: { fontWeight: 'bold', fontSize: 14 },
  featureDesc: { fontSize: 12, marginTop: 4 },
  techRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  techLabel: { fontWeight: '600', fontSize: 13 },
  techValue: { fontSize: 13 },
  contactText: { fontSize: 13, lineHeight: 20 },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontSize: 12, textAlign: 'center' },
})