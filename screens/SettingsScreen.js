import AsyncStorage from '@react-native-async-storage/async-storage'
import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { signOut } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function SettingsScreen({ route, navigation }) {
  const { userId } = route.params
  const { isDark, toggleTheme } = useTheme()
  const { language, changeLanguage, languages, t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            const result = await signOut()
            if (result.success) {
              await AsyncStorage.removeItem('skynkod_user')
              // DO NOT remove 'skynkod_onboarded' - user can skip onboarding on re-login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              })
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to logout')
          }
        },
      },
    ])
  }

  const handleChangeLanguage = async (lang) => {
    await changeLanguage(lang)
    setShowLanguageMenu(false)
    Alert.alert('Success', `Language changed to ${languages[lang]}`)
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings_title')}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Manage your preferences</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* THEME SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Display</Text>

          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <View style={styles.settingContent}>
              <Text style={styles.settingEmoji}>🌙</Text>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingName, { color: colors.text }]}>{t('settings_dark_mode')}</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>
                  {isDark ? 'Dark mode ON' : 'Light mode ON'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? colors.primary : colors.muted}
            />
          </View>
        </View>

        {/* LANGUAGE SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings_language')}</Text>

          {!showLanguageMenu ? (
            <TouchableOpacity
              style={[styles.settingCard, { backgroundColor: colors.card }]}
              onPress={() => setShowLanguageMenu(true)}
            >
              <View style={styles.settingContent}>
                <Text style={styles.settingEmoji}>🌍</Text>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingName, { color: colors.text }]}>{t('settings_language')}</Text>
                  <Text style={[styles.settingDesc, { color: colors.muted }]}>
                    {languages[language]}
                  </Text>
                </View>
              </View>
              <Text style={[styles.arrow, { color: colors.muted }]}>→</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.languageMenu, { backgroundColor: colors.card }]}>
              {Object.entries(languages).map(([code, name]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageOption,
                    language === code && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => handleChangeLanguage(code)}
                >
                  <Text style={[
                    styles.languageOptionText,
                    { color: language === code ? 'white' : colors.text }
                  ]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.languageOption, { backgroundColor: colors.border }]}
                onPress={() => setShowLanguageMenu(false)}
              >
                <Text style={[styles.languageOptionText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ACCOUNT SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>

          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <View style={styles.settingContent}>
              <Text style={styles.settingEmoji}>📱</Text>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingName, { color: colors.text }]}>Skynkod</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>v1.0.0</Text>
              </View>
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <View style={styles.settingContent}>
              <Text style={styles.settingEmoji}>✨</Text>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingName, { color: colors.text }]}>Powered by AI</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>Claude + Supabase</Text>
              </View>
            </View>
          </View>
        </View>

        {/* LOGOUT SECTION */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.settingCard, styles.dangerCard, { backgroundColor: colors.card, borderColor: '#FF6B6B' }]}
            onPress={handleLogout}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingEmoji}>🚪</Text>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingName, styles.dangerText]}>{t('settings_logout')}</Text>
                <Text style={[styles.settingDesc, { color: colors.muted }]}>Sign out of your account</Text>
              </View>
            </View>
          </TouchableOpacity>
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
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  settingCard: { borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingEmoji: { fontSize: 24, marginRight: 12 },
  settingInfo: { flex: 1 },
  settingName: { fontWeight: '600', fontSize: 14 },
  settingDesc: { fontSize: 12, marginTop: 2 },
  arrow: { fontSize: 18, fontWeight: 'bold' },
  dangerCard: { borderWidth: 1 },
  dangerText: { color: '#FF6B6B' },
  languageMenu: { borderRadius: 12, padding: 12, marginBottom: 12, gap: 8 },
  languageOption: { borderRadius: 8, padding: 12, alignItems: 'center' },
  languageOptionText: { fontWeight: '600', fontSize: 14 },
})