import React, { useState, useEffect } from 'react'
import { Text, Switch, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { logError } from '../utils/errorLogger'
import { requestNotificationPermissions, scheduleMorningReminder, scheduleEveningReminder, scheduleJournalReminder } from '../utils/notifications'
import { Screen, Card, ListRow, useColors } from '../components/ui'
import { SPACING, TYPE } from '../utils/theme'

// Times match what utils/notifications.js actually schedules.
const REMINDERS = [
  { key: 'morningReminder', id: 'morning', title: 'Morning routine', time: '8:00', icon: 'sunny-outline', schedule: scheduleMorningReminder },
  { key: 'journalReminder', id: 'journal', title: 'Journal check-in', time: '20:00', icon: 'book-outline', schedule: scheduleJournalReminder },
  { key: 'eveningReminder', id: 'evening', title: 'Evening routine', time: '21:00', icon: 'moon-outline', schedule: scheduleEveningReminder },
]

export default function NotificationsScreen({ route }) {
  const { userId } = route.params
  const colors = useColors()
  const [settings, setSettings] = useState({ morningReminder: true, eveningReminder: true, journalReminder: true })

  useEffect(() => {
    AsyncStorage.getItem(`notifications_${userId}`)
      .then(saved => saved && setSettings(prev => ({ ...prev, ...JSON.parse(saved) })))
      .catch(error => logError('NotificationsScreen_load', error, { userId }))
  }, [userId])

  // Toggling used to only save the preference; it now actually (un)schedules the reminder.
  const toggle = async (reminder) => {
    const enabled = !settings[reminder.key]
    const next = { ...settings, [reminder.key]: enabled }
    setSettings(next)
    try {
      await AsyncStorage.setItem(`notifications_${userId}`, JSON.stringify(next))
      if (enabled) {
        const granted = await requestNotificationPermissions()
        if (!granted) {
          Alert.alert('Notifications are off', 'Allow notifications for Skynkod in your phone settings.')
          return
        }
        await reminder.schedule(userId)
      } else {
        await Notifications.cancelScheduledNotificationAsync(`${reminder.id}-${userId}`)
      }
    } catch (error) {
      await logError('NotificationsScreen_toggle', error, { userId, key: reminder.key })
    }
  }

  return (
    <Screen back title="Notifications" subtitle="Gentle nudges to stay consistent">
      <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
        {REMINDERS.map((r, idx) => (
          <ListRow
            key={r.key}
            icon={r.icon}
            title={r.title}
            subtitle={`Every day at ${r.time}`}
            last={idx === REMINDERS.length - 1}
            right={
              <Switch
                value={!!settings[r.key]}
                onValueChange={() => toggle(r)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
                ios_backgroundColor={colors.border}
              />
            }
          />
        ))}
      </Card>
      <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.lg }]}>
        Consistency beats intensity: most skin changes take 4–6 weeks to show.
      </Text>
    </Screen>
  )
}
