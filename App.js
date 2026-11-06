import React, { useState, useEffect } from 'react'
import { View, ActivityIndicator, Platform, Pressable, Modal, StyleSheet, AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import JourneyToast from './components/JourneyToast'
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import { ThemeProvider, useTheme } from './utils/ThemeContext'
import { GlossyScope, GFW } from './components/glossy'
import { LanguageProvider, useLanguage, useT } from './utils/LanguageContext'
import { AuthProvider } from './utils/AuthContext'
import { supabase, signOut, updateUserProfile } from './utils/supabase'
import { requestNotificationPermissions, getExpoPushToken, syncSmartReminders } from './utils/notifications'
import { logError } from './utils/errorLogger'
import { setAnalyticsUser, track } from './utils/analytics'
import * as SplashScreen from 'expo-splash-screen'
import AnimatedSplash from './components/AnimatedSplash'
import RekodIcon from './components/RekodIcon'
import { GlossyIcon } from './components/FeatureIcon'
import { BottomSheet, ListRow, Card } from './components/ui'
import { SPACING } from './utils/theme'
import LoginScreen from './screens/LoginScreen'
import LockScreen from './components/LockScreen'
import { isLockOn } from './utils/privacy'
import OnboardingScreen from './screens/OnboardingScreen'
// The previous Home (screens/HomeScreen-updated.js) is kept, not deleted.
import HomeScreen from './screens/TodayScreen'
import JournalScreen from './screens/JournalScreen'
import KodaScreen from './screens/KodaScreen-updated'
import RoutinesScreen from './screens/RoutinesScreen-updated'
import SkinIssuesScreen from './screens/SkinIssuesScreen'
import ProfileChapterScreen from './screens/ProfileChapterScreen'
import MoreScreen, { MORE_SCREENS } from './screens/MoreScreen'
import SearchScreen from './screens/SearchScreen'
import ProductScreen from './screens/ProductScreen'
import IngredientScreen from './screens/IngredientScreen'
import ArticleScreen from './screens/ArticleScreen'
import RoutineBuilderScreen from './screens/RoutineBuilderScreen'
import ProductPickerScreen from './screens/ProductPickerScreen'
import PrivacyScreen from './screens/PrivacyScreen'
import SuggestionsScreen from './screens/SuggestionsScreen'
import ConditionScreen from './screens/ConditionScreen'
import SkinCheckInScreen from './screens/SkinCheckInScreen'
import RekodScreen from './screens/RekodScreen'
import DekodScreen from './screens/DekodScreen'
import LayeringScreen from './screens/LayeringScreen'

// Keep the native splash up until our animated one takes over.
SplashScreen.preventAutoHideAsync().catch(() => {})

const Tab = createBottomTabNavigator()
const navigationRef = createNavigationContainerRef()

// Bottom bar (option A, Lita 2026-10-20): Home · Rekod · (scan) · Dekod · Koda.
// The journal opens from Home's "Your skin today"; Profile from Home's avatar.
const TABS = [
  { name: 'Home', component: HomeScreen, label: 'Home', icon: 'home' },
  { name: 'Rekod', component: RekodScreen, label: 'Rekod', icon: 'rekod' },
  { name: 'Add', label: '', icon: 'add' },
  { name: 'Dekod', component: DekodScreen, label: 'Dekod', icon: 'scan-circle' },
  { name: 'Koda', component: KodaScreen, label: 'Koda', icon: 'koda' },
]

// What the big (+) button offers: the scan first, then the pages that left
// the bottom bar.
const QUICK_ACTIONS = [
  { icon: 'scan-outline', title: 'Scan a product', subtitle: 'Check ingredients and compatibility', to: 'Scanner' },
  { icon: 'book-outline', title: 'Journal', subtitle: 'Log how your skin feels today', to: 'Journal', params: () => ({ openNew: Date.now() }) },
  { icon: 'water-outline', title: 'My routines', subtitle: 'Morning and evening', to: 'Routines' },
  { icon: 'trending-up-outline', title: 'My progress', subtitle: 'How your skin is doing', to: 'Progress' },
  { icon: 'flask-outline', title: 'My products', subtitle: 'Your shelf and wishlist', to: 'Products' },
  { icon: 'library-outline', title: 'Learn', subtitle: 'Skin issues, ingredients, the basics', to: 'Skyncyclopedia' },
  { icon: 'person-outline', title: 'Profile', subtitle: 'Your account and skin profile', to: 'More' },
]

const Empty = () => null

function AppTabs({ userId }) {
  const { colors } = useTheme()
  const t = useT()
  const [quickOpen, setQuickOpen] = useState(false)

  return (
    <>
    <Tab.Navigator
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, ...GFW('600') },
        tabBarStyle: {
          backgroundColor: colors.solid || colors.card,
          borderTopColor: colors.border,
          paddingTop: 6,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
      }}
    >
      {TABS.map(tab =>
        tab.name === 'Add' ? (
          <Tab.Screen
            key="Add"
            name="Add"
            component={Empty}
            options={{
              tabBarLabel: () => null,
              tabBarAccessibilityLabel: t('Menu'),
              tabBarButton: () => (
                <View style={styles.addSlot}>
                  <Pressable
                    // (+) opens the menu, with the scan first; a long press goes straight to the scanner.
                    onPress={() => setQuickOpen(true)}
                    onLongPress={() => { if (navigationRef.isReady()) navigationRef.navigate('Scanner') }}
                    accessibilityRole="button"
                    accessibilityLabel={t('Menu')}
                    style={({ pressed }) => [styles.addButton, { backgroundColor: colors.solid || colors.accent, borderWidth: 1.5, borderColor: colors.border, shadowColor: colors.shadow, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
                  >
                    <GlossyIcon name="plus" size={30} />
                  </Pressable>
                </View>
              ),
            }}
          />
        ) : (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            initialParams={{ userId }}
            options={{
              tabBarLabel: t(tab.label),
              tabBarIcon: ({ color, focused, size }) =>
                tab.icon === 'koda' ? (
                  <GlossyIcon name="koda" size={size} dimmed={!focused} />
                ) : tab.icon === 'rekod' ? (
                  <RekodIcon size={size} dimmed={!focused} />
                ) : (
                  <GlossyIcon name={tab.icon === 'home' ? 'home' : 'dekod'} size={size} dimmed={!focused} />
                ),
            }}
          />
        )
      )}

      {/* Screens opened from Home, (+) or Profile: hidden from the tab bar. */}
      {[
        { name: 'Routines', component: RoutinesScreen },
        { name: 'SkinIssues', component: SkinIssuesScreen },
        { name: 'ProfileChapter', component: ProfileChapterScreen },
        { name: 'Search', component: SearchScreen },
        { name: 'Product', component: ProductScreen },
        { name: 'Ingredient', component: IngredientScreen },
        { name: 'Article', component: ArticleScreen },
        { name: 'RoutineBuilder', component: RoutineBuilderScreen },
        { name: 'ProductPicker', component: ProductPickerScreen },
        { name: 'Privacy', component: PrivacyScreen },
        { name: 'Suggestions', component: SuggestionsScreen },
        { name: 'Condition', component: ConditionScreen },
        { name: 'SkinCheckIn', component: SkinCheckInScreen },
        { name: 'Journal', component: JournalScreen },
        { name: 'Layering', component: LayeringScreen },
        { name: 'More', component: MoreScreen },
        ...MORE_SCREENS,
      ].map(screen => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          initialParams={{ userId }}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
            ...(['Scanner', 'RoutineBuilder', 'ProfileChapter', 'SkinIssues', 'SkinProfile'].includes(screen.name) ? { tabBarStyle: { display: 'none' } } : {}),
          }}
        />
      ))}
    </Tab.Navigator>

    <Modal visible={quickOpen} transparent animationType="fade" onRequestClose={() => setQuickOpen(false)}>
      <BottomSheet title={t('Menu')} onClose={() => setQuickOpen(false)}>
        <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
          {QUICK_ACTIONS.map((action, idx) => (
            <ListRow
              key={action.to}
              icon={action.icon}
              glossy
              title={t(action.title)}
              subtitle={t(action.subtitle)}
              last={idx === QUICK_ACTIONS.length - 1}
              onPress={() => {
                setQuickOpen(false)
                if (navigationRef.isReady()) navigationRef.navigate(action.to, action.params?.())
              }}
            />
          ))}
        </Card>
      </BottomSheet>
    </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  addSlot: { flex: 1, alignItems: 'center' },
  addButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
})

function AppContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  // No account yet: the sign-up journey comes first, the account at its end
  // (audit 2026-10-28). "I already have an account" opens the login screen.
  const [showLogin, setShowLogin] = useState(false)
  const [journeyKey, setJourneyKey] = useState(0)
  // Face ID lock (Settings › Privacy): at launch and each time the app comes back.
  const [locked, setLocked] = useState(false)
  useEffect(() => {
    isLockOn().then(on => on && setLocked(true))
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background') isLockOn().then(on => on && setLocked(true))
    })
    return () => sub.remove()
  }, [])
  const { colors, isDark, loading: themeLoading } = useTheme()
  const { loading: languageLoading } = useLanguage()
  const lastScreen = React.useRef(null)

  // Notes when the app was last opened (once a day). Inactive accounts are
  // deleted after a year, so opening the app also cancels any pending warning.
  const markSeen = async (userId) => {
    try {
      const key = `skynkod_seen_${userId}`
      const today = new Date().toDateString()
      if ((await AsyncStorage.getItem(key)) === today) return
      const ok = await updateUserProfile(userId, { last_seen_at: new Date().toISOString(), inactive_warned_30_at: null, inactive_warned_7_at: null })
      if (ok) await AsyncStorage.setItem(key, today)
    } catch (error) {
      await logError('AppContent_markSeen', error, { userId }, 'warn')
    }
  }

  const initializeNotifications = async (userId) => {
    try {
      // "Not now" at onboarding: don't ask again at every launch (Settings can).
      const later = await AsyncStorage.getItem(`skynkod_notif_later_${userId}`)
      const granted = await requestNotificationPermissions(!later)
      // Counted only when it changes, not at every launch.
      const notifKey = `skynkod_notif_counted_${userId}`
      if ((await AsyncStorage.getItem(notifKey)) !== String(granted)) {
        track('notifications', { on: !!granted })
        await AsyncStorage.setItem(notifKey, String(granted))
      }

      if (granted) {
        const token = await getExpoPushToken()
        if (token) {
          await AsyncStorage.setItem(`push_token_${userId}`, token)
        }

        // Every reminder, as she set them in Notifications (3 a day at most).
        await syncSmartReminders(userId)
      }
    } catch (error) {
      await logError('AppContent_initializeNotifications', error, { userId }, 'warn')
    }
  }

  const check = async () => {
    try {
      const saved = await AsyncStorage.getItem('skynkod_user')

      // Saved login without a Supabase session (signed out elsewhere, expired
      // or removed): back to the login screen instead of empty pages.
      const { data: { session } } = await supabase.auth.getSession()
      if (saved && !session?.user) {
        await AsyncStorage.removeItem('skynkod_user')
      } else if (saved) {
        const userData = JSON.parse(saved)
        setUser(userData)
        const onboarded = await AsyncStorage.getItem(`skynkod_onboarded_${userData.userId}`)

        if (!onboarded) {
          setShowOnboarding(true)
        }

        setAnalyticsUser(userData.userId).then(() => track('app_open')).catch(() => {})
        // Reminders are offered inside onboarding, with a preview first.
        if (onboarded) initializeNotifications(userData.userId)
        markSeen(userData.userId)
      }
    } catch (error) {
      await logError('AppContent_check', error, {}, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    check()
  }, [])

  // Supabase ended the session (refresh refused, password changed…): show login.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') handleAccountGone()
    })
    return () => listener?.subscription?.unsubscribe?.()
  }, [])

  // Tapping a reminder opens its page: Home for routines, the journal for the check-in.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response?.notification?.request?.content?.data?.screen
      if (!screen) return
      const go = () => navigationRef.navigate(screen, screen === 'Journal' ? { openNew: Date.now() } : undefined)
      if (navigationRef.isReady()) go()
      else setTimeout(() => navigationRef.isReady() && go(), 1500)
    })
    return () => sub.remove()
  }, [])

  const handleLogin = async (email, userId) => {
    const data = { email, userId }
    await AsyncStorage.setItem('skynkod_user', JSON.stringify(data))

    const onboarded = await AsyncStorage.getItem(`skynkod_onboarded_${userId}`)
    if (!onboarded) {
      setShowOnboarding(true)
    }
    setUser(data)
    setAnalyticsUser(userId).then(() => { track('sign_in'); track('app_open') }).catch(() => {})
    if (onboarded) initializeNotifications(userId)
    markSeen(userId)
  }

  // Clearing `user` is what actually sends the app back to the login screen.
  const handleLogout = async () => {
    const userId = user?.userId
    const result = await signOut()
    if (!result?.success) {
      throw new Error(result?.error || 'Logout failed')
    }

    const cacheKeys = ['journal_entries', 'user_products', 'today_routine', 'expenses', 'user_photos', 'chat_history', 'progress_photos', 'analysis_stats']
    await AsyncStorage.multiRemove([
      'skynkod_user',
      `push_token_${userId}`,
      ...cacheKeys.flatMap(key => [`cache_${key}`, `cache_${key}_timestamp`]),
    ]).catch(err => logError('AppContent_logoutStorage', err, { userId }, 'warn'))

    await Notifications.cancelAllScheduledNotificationsAsync().catch(err =>
      logError('AppContent_logoutNotifications', err, { userId }, 'warn')
    )

    setAnalyticsUser(null)
    setUser(null)
  }

  // Her account was just created at the end of the sign-up journey: the journey
  // goes on to her results with the same answers (same screen, now with her id).
  const handleSignedUp = async (email, userId) => {
    const data = { email, userId }
    await AsyncStorage.setItem('skynkod_user', JSON.stringify(data))
    setShowOnboarding(true)
    setUser(data)
    setAnalyticsUser(userId).then(() => track('app_open')).catch(() => {})
    markSeen(userId)
  }

  // The account was deleted on the server (under 18 at sign-up), or she left
  // the journey: back to the start of the journey.
  const handleAccountGone = async () => {
    setJourneyKey(k => k + 1)
    setShowLogin(false)
    await AsyncStorage.removeItem('skynkod_user').catch(() => {})
    // Signed out (session ended or account gone): her reminders stop too (notifications audit).
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {})
    setAnalyticsUser(null)
    setUser(null)
  }

  const handleOnboardingComplete = async (options) => {
    // Per account, so a new account on the same phone still gets onboarding.
    await AsyncStorage.setItem(`skynkod_onboarded_${user.userId}`, 'true')
    track('onboarding_done')
    setShowOnboarding(false)
    initializeNotifications(user.userId)
    // The Premium offer comes right after her plan is built, like Flo.
    if (options?.offerPremium) {
      const open = (tries = 0) => {
        if (navigationRef.isReady()) navigationRef.navigate('Premium', { fromOnboarding: true })
        else if (tries < 20) setTimeout(() => open(tries + 1), 150)
      }
      setTimeout(open, 300)
    }
  }

  const statusBar = <StatusBar style={isDark ? 'light' : 'dark'} />

  const booting = themeLoading || languageLoading || loading

  const baseNavTheme = isDark ? DarkTheme : DefaultTheme
  const navTheme = {
    ...baseNavTheme,
    colors: { ...baseNavTheme.colors, background: colors.bg, card: colors.card, border: colors.border, primary: colors.primary, text: colors.text },
  }

  let content = null
  // Dev web preview of the signed-in screens' look, with no account (?app-preview): data stays empty.
  const devApp = __DEV__ && Platform.OS === 'web' && globalThis.location?.search?.includes('app-preview') ? { id: '00000000-0000-0000-0000-000000000000', email: 'preview@localhost' } : null
  const devChapter = __DEV__ && Platform.OS === 'web' ? new URLSearchParams(globalThis.location?.search || '').get('chapter') : null
  if (devChapter) {
    // Dev web preview of a profile step, with sample saved answers; the result is logged.
    const sample = { goals: ['clear'], sex: 'woman', ageRange: 3, menopause: 'during', feel: 'combo', shine: 'tzone', pores: 'nose', reactivity: 'often', sun: 'tan', tone: 4, faceZones: ['forehead', 'jaw'], issues: ['comedonal-acne', 'pih', 'dark-circles', 'chapped-lips'], eyeDetails: ['brown'], priority: 'Dark spots', secondary: 'Acne', sleepHours: 6, stress: 'high', makeup: 'daily', sunTime: 'low', sweat: false, avoid: ['Fragrance', 'niacinamide'], conditions: ['Rosacea'], meds: [], prefs: ['vegan'], routineLevel: 'basic' }
    content = <OnboardingScreen userId={null} mode={{ chapters: devChapter.split(','), answers: sample, row: { first_name: 'Lina', consent_health_at: 'x' }, onDone: (answers, health) => { globalThis.__profileSaved = { answers, health } }, onCancel: () => { globalThis.__profileCancelled = true } }} />
  } else if (__DEV__ && Platform.OS === 'web' && globalThis.location?.search?.includes('onboarding')) {
    content = <OnboardingScreen userId={null} onComplete={async () => {}} onLeave={() => {}} />
  } else if (booting && !devApp) {
    content = showSplash ? null : <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
  } else if (!devApp && !user && showLogin) {
    content = <LoginScreen onLogin={handleLogin} onNew={() => setShowLogin(false)} />
  } else if (!devApp && (!user || showOnboarding)) {
    // One screen for both: creating the account mid-journey keeps her answers.
    content = <OnboardingScreen key={`journey-${journeyKey}`} userId={user?.userId || null} onComplete={handleOnboardingComplete} onLeave={handleAccountGone}
      onSignedIn={handleSignedUp} onHaveAccount={() => setShowLogin(true)} />
  } else {
    content = (
      <AuthProvider user={devApp || { id: user.userId, email: user.email }} onLogout={handleLogout} onReplayOnboarding={() => setShowOnboarding(true)}>
        {/* The whole app in the glossy universe of the sign-up (Lita, 2026-11-06). */}
        <GlossyScope>
        <NavigationContainer
          ref={navigationRef}
          theme={navTheme}
          onReady={() => {
            const screen = navigationRef.getCurrentRoute()?.name
            if (screen) track('screen', { screen })
            lastScreen.current = screen
          }}
          onStateChange={() => {
            // Counted once per visit (a screen updating its own params isn't a new visit).
            const screen = navigationRef.getCurrentRoute()?.name
            if (screen && screen !== lastScreen.current) track('screen', { screen })
            lastScreen.current = screen
          }}
        >
          <AppTabs userId={devApp?.id || user.userId} />
          <JourneyToast onOpen={() => { if (navigationRef.isReady()) navigationRef.navigate('Journey') }} />
        </NavigationContainer>
        </GlossyScope>
      </AuthProvider>
    )
  }

  // The splash sits on top of whatever screen is loading underneath, so it is
  // never remounted while it plays.
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {statusBar}
      {content}
      {locked && user && !booting ? <View style={StyleSheet.absoluteFill}><LockScreen onUnlock={() => setLocked(false)} /></View> : null}
      {showSplash ? <AnimatedSplash ready={!booting} onDone={() => setShowSplash(false)} /> : null}
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
