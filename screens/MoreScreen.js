import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, ScrollView, Switch, DevSettings } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { logError } from '../utils/errorLogger'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Card, SectionHeader, ListRow, ProgressBar, useColors } from '../components/ui'
import ProfileAvatar from '../components/ProfileAvatar'
import { BadgeImage } from '../components/Badge'
import { useJourney } from '../utils/useJourney'
import { syncSoon } from '../utils/journey'
import { VISIBLE_BADGES, BADGES, canEarn } from '../utils/journey-core'
import { useLanguage } from '../utils/LanguageContext'
import { useAuth } from '../utils/AuthContext'
import { useFirstName } from '../utils/useFirstName'
import { SPACING, RADIUS, TYPE } from '../utils/theme'
import MyProgressScreen from './MyProgressScreen'
import MySkinJourneyScreen from './MySkinJourneyScreen'
import ProductsScreen from './ProductsScreen'
import PhotosScreen from './PhotosScreen'
import SkinTypeQuizScreen from './SkinTypeQuizScreen'
import BudgetScreen from './BudgetScreen-updated'
import NotificationsScreen from './NotificationsScreen'
import PremiumScreen from './PremiumScreen'
import LifeModesScreen from './LifeModesScreen'
import SkinReportScreen from './SkinReportScreen'
import PregnancySafeScreen from './PregnancySafeScreen'
import AboutScreen from './AboutScreen'
import EmergencyScreen from './EmergencyScreen'
import BarcodeScannerScreen from './BarcodeScannerScreen'
import SkyncyclopediaScreen from './SkyncyclopediaScreen'
import SettingsScreen from './SettingsScreen'
import SkinProfileScreen from './SkinProfileScreen'
import ProposalsScreen from './ProposalsScreen'
import { isAdmin } from '../utils/contributions'
import { isPremiumUser, setPremium } from '../utils/premium'

export const MORE_SCREENS = [
  { name: 'LifeModes', component: LifeModesScreen, label: 'Your skin right now', subtitle: 'Pregnancy, reacting skin, season', icon: 'heart-outline', group: 'track' },
  { name: 'PregnancySafe', component: PregnancySafeScreen, label: 'What’s safe for you now', icon: 'heart-outline', group: 'track' },
  { name: 'SkinProfile', component: SkinProfileScreen, label: 'My skin profile', subtitle: 'Your answers, editable anytime', icon: 'person-circle-outline', group: 'track' },
  { name: 'Photos', component: PhotosScreen, label: 'Photos', subtitle: 'Progress pictures', icon: 'camera-outline', group: 'track' },
  { name: 'Progress', component: MyProgressScreen, label: 'My progress', subtitle: 'Skin mood, routines, concerns', icon: 'trending-up-outline', group: 'track' },
  { name: 'Journey', component: MySkinJourneyScreen, label: 'My Skin Journey', subtitle: 'Badges, levels and your Koda box', icon: 'ribbon-outline', group: 'track' },
  { name: 'SkinReport', component: SkinReportScreen, label: 'My skin report', subtitle: 'One page for your dermatologist', icon: 'document-text-outline', group: 'track', premium: true },
  { name: 'Products', component: ProductsScreen, label: 'Products', subtitle: 'Your shelf', icon: 'flask-outline', group: 'track' },
  { name: 'Budget', component: BudgetScreen, label: 'Budget', subtitle: 'Skincare spending', icon: 'wallet-outline', group: 'track' },
  { name: 'Scanner', component: BarcodeScannerScreen, label: 'Scanner', subtitle: 'Analyze a product', icon: 'barcode-outline', group: 'learn' },
  { name: 'Skyncyclopedia', component: SkyncyclopediaScreen, label: 'Skyncyclopedia', subtitle: 'Learn to care for your skin', icon: 'library-outline', group: 'learn' },
  { name: 'Quiz', component: SkinTypeQuizScreen, label: 'Skin type quiz', subtitle: 'Find your skin type', icon: 'help-circle-outline', group: 'learn' },
  { name: 'Emergency', component: EmergencyScreen, label: 'Emergency', subtitle: '7-day recovery plan', icon: 'medkit-outline', group: 'learn', premium: true },
  { name: 'Alerts', component: NotificationsScreen, label: 'Notifications', subtitle: 'Reminders', icon: 'notifications-outline', group: 'account' },
  { name: 'Premium', component: PremiumScreen, label: 'Premium', subtitle: 'Unlock everything', icon: 'diamond-outline', group: 'account' },
  { name: 'Settings', component: SettingsScreen, label: 'Settings', subtitle: 'Theme, language, account', icon: 'settings-outline', group: 'account' },
  { name: 'About', component: AboutScreen, label: 'About', subtitle: 'Skynkod v1.0', icon: 'information-circle-outline', group: 'account' },
  // Only shown to the Skynkod team.
  { name: 'Proposals', component: ProposalsScreen, label: 'Product proposals', subtitle: 'Products sent from the scanner', icon: 'cube-outline', group: 'admin' },
]

// Routines left the tab bar (they live on Home now), so Profile links to them too.
const STAR_BADGES = BADGES.filter(b => b.category === 'stars')
const STAR_LABEL = { 4: '1 month', 13: '3 months', 26: '6 months', 52: '1 year', 104: '2 years', 156: '3 years' }

const ROUTINES_TILE = { name: 'Routines', label: 'Routines', subtitle: 'Morning & evening', icon: 'water-outline', group: 'track' }

// Progress photos are parked for now (essentials first); Progress only shows photos.
// Scanner is in the search bar and the + button; the skin type is asked at sign-up.
// V1: Budget comes back later as a new feature.
const HIDDEN = ['Photos', 'Scanner', 'Quiz', 'Budget', 'PregnancySafe']
const byGroup = group => [ROUTINES_TILE, ...MORE_SCREENS].filter(s => s.group === group && !HIDDEN.includes(s.name))

export default function MoreScreen({ navigation }) {
  const colors = useColors()
  const { user, logout } = useAuth()
  const firstName = useFirstName(user?.id)
  const { t } = useLanguage()
  const journey = useJourney(user?.id)
  // Keep the level and badges fresh when the profile opens.
  useFocusEffect(useCallback(() => { syncSoon(user?.id, 200) }, [user?.id]))
  const [admin, setAdmin] = useState(false)
  useFocusEffect(useCallback(() => { isAdmin().then(setAdmin).catch(() => {}) }, []))
  // The team sees the app as a free user by default, to feel the paywalls.
  const [viewPremium, setViewPremium] = useState(false)
  useFocusEffect(useCallback(() => { if (user?.id) isPremiumUser(user.id).then(setViewPremium) }, [user?.id]))
  const toggleView = on => { setViewPremium(on); setPremium(user.id, on) }
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
    <Screen back title="Profile">
      {/* Who she is, and where she is in her skin journey */}
      <Pressable onPress={() => open('Journey')} style={({ pressed }) => [styles.profile, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}>
        <View style={styles.profileTop}>
          <ProfileAvatar name={firstName || user?.email} level={journey?.level.level} size={64} background={colors.primarySoft} textColor={colors.primary} />
          <View style={{ flex: 1, marginLeft: SPACING.sm }}>
            <Text style={[TYPE.bodyStrong, { color: colors.text, fontSize: 18 }]} numberOfLines={1}>{firstName || (user?.email || '').split('@')[0]}</Text>
            <Text style={[TYPE.caption, { color: colors.muted, marginTop: 2 }]} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>
        {journey ? (
          <>
            <View style={[styles.rowBetween, { marginTop: SPACING.lg }]}>
              <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t(journey.level.tier.name).toUpperCase()}</Text>
              <Text style={[TYPE.caption, { color: colors.muted }]}>{journey.level.next ? `${journey.xp} / ${journey.level.next.xp} XP` : `${journey.xp} XP`}</Text>
            </View>
            <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: 2 }]}>{t('Level {n}', { n: journey.level.level })} · {t(journey.level.name)}</Text>
            <ProgressBar value={journey.level.progress} style={{ marginTop: SPACING.sm }} />
            <View style={[styles.stats, { borderTopColor: colors.border }]}>
              <View style={styles.stat}><Ionicons name="ribbon-outline" size={16} color={colors.primary} /><Text style={[TYPE.caption, { color: colors.text }]}><Text style={{ fontWeight: '700' }}>{journey.earned.length}/{journey.earnableCount}</Text> {t('badges')}</Text></View>
              <View style={styles.stat}><Ionicons name="star" size={15} color="#C99A45" /><Text style={[TYPE.caption, { color: colors.text }]}><Text style={{ fontWeight: '700' }}>{journey.stars}</Text> {t('stars')}</Text></View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
          </>
        ) : null}
      </Pressable>

      {/* My badges: the newest ones, or the first ones to aim for */}
      <SectionHeader title={t('My badges')} action={t('See all')} onAction={() => open('Journey')} style={{ marginTop: SPACING.xl }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md, paddingRight: SPACING.lg }}>
        {(journey?.earned.length ? journey.earned.slice(0, 8) : VISIBLE_BADGES.filter(canEarn).slice(0, 5)).map(b => (
          <Pressable key={b.id} onPress={() => open('Journey')} style={styles.badge}>
            <BadgeImage badge={b} size={64} locked={!b.earned} />
            <Text numberOfLines={2} style={[TYPE.caption, { color: b.earned ? colors.text : colors.muted, textAlign: 'center', fontSize: 11, marginTop: 4 }]}>{t(b.name)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {journey && !journey.earned.length ? <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.xs }]}>{t('Your first badges are waiting for you.')}</Text> : null}

      {/* My stars: the seniority milestones, greyed until reached */}
      <SectionHeader title={t('My stars')} action={t('See all')} onAction={() => open('Journey')} style={{ marginTop: SPACING.xl }} />
      <Card style={{ paddingVertical: SPACING.md }}>
        <View style={styles.starsRow}>
          {STAR_BADGES.map(b => {
            const won = journey?.earned.some(e => e.id === b.id)
            return (
              <View key={b.id} style={styles.starItem}>
                <BadgeImage badge={b} size={46} locked={!won} />
                <Text style={[TYPE.caption, { color: won ? colors.text : colors.muted, fontSize: 10, textAlign: 'center', marginTop: 2 }]}>{t(STAR_LABEL[b.target])}</Text>
              </View>
            )
          })}
        </View>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm, textAlign: 'center' }]}>
          {t('{n} active weeks · one star in your Koda box for each', { n: journey?.stars || 0 })}
        </Text>
      </Card>

      <SectionHeader title="Track" style={{ marginTop: SPACING.xl }} />
      <Card padded={false} style={styles.listCard}>
        {tracking.map((item, idx, arr) => (
          <ListRow key={item.name} icon={item.icon} title={item.label} subtitle={item.subtitle} onPress={() => open(item.name)} last={idx === arr.length - 1}
            right={item.premium ? <Ionicons name="diamond" size={14} color="#33202E" /> : undefined} />
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

      {admin ? (
        <>
          <SectionHeader title="Skynkod team" style={{ marginTop: SPACING.xl }} />
          <Card padded={false} style={styles.listCard}>
            <ListRow icon="diamond-outline" title="See the app as Premium" subtitle={viewPremium ? 'On: every Premium feature is open' : 'Off: you see the app as a free user'}
              right={<Switch value={viewPremium} onValueChange={toggleView} trackColor={{ true: colors.primary }} />} />
            {/* To test the welcome screens again; her answers are saved again at the end. */}
            <ListRow icon="refresh-outline" title="Replay the welcome screens" subtitle="Your answers will replace your skin profile"
              onPress={() => Alert.alert('Replay the welcome screens?', 'The app restarts on the first welcome screen. Your new answers will replace your skin profile.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Replay', onPress: async () => { await AsyncStorage.removeItem(`skynkod_onboarded_${user.id}`); DevSettings.reload() } },
              ])} />
            {byGroup('admin').map((item, idx, arr) => (
              <ListRow key={item.name} icon={item.icon} title={item.label} subtitle={item.subtitle} onPress={() => open(item.name)} last={idx === arr.length - 1} />
            ))}
          </Card>
        </>
      ) : null}

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
  profile: { padding: SPACING.lg, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { width: 72, alignItems: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  starItem: { alignItems: 'center', width: '16%' },
  listCard: { paddingHorizontal: SPACING.lg },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, height: 52, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, marginTop: SPACING.xxl },
})
