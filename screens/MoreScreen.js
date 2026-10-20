import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { logError } from '../utils/errorLogger'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Card, SectionHeader, ListRow, useColors } from '../components/ui'
import { useAuth } from '../utils/AuthContext'
import { useFirstName } from '../utils/useFirstName'
import { SPACING, RADIUS, TYPE } from '../utils/theme'
import ProgressScreen from './ProgressScreen'
import ProductsScreen from './ProductsScreen'
import PhotosScreen from './PhotosScreen'
import SkinTypeQuizScreen from './SkinTypeQuizScreen'
import BudgetScreen from './BudgetScreen-updated'
import NotificationsScreen from './NotificationsScreen'
import PremiumScreen from './PremiumScreen'
import AboutScreen from './AboutScreen'
import EmergencyScreen from './EmergencyScreen'
import BarcodeScannerScreen from './BarcodeScannerScreen'
import SkyncyclopediaScreen from './SkyncyclopediaScreen'
import SettingsScreen from './SettingsScreen'
import SkinProfileScreen from './SkinProfileScreen'

export const MORE_SCREENS = [
  { name: 'SkinProfile', component: SkinProfileScreen, label: 'My skin profile', subtitle: 'Your answers, editable anytime', icon: 'person-circle-outline', group: 'track' },
  { name: 'Photos', component: PhotosScreen, label: 'Photos', subtitle: 'Progress pictures', icon: 'camera-outline', group: 'track' },
  { name: 'Progress', component: ProgressScreen, label: 'Progress', subtitle: 'Your timeline', icon: 'trending-up-outline', group: 'track' },
  { name: 'Products', component: ProductsScreen, label: 'Products', subtitle: 'Your shelf', icon: 'flask-outline', group: 'track' },
  { name: 'Budget', component: BudgetScreen, label: 'Budget', subtitle: 'Skincare spending', icon: 'wallet-outline', group: 'track' },
  { name: 'Scanner', component: BarcodeScannerScreen, label: 'Scanner', subtitle: 'Analyze a product', icon: 'barcode-outline', group: 'learn' },
  { name: 'Skyncyclopedia', component: SkyncyclopediaScreen, label: 'Skyncyclopedia', subtitle: 'Learn to care for your skin', icon: 'library-outline', group: 'learn' },
  { name: 'Quiz', component: SkinTypeQuizScreen, label: 'Skin type quiz', subtitle: 'Find your skin type', icon: 'help-circle-outline', group: 'learn' },
  { name: 'Emergency', component: EmergencyScreen, label: 'Emergency', subtitle: '7-day recovery plan', icon: 'medkit-outline', group: 'learn' },
  { name: 'Alerts', component: NotificationsScreen, label: 'Notifications', subtitle: 'Reminders', icon: 'notifications-outline', group: 'account' },
  { name: 'Premium', component: PremiumScreen, label: 'Premium', subtitle: 'Unlock everything', icon: 'diamond-outline', group: 'account' },
  { name: 'Settings', component: SettingsScreen, label: 'Settings', subtitle: 'Theme, language, account', icon: 'settings-outline', group: 'account' },
  { name: 'About', component: AboutScreen, label: 'About', subtitle: 'Skynkod v1.0', icon: 'information-circle-outline', group: 'account' },
]

// Routines left the tab bar (they live on Home now), so Profile links to them too.
const ROUTINES_TILE = { name: 'Routines', label: 'Routines', subtitle: 'Morning & evening', icon: 'water-outline', group: 'track' }

// Progress photos are parked for now (essentials first); Progress only shows photos.
// Scanner is in the search bar and the + button; the skin type is asked at sign-up.
// Premium waits until in-app purchases work (stores refuse "coming soon" screens).
// V1: Budget, Skyncyclopedia and Emergency come back later as new features.
const HIDDEN = ['Photos', 'Progress', 'Scanner', 'Quiz', 'Premium', 'Budget', 'Skyncyclopedia', 'Emergency']
const byGroup = group => [ROUTINES_TILE, ...MORE_SCREENS].filter(s => s.group === group && !HIDDEN.includes(s.name))

export default function MoreScreen({ navigation }) {
  const colors = useColors()
  const { user, logout } = useAuth()
  const firstName = useFirstName(user?.id)
  const open = name => navigation.navigate(name)
  const tracking = byGroup('track')
  const [loggingOut, setLoggingOut] = useState(false)

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true)
          try {
            await logout()
          } catch (error) {
            await logError('MoreScreen_logout', error, {}, 'warn')
            Alert.alert('Error', error?.message || 'Logout failed. Please try again.')
            setLoggingOut(false)
          }
        },
      },
    ])
  }

  return (
    <Screen title="Profile">
      <View style={[styles.profile, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Text style={[TYPE.heading, { color: colors.primary }]}>{(firstName || user?.email || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={1}>{firstName || (user?.email || '').split('@')[0]}</Text>
          <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]} numberOfLines={1}>{user?.email}</Text>
        </View>
      </View>

      <SectionHeader title="Track" style={{ marginTop: SPACING.xl }} />
      <Card padded={false} style={styles.listCard}>
        {tracking.map((item, idx, arr) => (
          <ListRow key={item.name} icon={item.icon} title={item.label} subtitle={item.subtitle} onPress={() => open(item.name)} last={idx === arr.length - 1} />
        ))}
      </Card>

      <SectionHeader title="Learn & care" style={{ marginTop: SPACING.xl }} />
      <Card padded={false} style={styles.listCard}>
        {byGroup('learn').map((item, idx, arr) => (
          <ListRow key={item.name} icon={item.icon} title={item.label} subtitle={item.subtitle} onPress={() => open(item.name)} last={idx === arr.length - 1} />
        ))}
      </Card>

      <SectionHeader title="Account" style={{ marginTop: SPACING.xl }} />
      <Card padded={false} style={styles.listCard}>
        {byGroup('account').map((item, idx, arr) => (
          <ListRow key={item.name} icon={item.icon} title={item.label} subtitle={item.subtitle} onPress={() => open(item.name)} last={idx === arr.length - 1} />
        ))}
      </Card>

      {/* Log out, at the very bottom */}
      <Pressable
        onPress={confirmLogout}
        disabled={loggingOut}
        style={({ pressed }) => [styles.logout, { borderColor: colors.border, opacity: pressed || loggingOut ? 0.6 : 1 }]}
      >
        {loggingOut ? <ActivityIndicator color={colors.danger} /> : <Ionicons name="log-out-outline" size={20} color={colors.danger} />}
        <Text style={[TYPE.bodyStrong, { color: colors.danger }]}>Log out</Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  listCard: { paddingHorizontal: SPACING.lg },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, height: 52, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, marginTop: SPACING.xxl },
})
