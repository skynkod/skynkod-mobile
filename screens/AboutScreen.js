import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { logError } from '../utils/errorLogger'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { APP_INFO } from '../utils/constants'

export default function AboutScreen() {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const handleOpenLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      }
    } catch (error) {
      await logError('AboutScreen_openLink', error, { url }, 'error')
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>About Skynkod</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.logo, { color: colors.primary }]}>✨</Text>
          <Text style={[styles.appName, { color: colors.text }]}>Skynkod</Text>
          <Text style={[styles.appSubtitle, { color: colors.muted }]}>Your AI Skin Coach</Text>
          <Text style={[styles.version, { color: colors.muted }]}>v{APP_INFO.version}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>About Us</Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            Skynkod is your personal AI-powered skincare companion. We combine advanced AI technology with dermatological expertise to provide personalized skincare recommendations tailored to your unique skin type and concerns.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Features</Text>
          <Text style={[styles.cardText, { color: colors.muted }]}>
            • Daily skin tracking and journaling{'\n'}
            • AI-powered skincare advice with Koda{'\n'}
            • Progress photo management{'\n'}
            • Routine building and tracking{'\n'}
            • Product tracking and analytics{'\n'}
            • Budget management for skincare products
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Contact & Support</Text>
          <TouchableOpacity
            style={styles.link}
            onPress={() => handleOpenLink('mailto:support@skynkod.com')}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>📧 support@skynkod.com</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.link}
            onPress={() => handleOpenLink('https://skynkod.com')}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>🌐 Visit Website</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Privacy & Terms</Text>
          <TouchableOpacity
            style={styles.link}
            onPress={() => handleOpenLink('https://skynkod.com/privacy')}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>📋 Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.link}
            onPress={() => handleOpenLink('https://skynkod.com/terms')}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>📜 Terms of Service</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, { color: colors.muted }]}>
          Made with ❤️ for your skin health
        </Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16 },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  appName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  appSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 4 },
  version: { fontSize: 12, textAlign: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  cardText: { fontSize: 13, lineHeight: 20 },
  link: { marginVertical: 8 },
  linkText: { fontSize: 14, fontWeight: '600' },
  footer: { textAlign: 'center', marginVertical: 24, fontSize: 12 },
})
