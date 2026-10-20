import React, { useState } from 'react'
import { Text, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
  // Spanish comes back once the app is translated (languages come last).
]

export default function SettingsScreen({ route, navigation }) {
  const userId = route?.params?.userId
  const colors = useColors()
  const { themeMode, setThemeMode } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { user, logout, replayOnboarding } = useAuth()
  const [busy, setBusy] = useState(null)

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

  return (
    <Screen back title="Settings">
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
        Auto switches to dark mode at sunset and back at sunrise.
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
          icon="shield-checkmark-outline"
          title="Privacy & data"
          subtitle="Your consents and how we use your data"
          onPress={() => navigation.navigate('Privacy')}
        />
        {__DEV__ ? (
          <ListRow
            icon="refresh-outline"
            title="Replay welcome screens"
            subtitle="Testing only, hidden in the published app"
            onPress={replayOnboarding}
          />
        ) : null}
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
        Skynkod v1.0.0 · Your skin. Your code. Decoded daily.
      </Text>
    </Screen>
  )
}
