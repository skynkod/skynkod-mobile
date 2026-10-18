import React, { useState, useEffect } from 'react'
import { View, ActivityIndicator, Platform, Pressable, Modal, StyleSheet, Image } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import * as Notifications from 'expo-notifications'
import { ThemeProvider, useTheme } from './utils/ThemeContext'
import { LanguageProvider, useLanguage, useT } from './utils/LanguageContext'
import { AuthProvider } from './utils/AuthContext'
import { signOut } from './utils/supabase'
import { requestNotificationPermissions, getExpoPushToken, scheduleMorningReminder, scheduleEveningReminder, scheduleJournalReminder } from './utils/notifications'
import { logError } from './utils/errorLogger'
import * as SplashScreen from 'expo-splash-screen'
import AnimatedSplash from './components/AnimatedSplash'
import { BottomSheet, ListRow, Card } from './components/ui'
import { SPACING } from './utils/theme'
import LoginScreen from './screens/LoginScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import HomeScreen from './screens/HomeScreen-updated'
import JournalScreen from './screens/JournalScreen'
import KodaScreen from './screens/KodaScreen-updated'
import RoutinesScreen from './screens/RoutinesScreen-updated'
import MoreScreen, { MORE_SCREENS } from './screens/MoreScreen'
import SearchScreen from './screens/SearchScreen'
import ProductScreen from './screens/ProductScreen'
import IngredientScreen from './screens/IngredientScreen'

// Keep the native splash up until our animated one takes over.
SplashScreen.preventAutoHideAsync().catch(() => {})

const Tab = createBottomTabNavigator()
const navigationRef = createNavigationContainerRef()

// Bottom bar from the mockup: Home · Journal · (+) · Koda · Profile.
const TABS = [
  { name: 'Home', component: HomeScreen, label: 'Home', icon: 'home' },
  { name: 'Journal', component: JournalScreen, label: 'Journal', icon: 'book' },
  { name: 'Add', label: '', icon: 'add' },
  { name: 'Koda', component: KodaScreen, label: 'Koda', icon: 'koda' },
  { name: 'More', component: MoreScreen, label: 'Profile', icon: 'person' },
]

// What the big (+) button offers.
const QUICK_ACTIONS = [
  { icon: 'create-outline', title: 'Skin check-in', subtitle: 'Log how your skin feels today', to: 'Journal', params: () => ({ openNew: Date.now() }) },
  { icon: 'scan-outline', title: 'Scan a product', subtitle: 'Check ingredients and compatibility', to: 'Scanner' },
  { icon: 'flask-outline', title: 'Add a product', subtitle: 'Add it to your collection', to: 'Products' },
  { icon: 'camera-outline', title: 'Progress photo', subtitle: 'Track changes over time', to: 'Photos' },
  { icon: 'shield-checkmark-outline', title: 'Emergency mode', subtitle: 'A 7-day plan to calm your skin', to: 'Emergency' },
]

const Empty = () => null
const KODA_ICON = require('./assets/images/koda-logo-white.png')

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
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.card,
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
              tabBarAccessibilityLabel: t('Quick actions'),
              tabBarButton: () => (
                <View style={styles.addSlot}>
                  <Pressable
                    onPress={() => setQuickOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t('Quick actions')}
                    style={({ pressed }) => [styles.addButton, { backgroundColor: colors.accent, shadowColor: colors.shadow, transform: [{ scale: pressed ? 0.94 : 1 }] }]}
                  >
                    <Ionicons name="add" size={30} color="#FFFFFF" />
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
                  <Image source={KODA_ICON} style={{ width: size, height: size, tintColor: color }} />
                ) : (
                  <Ionicons name={focused ? tab.icon : `${tab.icon}-outline`} size={size - 2} color={color} />
                ),
            }}
          />
        )
      )}

      {/* Screens opened from Home, (+) or Profile: hidden from the tab bar. */}
      {[
        { name: 'Routines', component: RoutinesScreen },
        { name: 'Search', component: SearchScreen },
        { name: 'Product', component: ProductScreen },
        { name: 'Ingredient', component: IngredientScreen },
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
            ...(screen.name === 'Scanner' ? { tabBarStyle: { display: 'none' } } : {}),
          }}
        />
      ))}
    </Tab.Navigator>

    <Modal visible={quickOpen} transparent animationType="fade" onRequestClose={() => setQuickOpen(false)}>
      <BottomSheet title={t('Quick actions')} onClose={() => setQuickOpen(false)}>
        <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
          {QUICK_ACTIONS.map((action, idx) => (
            <ListRow
              key={action.to}
              icon={action.icon}
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
  const { colors, isDark, loading: themeLoading } = useTheme()
  const { loading: languageLoading } = useLanguage()

  const initializeNotifications = async (userId) => {
    try {
      const granted = await requestNotificationPermissions()

      if (granted) {
        const token = await getExpoPushToken()
        if (token) {
          await AsyncStorage.setItem(`push_token_${userId}`, token)
        }

        await Promise.all([
          scheduleMorningReminder(userId),
          scheduleEveningReminder(userId),
          scheduleJournalReminder(userId),
        ])
      }
    } catch (error) {
      await logError('AppContent_initializeNotifications', error, { userId }, 'warn')
    }
  }

  const check = async () => {
    try {
      const saved = await AsyncStorage.getItem('skynkod_user')

      if (saved) {
        const userData = JSON.parse(saved)
        setUser(userData)
        const onboarded = await AsyncStorage.getItem(`skynkod_onboarded_${userData.userId}`)

        if (!onboarded) {
          setShowOnboarding(true)
        }

        initializeNotifications(userData.userId)
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

  const handleLogin = async (email, userId) => {
    const data = { email, userId }
    await AsyncStorage.setItem('skynkod_user', JSON.stringify(data))

    const onboarded = await AsyncStorage.getItem(`skynkod_onboarded_${userId}`)
    if (!onboarded) {
      setShowOnboarding(true)
    }
    setUser(data)
    initializeNotifications(userId)
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

    setUser(null)
  }

  const handleOnboardingComplete = async () => {
    // Per account, so a new account on the same phone still gets onboarding.
    await AsyncStorage.setItem(`skynkod_onboarded_${user.userId}`, 'true')
    setShowOnboarding(false)
  }

  const statusBar = <StatusBar style={isDark ? 'light' : 'dark'} />

  const booting = themeLoading || languageLoading || loading

  const baseNavTheme = isDark ? DarkTheme : DefaultTheme
  const navTheme = {
    ...baseNavTheme,
    colors: { ...baseNavTheme.colors, background: colors.bg, card: colors.card, border: colors.border, primary: colors.primary, text: colors.text },
  }

  let content = null
  if (booting) {
    content = showSplash ? null : <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
  } else if (!user) {
    content = <LoginScreen onLogin={handleLogin} />
  } else if (showOnboarding) {
    content = <OnboardingScreen userId={user.userId} onComplete={handleOnboardingComplete} />
  } else {
    content = (
      <AuthProvider user={{ id: user.userId, email: user.email }} onLogout={handleLogout} onReplayOnboarding={() => setShowOnboarding(true)}>
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <AppTabs userId={user.userId} />
        </NavigationContainer>
      </AuthProvider>
    )
  }

  // The splash sits on top of whatever screen is loading underneath, so it is
  // never remounted while it plays.
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {statusBar}
      {content}
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
