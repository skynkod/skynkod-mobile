import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { logError } from '../utils/errorLogger'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { NOTIFICATION_TIMES } from '../utils/constants'

export default function NotificationsScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [settings, setSettings] = useState({
    morningReminder: true,
    eveningReminder: true,
    journalReminder: true,
    morningTime: '08:00',
    eveningTime: '20:00',
    journalTime: '21:00',
  })

  useEffect(() => {
    loadSettings()
  }, [userId])

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(`notifications_${userId}`)
      if (saved) {
        setSettings(JSON.parse(saved))
      }
    } catch (error) {
      await logError('NotificationsScreen_loadSettings', error, { userId }, 'warn')
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      setSettings(newSettings)
      await AsyncStorage.setItem(`notifications_${userId}`, JSON.stringify(newSettings))
    } catch (error) {
      await logError('NotificationsScreen_saveSettings', error, { userId }, 'error')
      Alert.alert('Error', 'Failed to save notification settings')
    }
  }

  const toggleReminder = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    saveSettings(newSettings)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Manage your alerts</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Reminders</Text>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Morning Reminder</Text>
              <Text style={[styles.settingTime, { color: colors.muted }]}>
                {settings.morningTime}
              </Text>
            </View>
            <Switch
              value={settings.morningReminder}
              onValueChange={() => toggleReminder('morningReminder')}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor="white"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Evening Reminder</Text>
              <Text style={[styles.settingTime, { color: colors.muted }]}>
                {settings.eveningTime}
              </Text>
            </View>
            <Switch
              value={settings.eveningReminder}
              onValueChange={() => toggleReminder('eveningReminder')}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor="white"
            />
          </View>

          <View style={[styles.settingRow]}>
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Journal Reminder</Text>
              <Text style={[styles.settingTime, { color: colors.muted }]}>
                {settings.journalTime}
              </Text>
            </View>
            <Switch
              value={settings.journalReminder}
              onValueChange={() => toggleReminder('journalReminder')}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>💡 Tips</Text>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Keep reminders on to maintain your skincare routine consistently
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
  section: { borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  sectionTitle: { fontWeight: 'bold', fontSize: 14, padding: 16, paddingBottom: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  settingLabel: { fontSize: 14, fontWeight: '500' },
  settingTime: { fontSize: 12, marginTop: 4 },
  infoSection: { borderRadius: 12, padding: 16, marginBottom: 24 },
  infoTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  infoText: { fontSize: 13, lineHeight: 20 },
})
