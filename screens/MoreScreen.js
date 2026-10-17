import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Card, SectionHeader, ListRow, useColors } from '../components/ui'
import { useAuth } from '../utils/AuthContext'
import { SPACING, RADIUS, TYPE } from '../utils/theme'
import ProgressScreen from './ProgressScreen'
import ProgressAnalysisScreen from './ProgressAnalysisScreen'
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

export const MORE_SCREENS = [
  { name: 'Photos', component: PhotosScreen, label: 'Photos', subtitle: 'Progress pictures', icon: 'camera-outline', group: 'track' },
  { name: 'Progress', component: ProgressScreen, label: 'Progress', subtitle: 'Your timeline', icon: 'trending-up-outline', group: 'track' },
  { name: 'Analysis', component: ProgressAnalysisScreen, label: 'Analysis', subtitle: 'Mood over 30 days', icon: 'stats-chart-outline', group: 'track' },
  { name: 'Products', component: ProductsScreen, label: 'Products', subtitle: 'Your shelf', icon: 'flask-outline', group: 'track' },
  { name: 'Budget', component: BudgetScreen, label: 'Budget', subtitle: 'Skincare spending', icon: 'wallet-outline', group: 'track' },
  { name: 'Scanner', component: BarcodeScannerScreen, label: 'Scanner', subtitle: 'Analyze a product', icon: 'barcode-outline', group: 'learn' },
  { name: 'Skyncyclopedia', component: SkyncyclopediaScreen, label: 'Skyncyclopedia', subtitle: 'Ingredient guide', icon: 'library-outline', group: 'learn' },
  { name: 'Quiz', component: SkinTypeQuizScreen, label: 'Skin type quiz', subtitle: 'Find your skin type', icon: 'help-circle-outline', group: 'learn' },
  { name: 'Emergency', component: EmergencyScreen, label: 'Emergency', subtitle: '7-day recovery plan', icon: 'medkit-outline', group: 'learn' },
  { name: 'Alerts', component: NotificationsScreen, label: 'Notifications', subtitle: 'Reminders', icon: 'notifications-outline', group: 'account' },
  { name: 'Premium', component: PremiumScreen, label: 'Premium', subtitle: 'Unlock everything', icon: 'diamond-outline', group: 'account' },
  { name: 'Settings', component: SettingsScreen, label: 'Settings', subtitle: 'Theme, language, account', icon: 'settings-outline', group: 'account' },
  { name: 'About', component: AboutScreen, label: 'About', subtitle: 'Skynkod v1.0', icon: 'information-circle-outline', group: 'account' },
]

const byGroup = group => MORE_SCREENS.filter(s => s.group === group)

export default function MoreScreen({ navigation }) {
  const colors = useColors()
  const { user } = useAuth()
  const open = name => navigation.navigate(name)
  const tracking = byGroup('track')

  return (
    <Screen title="More" subtitle={user?.email}>
      <SectionHeader title="Track" />
      <View style={styles.grid}>
        {tracking.map(item => (
          <Pressable
            key={item.name}
            onPress={() => open(item.name)}
            style={({ pressed }) => [
              styles.tile,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={[styles.tileIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{item.label}</Text>
            <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]} numberOfLines={1}>{item.subtitle}</Text>
          </Pressable>
        ))}
      </View>

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
    </Screen>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  tile: { width: '48%', flexGrow: 1, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.lg },
  tileIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  listCard: { paddingHorizontal: SPACING.lg },
})
