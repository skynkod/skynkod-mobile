import React, { useState, useEffect } from 'react'
import { Text, Switch, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { logError } from '../utils/errorLogger'
import { requestNotificationPermissions, getReminderPrefs, syncSmartReminders } from '../utils/notifications'
import { Screen, Card, ListRow, useColors } from '../components/ui'
import { useT } from '../utils/LanguageContext'
import { SPACING, TYPE } from '../utils/theme'

// 3 a day at most by default (Lita's audit, 2026-10-24). Times match
// utils/notifications.js; Rekod, Dekod and the 7-day plan join these reminders
// instead of adding new ones.
const REMINDERS = [
  { key: 'morningReminder', title: 'Morning', subtitle: '8:00 · your check-in, then your routine', icon: 'sunny-outline' },
  { key: 'waterReminder', title: 'Drink water', subtitle: '15:00', icon: 'water-outline' },
  { key: 'waterExtra', title: 'More water reminders', subtitle: '11:00 and 18:00 too', icon: 'water' },
  { key: 'eveningReminder', title: 'Evening', subtitle: '21:00 · your routine (or tonight’s Rekod night)', icon: 'moon-outline' },
]

export default function NotificationsScreen({ route }) {
  const { userId } = route.params
  const colors = useColors()
  const t = useT()
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    getReminderPrefs(userId).then(setSettings).catch(error => { logError('NotificationsScreen_load', error, { userId }); setSettings({}) })
  }, [userId])

  const toggle = async (reminder) => {
    const enabled = !settings[reminder.key]
    const next = { ...settings, [reminder.key]: enabled }
    setSettings(next)
    try {
      await AsyncStorage.setItem(`notifications_${userId}`, JSON.stringify(next))
      if (enabled && !(await requestNotificationPermissions())) {
        Alert.alert(t('Notifications are off'), t('Allow notifications for Skynkod in your phone settings.'))
        return
      }
      await syncSmartReminders(userId)
    } catch (error) {
      await logError('NotificationsScreen_toggle', error, { userId, key: reminder.key })
    }
  }

  if (!settings) return <Screen back title={t('Notifications')} />
  return (
    <Screen back title={t('Notifications')} subtitle={t('Gentle nudges, 3 a day at most')}>
      <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
        {REMINDERS.filter(r => r.key !== 'waterExtra' || settings.waterReminder).map((r, idx, list) => (
          <ListRow
            key={r.key}
            icon={r.icon}
            title={t(r.title)}
            subtitle={t(r.subtitle)}
            last={idx === list.length - 1}
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
      <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.lg, lineHeight: 18 }]}>
        {t('Your Rekod review, Dekod day and Koda box come with the morning reminder, never as an extra one.')}
      </Text>
    </Screen>
  )
}
