import React, { useState, useEffect } from 'react'
import { View, Text, Switch, Alert, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
  { key: 'morningReminder', title: 'Morning', subtitle: '{time} · your check-in, then your routine', icon: 'sunny-outline', time: 'morningTime', range: [5 * 60, 11 * 60] },
  { key: 'waterReminder', title: 'Drink water', subtitle: '15:00', icon: 'water-outline' },
  { key: 'waterExtra', title: 'More water reminders', subtitle: '11:00 and 18:00 too', icon: 'water' },
  { key: 'eveningReminder', title: 'Evening', subtitle: '{time} · your routine (or tonight’s Rekod night)', icon: 'moon-outline', time: 'eveningTime', range: [18 * 60, 23 * 60 + 30] },
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

  // Her own times, by half hours (notifications audit, 2026-10-25).
  const toMin = text => { const [h, m] = String(text).split(':').map(Number); return h * 60 + m }
  const toText = min => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
  const shiftTime = async (reminder, step) => {
    const [lo, hi] = reminder.range
    const value = Math.min(hi, Math.max(lo, toMin(settings[reminder.time]) + step))
    const next = { ...settings, [reminder.time]: toText(value) }
    setSettings(next)
    try {
      await AsyncStorage.setItem(`notifications_${userId}`, JSON.stringify(next))
      await syncSmartReminders(userId)
    } catch (error) {
      await logError('NotificationsScreen_time', error, { userId, key: reminder.time })
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
            subtitle={t(r.subtitle, { time: settings[r.time] })}
            last={idx === list.length - 1}
            below={r.time && settings[r.key] ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm }}>
                <Pressable onPress={() => shiftTime(r, -30)} hitSlop={8} accessibilityLabel={t('Earlier')} style={{ padding: 4 }}>
                  <Ionicons name="remove-circle-outline" size={24} color={colors.primary} />
                </Pressable>
                <Text style={[TYPE.bodyStrong, { color: colors.text, minWidth: 52, textAlign: 'center' }]}>{settings[r.time]}</Text>
                <Pressable onPress={() => shiftTime(r, 30)} hitSlop={8} accessibilityLabel={t('Later')} style={{ padding: 4 }}>
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                </Pressable>
              </View>
            ) : null}
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
        {t('Your Rekod review and Dekod day come with the morning reminder, never as an extra one.')}
      </Text>
    </Screen>
  )
}
