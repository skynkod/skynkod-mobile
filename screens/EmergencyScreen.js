import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { logError } from '../utils/errorLogger'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'

export default function EmergencyScreen() {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const emergencyContacts = [
    { name: 'Emergency Services', number: '911', emoji: '🚨' },
    { name: 'Poison Control', number: '1-800-222-1222', emoji: '☠️' },
    { name: 'Dermatology Hotline', number: '1-800-SKIN-911', emoji: '🏥' },
  ]

  const handleCall = async (number) => {
    try {
      const url = `tel:${number}`
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Error', 'Phone calls not supported on this device')
      }
    } catch (error) {
      await logError('EmergencyScreen_handleCall', error, { number }, 'error')
      Alert.alert('Error', 'Failed to make call')
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Emergency Contacts</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Important numbers</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.warningCard, { backgroundColor: '#FF6B6B' }]}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <Text style={styles.warningTitle}>For Skin Emergencies</Text>
          <Text style={styles.warningText}>
            If you experience severe allergic reactions, severe burns, or signs of infection, contact emergency services immediately.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Dial</Text>

        {emergencyContacts.map((contact, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.contactCard, { backgroundColor: colors.card }]}
            onPress={() => handleCall(contact.number)}
          >
            <Text style={styles.contactEmoji}>{contact.emoji}</Text>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactName, { color: colors.text }]}>
                {contact.name}
              </Text>
              <Text style={[styles.contactNumber, { color: colors.primary }]}>
                {contact.number}
              </Text>
            </View>
            <Text style={[styles.callBtn, { color: colors.primary }]}>📞 Call</Text>
          </TouchableOpacity>
        ))}

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>When to Seek Help</Text>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            • Severe allergic reactions{'\n'}
            • Signs of infection (fever, pus){'\n'}
            • Chemical burns{'\n'}
            • Severe pain or swelling{'\n'}
            • Persistent rashes that don't improve
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
  warningCard: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 },
  warningEmoji: { fontSize: 40, marginBottom: 12 },
  warningTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  warningText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  contactCard: { borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  contactEmoji: { fontSize: 32, marginRight: 12 },
  contactInfo: { flex: 1 },
  contactName: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  contactNumber: { fontSize: 13, fontWeight: '600' },
  callBtn: { fontSize: 18, fontWeight: 'bold' },
  infoCard: { borderRadius: 12, padding: 16, marginBottom: 24 },
  infoTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 12 },
  infoText: { fontSize: 13, lineHeight: 20 },
})
