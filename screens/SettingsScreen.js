import React, { useState } from 'react'
import { Text, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { useAuth } from '../utils/AuthContext'
import { logError } from '../utils/errorLogger'
import { deleteAccount } from '../utils/account'
import { Screen, Card, SectionHeader, ListRow, SegmentedControl, useColors } from '../components/ui'
import { SPACING, TYPE } from '../utils/theme'

const LANGS = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

export default function SettingsScreen({ route }) {
  const userId = route?.params?.userId
  const colors = useColors()
  const { themeMode, setThemeMode } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { user, logout } = useAuth()
  const [busy, setBusy] = useState(null)

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setBusy('logout')
          try {
            await logout()
          } catch (error) {
            await logError('SettingsScreen_logout', error, { userId })
            Alert.alert('Error', error?.message || 'Logout failed. Please try again.')
            setBusy(null)
          }
        },
      },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, journal, photos, routines and chats. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => Alert.alert('Are you sure?', 'Your data will be gone forever.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete forever',
              style: 'destructive',
              onPress: async () => {
                setBusy('delete')
                const result = await deleteAccount()
                if (!result.success) {
                  await logError('SettingsScreen_deleteAccount', new Error(result.error), { userId })
                  Alert.alert('Error', "Your account couldn't be deleted. Please try again.")
                  setBusy(null)
                  return
                }
                Alert.alert('Account deleted', 'Your account and data have been deleted.')
                try {
                  await logout()
                } catch (error) {
                  await logError('SettingsScreen_deleteAccountLogout', error, { userId }, 'warn')
                }
              },
            },
          ]),
        },
      ]
    )
  }

  const handleClearCache = () => {
    Alert.alert('Clear cache', 'Cached data will be downloaded again next time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: async () => {
          setBusy('cache')
          try {
            const keys = ['journal_entries', 'user_products', 'today_routine', 'expenses', 'user_photos', 'chat_history', 'progress_photos', 'analysis_stats']
            await AsyncStorage.multiRemove(keys.flatMap(k => [`cache_${k}`, `cache_${k}_timestamp`]))
            Alert.alert('Done', 'Cache cleared')
          } catch (error) {
            await logError('SettingsScreen_clearCache', error, { userId })
            Alert.alert('Error', 'Failed to clear cache')
          } finally {
            setBusy(null)
          }
        },
      },
    ])
  }

  return (
    <Screen back title="Settings" subtitle={user?.email}>
      <SectionHeader title="Appearance" />
      <SegmentedControl
        value={themeMode}
        onChange={setThemeMode}
        options={[
          { value: 'light', label: 'Light', icon: 'sunny-outline' },
          { value: 'dark', label: 'Dark', icon: 'moon-outline' },
          { value: 'auto', label: 'Auto', icon: 'time-outline' },
        ]}
      />
      <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>
        Auto switches to dark mode between 8 pm and 6 am.
      </Text>

      <SectionHeader title="Language" style={{ marginTop: SPACING.xxl }} />
      <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
        {LANGS.map((lang, idx) => (
          <ListRow
            key={lang.code}
            icon={undefined}
            title={`${lang.flag}  ${lang.label}`}
            onPress={() => setLanguage(lang.code)}
            right={language === lang.code ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
            last={idx === LANGS.length - 1}
          />
        ))}
      </Card>

      <SectionHeader title="Data & account" style={{ marginTop: SPACING.xxl }} />
      <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
        <ListRow
          icon="trash-outline"
          title="Clear cache"
          subtitle="Free up space on this device"
          onPress={handleClearCache}
          right={busy === 'cache' ? <ActivityIndicator color={colors.primary} /> : undefined}
        />
        <ListRow
          icon="log-out-outline"
          iconColor={colors.danger}
          iconBackground={colors.dangerSoft}
          title="Log out"
          destructive
          onPress={handleLogout}
          right={busy === 'logout' ? <ActivityIndicator color={colors.danger} /> : null}
        />
        <ListRow
          icon="person-remove-outline"
          iconColor={colors.danger}
          iconBackground={colors.dangerSoft}
          title="Delete account"
          subtitle="Permanently delete your account and data"
          destructive
          onPress={handleDeleteAccount}
          right={busy === 'delete' ? <ActivityIndicator color={colors.danger} /> : null}
          last
        />
      </Card>

      <Text style={[TYPE.caption, { color: colors.muted, textAlign: 'center', marginTop: SPACING.xxl }]}>
        Skynkod v1.0.0 · Your AI skin coach
      </Text>
    </Screen>
  )
}
