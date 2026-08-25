import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, ActivityIndicator } from 'react-native'
import { signOut } from '../utils/supabase'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import { logError } from '../utils/errorLogger'

export default function SettingsScreen({ route, navigation }) {
  const { userId } = route.params
  const { isDark, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          setLoggingOut(true)
          try {
            // 1. Sign out from Supabase
            const result = await signOut()
            if (!result.success) {
              throw new Error(result.error || 'Logout failed')
            }

            // 2. Clear AsyncStorage user data
            await AsyncStorage.removeItem('skynkod_user')
            
            // 3. Clear push token from storage
            const token = await AsyncStorage.getItem(`push_token_${userId}`)
            if (token) {
              await AsyncStorage.removeItem(`push_token_${userId}`)
            }

            // 4. Cancel all scheduled notifications
            try {
              await Notifications.cancelAllScheduledNotificationsAsync()
            } catch (err) {
              console.warn('Cancel notifications error:', err)
            }

            // 5. Clear cache data
            const cacheKeys = ['journal_entries', 'user_products', 'today_routine', 'expenses', 'user_photos', 'chat_history', 'progress_photos']
            for (const key of cacheKeys) {
              await AsyncStorage.removeItem(`cache_${key}`)
              await AsyncStorage.removeItem(`cache_${key}_timestamp`)
            }

            // 6. Log the logout
            await logError('SettingsScreen_logout', new Error('User logout - clean exit'), { userId }, 'info')

            // 7. Reset navigation
            navigation.reset({
              index: 0,
              routes: [{ name: 'LoginScreen' }],
            })

            Alert.alert('Success', 'You have been logged out')
          } catch (error) {
            await logError('SettingsScreen_logout_error', error, { userId })
            Alert.alert('Error', error.message || 'Logout failed. Please try again.')
            setLoggingOut(false)
          }
        },
      },
    ])
  }

  const handleClearAllData = () => {
    Alert.alert('Clear All Data', 'This will delete all cached data. Continue?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Clear',
        onPress: async () => {
          try {
            const cacheKeys = ['journal_entries', 'user_products', 'today_routine', 'expenses', 'user_photos', 'chat_history', 'progress_photos', 'error_logs']
            for (const key of cacheKeys) {
              await AsyncStorage.removeItem(`cache_${key}`)
              await AsyncStorage.removeItem(`cache_${key}_timestamp`)
            }
            Alert.alert('Success', 'Cache cleared')
          } catch (error) {
            await logError('SettingsScreen_clearCache', error, { userId })
            Alert.alert('Error', 'Failed to clear cache')
          }
        },
      },
    ])
  }

  if (loggingOut) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Logging out...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* APPEARANCE */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* LANGUAGE */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Language</Text>
          
          {['en', 'es', 'fr'].map(lang => (
            <TouchableOpacity
              key={lang}
              style={[styles.languageOption, { borderBottomColor: colors.border }]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.languageLabel, { color: colors.text }]}>
                {lang === 'en' ? '🇺🇸 English' : lang === 'es' ? '🇪🇸 Español' : '🇫🇷 Français'}
              </Text>
              {language === lang && <Text style={{ color: colors.primary }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* DATA */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data</Text>
          
          <TouchableOpacity
            style={[styles.settingButton, { borderColor: '#FF6B6B' }]}
            onPress={handleClearAllData}
          >
            <Text style={{ color: '#FF6B6B', fontWeight: '600', fontSize: 14 }}>Clear Cache</Text>
          </TouchableOpacity>
        </View>

        {/* ACCOUNT */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#FF6B6B' }]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* VERSION INFO */}
        <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoText, { color: colors.muted }]}>Skynkod v1.0.0</Text>
          <Text style={[styles.infoText, { color: colors.muted }]}>Your AI Skin Coach</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  loadingText: { marginTop: 12, fontSize: 14 },
  section: { borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  sectionTitle: { fontWeight: 'bold', fontSize: 14, padding: 16, paddingBottom: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  settingLabel: { fontSize: 14, fontWeight: '500' },
  languageOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  languageLabel: { fontSize: 14 },
  settingButton: { borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', margin: 16 },
  logoutButton: { borderRadius: 8, paddingVertical: 14, alignItems: 'center', margin: 16 },
  logoutButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  infoSection: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 24 },
  infoText: { fontSize: 12, marginVertical: 4 },
})
