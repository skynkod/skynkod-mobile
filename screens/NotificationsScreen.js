import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'
import { disableReminder, enableReminder, isReminderEnabled, scheduleEveningReminder, scheduleJournalReminder, scheduleMorningReminder } from '../utils/notifications'

export default function NotificationsScreen({ route }) {
  const { userId } = route.params
  const [morningEnabled, setMorningEnabled] = useState(true)
  const [eveningEnabled, setEveningEnabled] = useState(true)
  const [journalEnabled, setJournalEnabled] = useState(true)

  useEffect(() => {
    loadNotificationSettings()
  }, [userId])

  const loadNotificationSettings = async () => {
    try {
      const morning = await isReminderEnabled(userId, 'morning')
      const evening = await isReminderEnabled(userId, 'evening')
      const journal = await isReminderEnabled(userId, 'journal')
      
      setMorningEnabled(morning)
      setEveningEnabled(evening)
      setJournalEnabled(journal)
    } catch (error) {
      console.error('Load settings error:', error)
    }
  }

  const handleMorningToggle = async (value) => {
    setMorningEnabled(value)
    if (value) {
      await enableReminder(userId, 'morning')
      await scheduleMorningReminder(userId)
      Alert.alert('Enabled', '🌅 Morning reminders at 8:00 AM')
    } else {
      await disableReminder(userId, 'morning')
      Alert.alert('Disabled', 'Morning reminders turned off')
    }
  }

  const handleEveningToggle = async (value) => {
    setEveningEnabled(value)
    if (value) {
      await enableReminder(userId, 'evening')
      await scheduleEveningReminder(userId)
      Alert.alert('Enabled', '🌙 Evening reminders at 8:00 PM')
    } else {
      await disableReminder(userId, 'evening')
      Alert.alert('Disabled', 'Evening reminders turned off')
    }
  }

  const handleJournalToggle = async (value) => {
    setJournalEnabled(value)
    if (value) {
      await enableReminder(userId, 'journal')
      await scheduleJournalReminder(userId)
      Alert.alert('Enabled', '📔 Journal reminders at 9:00 PM')
    } else {
      await disableReminder(userId, 'journal')
      Alert.alert('Disabled', 'Journal reminders turned off')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Manage your reminders</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Reminders</Text>

          <View style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderEmoji}>🌅</Text>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderName}>Morning Routine</Text>
                <Text style={styles.reminderTime}>8:00 AM daily</Text>
              </View>
              <Switch
                value={morningEnabled}
                onValueChange={handleMorningToggle}
                trackColor={{ false: SKYNKOD_COLORS.border, true: SKYNKOD_COLORS.primary }}
              />
            </View>
            <Text style={styles.reminderDesc}>Get reminded to start your morning skincare routine</Text>
          </View>

          <View style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderEmoji}>🌙</Text>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderName}>Evening Routine</Text>
                <Text style={styles.reminderTime}>8:00 PM daily</Text>
              </View>
              <Switch
                value={eveningEnabled}
                onValueChange={handleEveningToggle}
                trackColor={{ false: SKYNKOD_COLORS.border, true: SKYNKOD_COLORS.primary }}
              />
            </View>
            <Text style={styles.reminderDesc}>Get reminded to do your evening skincare routine</Text>
          </View>

          <View style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderEmoji}>📔</Text>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderName}>Journal Check-in</Text>
                <Text style={styles.reminderTime}>9:00 PM daily</Text>
              </View>
              <Switch
                value={journalEnabled}
                onValueChange={handleJournalToggle}
                trackColor={{ false: SKYNKOD_COLORS.border, true: SKYNKOD_COLORS.primary }}
              />
            </View>
            <Text style={styles.reminderDesc}>Get reminded to log your skin progress for the day</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Notifications</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              📱 Notifications help you stay consistent with your skincare routine. Turn on reminders to get daily prompts at the best times for you!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: SKYNKOD_COLORS.border },
  title: { fontSize: 24, fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  subtitle: { fontSize: 12, color: SKYNKOD_COLORS.muted, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: SKYNKOD_COLORS.text, marginBottom: 12 },
  reminderCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reminderEmoji: { fontSize: 24, marginRight: 12 },
  reminderInfo: { flex: 1 },
  reminderName: { fontWeight: '600', color: SKYNKOD_COLORS.text, fontSize: 14 },
  reminderTime: { color: SKYNKOD_COLORS.muted, fontSize: 12, marginTop: 2 },
  reminderDesc: { color: SKYNKOD_COLORS.muted, fontSize: 13, lineHeight: 18 },
  infoCard: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
  infoText: { color: SKYNKOD_COLORS.text, fontSize: 14, lineHeight: 20 },
})