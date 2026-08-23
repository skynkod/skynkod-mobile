import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.title}>Skynkod</Text>
        <Text style={styles.version}>v1.0.0</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.cardText}>
          Skynkod is your personal AI-powered skincare companion. Track your skin daily, get personalized advice from Koda (powered by Claude AI), and watch your skin improve over time.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Features</Text>
        <Text style={styles.featureItem}>📔 Daily Skin Journal</Text>
        <Text style={styles.featureItem}>🤖 AI Coach (Koda)</Text>
        <Text style={styles.featureItem}>📊 Progress Charts</Text>
        <Text style={styles.featureItem}>🔄 Skincare Routines</Text>
        <Text style={styles.featureItem}>📸 Photo Tracking</Text>
        <Text style={styles.featureItem}>💰 Budget Tracker</Text>
        <Text style={styles.featureItem}>🎯 Skin Type Quiz</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Technology</Text>
        <Text style={styles.techItem}>• React Native + Expo</Text>
        <Text style={styles.techItem}>• Supabase (PostgreSQL)</Text>
        <Text style={styles.techItem}>• Anthropic Claude API</Text>
        <Text style={styles.techItem}>• React Navigation</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Built By</Text>
        <Text style={styles.cardText}>
          Lita - A full-stack mobile developer passionate about skincare and AI.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Links</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/skynkod/skynkod-mobile')}>
          <Text style={styles.link}>🔗 GitHub Repository</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for beautiful skin</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg, padding: 16 },
  header: { alignItems: 'center', marginBottom: 24 },
  emoji: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  version: { fontSize: 12, color: SKYNKOD_COLORS.muted, marginTop: 4 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: SKYNKOD_COLORS.text, marginBottom: 12 },
  cardText: { color: SKYNKOD_COLORS.muted, fontSize: 14, lineHeight: 20 },
  featureItem: { color: SKYNKOD_COLORS.text, fontSize: 14, marginBottom: 8 },
  techItem: { color: SKYNKOD_COLORS.muted, fontSize: 14, marginBottom: 6, fontFamily: 'Courier' },
  link: { color: SKYNKOD_COLORS.primary, fontSize: 14, fontWeight: 'bold', textDecorationLine: 'underline' },
  footer: { alignItems: 'center', paddingVertical: 20 },
  footerText: { color: SKYNKOD_COLORS.muted, fontSize: 12, fontStyle: 'italic' },
})