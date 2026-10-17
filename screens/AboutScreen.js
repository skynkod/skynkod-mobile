import React from 'react'
import { View, Text, StyleSheet, Linking } from 'react-native'
import { logError } from '../utils/errorLogger'
import { APP_INFO } from '../utils/constants'
import { Screen, Card, SectionHeader, ListRow, IconCircle, useColors } from '../components/ui'
import { SPACING, TYPE } from '../utils/theme'

const FEATURES = [
  'Daily skin tracking and journaling',
  'AI-powered skincare advice with Koda',
  'Progress photo management',
  'Routine building and tracking',
  'Product tracking and analytics',
  'Budget management for skincare products',
]

export default function AboutScreen() {
  const colors = useColors()

  const open = async (url) => {
    try {
      if (await Linking.canOpenURL(url)) await Linking.openURL(url)
    } catch (error) {
      await logError('AboutScreen_openLink', error, { url })
    }
  }

  return (
    <Screen back>
      <View style={styles.hero}>
        <IconCircle name="sparkles" size={80} />
        <Text style={[TYPE.title, { color: colors.text, marginTop: SPACING.lg }]}>Skynkod</Text>
        <Text style={[TYPE.body, { color: colors.muted }]}>Your AI skin coach · v{APP_INFO.version}</Text>
      </View>

      <Card>
        <Text style={[TYPE.body, { color: colors.textSecondary }]}>
          Skynkod is your personal AI-powered skincare companion. We combine AI with dermatological knowledge to give you advice tailored to your skin type and concerns.
        </Text>
      </Card>

      <SectionHeader title="What you can do" style={{ marginTop: SPACING.xl }} />
      <Card>
        {FEATURES.map((f, idx) => (
          <View key={f} style={[styles.feature, idx === FEATURES.length - 1 && { marginBottom: 0 }]}>
            <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
            <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{f}</Text>
          </View>
        ))}
      </Card>

      <SectionHeader title="Support & legal" style={{ marginTop: SPACING.xl }} />
      <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
        <ListRow icon="mail-outline" title="Contact support" subtitle="support@skynkod.com" onPress={() => open('mailto:support@skynkod.com')} />
        <ListRow icon="globe-outline" title="Website" subtitle="skynkod.com" onPress={() => open('https://skynkod.com')} />
        <ListRow icon="shield-outline" title="Privacy policy" onPress={() => open('https://skynkod.com/privacy')} />
        <ListRow icon="document-text-outline" title="Terms of service" onPress={() => open('https://skynkod.com/terms')} last />
      </Card>

      <Text style={[TYPE.caption, { color: colors.muted, textAlign: 'center', marginTop: SPACING.xxl }]}>Made with care for your skin 💜</Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: SPACING.xxl },
  feature: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  bullet: { width: 6, height: 6, borderRadius: 3 },
})
