import * as Notifications from 'expo-notifications'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'

export default function NotificationsScreen() {
  const [journalReminder, setJournalReminder] = useState(true)
  const [morningReminder, setMorningReminder] = useState(true)
  const [eveningReminder, setEveningReminder] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)

  useEffect(() => {
    requestPermissions()
  }, [])

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission', 'Please enable notifications in settings')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const scheduleJournalReminder = async () => {
    try {
      if (journalReminder) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Time to journal! 📔',
            body: 'How is your skin today?',
          },
          trigger: { hour: 9, minute: 0, repeats: true },
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const scheduleMorningReminder = async () => {
    try {
      if (morningReminder) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Morning Skincare! 🌅',
            body: 'Time for your morning routine',
          },
          trigger: { hour: 7, minute: 0, repeats: true },
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const scheduleEveningReminder = async () => {
    try {
      if (eveningReminder) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Evening Skincare! 🌙',
            body: 'Time for your night routine',
          },
          trigger: { hour: 21, minute: 0, repeats: true },
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const scheduleWeeklyReport = async () => {
    try {
      if (weeklyReport) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Weekly Report! 📊',
            body: 'Check your skin progress this week',
          },
          trigger: { weekday: 1, hour: 10, minute: 0, repeats: true },
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Reminders</Text>

        <View style={styles.notifRow}>
          <View>
            <Text style={styles.notifTitle}>Morning Skincare</Text>
            <Text style={styles.notifSubtitle}>7:00 AM</Text>
          </View>
          <Switch value={morningReminder} onValueChange={(val) => { setMorningReminder(val); scheduleMorningReminder(); }} trackColor={{ false: '#767577', true: SKYNKOD_COLORS.primary }} />
        </View>

        <View style={styles.notifRow}>
          <View>
            <Text style={styles.notifTitle}>Journal Reminder</Text>
            <Text style={styles.notifSubtitle}>9:00 AM</Text>
          </View>
          <Switch value={journalReminder} onValueChange={(val) => { setJournalReminder(val); scheduleJournalReminder(); }} trackColor={{ false: '#767577', true: SKYNKOD_COLORS.primary }} />
        </View>

        <View style={styles.notifRow}>
          <View>
            <Text style={styles.notifTitle}>Evening Skincare</Text>
            <Text style={styles.notifSubtitle}>9:00 PM</Text>
          </View>
          <Switch value={eveningReminder} onValueChange={(val) => { setEveningReminder(val); scheduleEveningReminder(); }} trackColor={{ false: '#767577', true: SKYNKOD_COLORS.primary }} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly</Text>

        <View style={styles.notifRow}>
          <View>
            <Text style={styles.notifTitle}>Weekly Progress Report</Text>
            <Text style={styles.notifSubtitle}>Mondays at 10:00 AM</Text>
          </View>
          <Switch value={weeklyReport} onValueChange={(val) => { setWeeklyReport(val); scheduleWeeklyReport(); }} trackColor={{ false: '#767577', true: SKYNKOD_COLORS.primary }} />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 Tip</Text>
        <Text style={styles.infoText}>Enable notifications to stay consistent with your skincare routine!</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg, padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: SKYNKOD_COLORS.text },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: SKYNKOD_COLORS.primary, marginBottom: 12 },
  notifRow: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 14, fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  notifSubtitle: { fontSize: 12, color: SKYNKOD_COLORS.muted, marginTop: 4 },
  infoCard: { backgroundColor: 'rgba(178, 131, 172, 0.1)', padding: 16, borderRadius: 8, marginBottom: 20 },
  infoTitle: { fontWeight: 'bold', marginBottom: 8 },
  infoText: { color: SKYNKOD_COLORS.text, fontSize: 14 },
})