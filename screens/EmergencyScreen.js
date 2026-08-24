import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function EmergencyScreen() {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`)
  }

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`)
  }

  const emergencyContacts = [
    { emoji: '🏥', name: 'Dermatologist', phone: '1-800-DERM-HELP', number: '1-800-3376-4357' },
    { emoji: '⚠️', name: 'Poison Control', phone: '1-800-222-1222', number: '1-800-222-1222' },
    { emoji: '🚑', name: 'Emergency', phone: '911', number: '911' },
  ]

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Emergency</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Important contacts</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.warningCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <Text style={styles.warningTitle}>Important</Text>
          <Text style={styles.warningText}>
            If you experience severe skin reactions or allergies, seek medical attention immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contacts</Text>
          
          {emergencyContacts.map((contact, idx) => (
            <View key={idx} style={[styles.contactCard, { backgroundColor: colors.card }]}>
              <View style={styles.contactHeader}>
                <Text style={styles.contactEmoji}>{contact.emoji}</Text>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                  <Text style={[styles.contactPhone, { color: colors.muted }]}>{contact.phone}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleCall(contact.number)}
              >
                <Text style={styles.callBtnText}>📞 Call</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>When to Seek Help</Text>
          
          <View style={[styles.guideCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.guideItemTitle, { color: colors.text }]}>🔴 Seek Immediate Help If:</Text>
            <Text style={[styles.guideItem, { color: colors.muted }]}>• Severe allergic reactions (swelling, difficulty breathing)</Text>
            <Text style={[styles.guideItem, { color: colors.muted }]}>• Signs of infection (fever, severe redness)</Text>
            <Text style={[styles.guideItem, { color: colors.muted }]}>• Chemical burns or severe skin damage</Text>
            <Text style={[styles.guideItem, { color: colors.muted }]}>• Accidental ingestion of skincare products</Text>
          </View>

          <View style={[styles.guideCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.guideItemTitle, { color: colors.text }]}>🟡 Contact Your Dermatologist If:</Text>
            <Text style={[styles.guideItem, { color: colors.muted }]}>• Persistent skin issues lasting 2+ weeks</Text>
            <Text style={[styles.guideItem, { color: colors.muted }]}>• Recurring breakouts or rashes</Text>
            <Text style={[styles.guideItem, { color: colors.muted }]}>• New or worsening skin conditions</Text>
            <Text style={[styles.guideItem, { color: colors.muted }]}>• Uncertainty about your skin type or concerns</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          
          <TouchableOpacity
            style={[styles.supportBtn, { backgroundColor: colors.card }]}
            onPress={() => handleEmail('support@skynkod.com')}
          >
            <Text style={styles.supportBtnEmoji}>📧</Text>
            <View style={styles.supportBtnContent}>
              <Text style={[styles.supportBtnTitle, { color: colors.text }]}>Email Support</Text>
              <Text style={[styles.supportBtnDesc, { color: colors.muted }]}>support@skynkod.com</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.supportBtn, { backgroundColor: colors.card }]}
            onPress={() => Alert.alert('Contact Us', 'Chat support coming soon!')}
          >
            <Text style={styles.supportBtnEmoji}>💬</Text>
            <View style={styles.supportBtnContent}>
              <Text style={[styles.supportBtnTitle, { color: colors.text }]}>Live Chat</Text>
              <Text style={[styles.supportBtnDesc, { color: colors.muted }]}>Coming soon</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.disclaimerSection}>
          <View style={[styles.disclaimerCard, { backgroundColor: colors.border }]}>
            <Text style={[styles.disclaimerText, { color: colors.text }]}>
              Skynkod is not a substitute for professional medical advice. Always consult with a qualified dermatologist for serious skin concerns.
            </Text>
          </View>
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
  warningCard: { borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 24 },
  warningEmoji: { fontSize: 48, marginBottom: 12 },
  warningTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  warningText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  contactCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  contactHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  contactEmoji: { fontSize: 32, marginRight: 12 },
  contactInfo: { flex: 1 },
  contactName: { fontWeight: 'bold', fontSize: 14 },
  contactPhone: { fontSize: 12, marginTop: 2 },
  callBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  callBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  guideCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  guideItemTitle: { fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  guideItem: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  supportBtn: { flexDirection: 'row', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  supportBtnEmoji: { fontSize: 32, marginRight: 12 },
  supportBtnContent: { flex: 1 },
  supportBtnTitle: { fontWeight: 'bold', fontSize: 14 },
  supportBtnDesc: { fontSize: 12, marginTop: 2 },
  disclaimerSection: { marginBottom: 24 },
  disclaimerCard: { borderRadius: 12, padding: 16 },
  disclaimerText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
})