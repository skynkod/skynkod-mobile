import React, { useState, useEffect } from 'react'
import { Text, ActivityIndicator, View, TouchableOpacity, Modal } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContext } from '@react-navigation/native'
import * as Notifications from 'expo-notifications'
import { ThemeProvider, useTheme } from './utils/ThemeContext'
import { LanguageProvider, useLanguage } from './utils/LanguageContext'
import { requestNotificationPermissions, getExpoPushToken, scheduleMorningReminder, scheduleEveningReminder, scheduleJournalReminder } from './utils/notifications'
import { logError } from './utils/errorLogger'
import LoginScreen from './screens/LoginScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import HomeScreen from './screens/HomeScreen'
import JournalScreen from './screens/JournalScreen'
import KodaScreen from './screens/KodaScreen'
import ProductsScreen from './screens/ProductsScreen'
import ProgressScreen from './screens/ProgressScreen'
import ProgressAnalysisScreen from './screens/ProgressAnalysisScreen'
import RoutinesScreen from './screens/RoutinesScreen'
import SettingsScreen from './screens/SettingsScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import BudgetScreen from './screens/BudgetScreen'
import PhotosScreen from './screens/PhotosScreen'
import SkinTypeQuizScreen from './screens/SkinTypeQuizScreen'
import AboutScreen from './screens/AboutScreen'
import PremiumScreen from './screens/PremiumScreen'
import EmergencyScreen from './screens/EmergencyScreen'
import BarcodeScannerScreen from './screens/BarcodeScannerScreen'

const Tab = createBottomTabNavigator()

const MORE_SCREENS = [
  { name: 'Progress', component: ProgressScreen, emoji: '📊', label: 'Progress' },
  { name: 'Analysis', component: ProgressAnalysisScreen, emoji: '📈', label: 'Analysis' },
  { name: 'Products', component: ProductsScreen, emoji: '🧴', label: 'Products' },
  { name: 'Photos', component: PhotosScreen, emoji: '📸', label: 'Photos' },
  { name: 'Quiz', component: SkinTypeQuizScreen, emoji: '🎯', label: 'Quiz' },
  { name: 'Budget', component: BudgetScreen, emoji: '💰', label: 'Budget' },
  { name: 'Alerts', component: NotificationsScreen, emoji: '🔔', label: 'Alerts' },
  { name: 'Premium', component: PremiumScreen, emoji: '👑', label: 'Premium' },
  { name: 'About', component: AboutScreen, emoji: 'ℹ️', label: 'About' },
  { name: 'Emergency', component: EmergencyScreen, emoji: '🆘', label: 'Emergency' },
  { name: 'Scanner', component: BarcodeScannerScreen, emoji: '📷', label: 'Scanner' },
]

function MoreMenu({ userId, colors, navigation }) {
  const [showModal, setShowModal] = React.useState(false)

  return (
    <>
      <Tab.Screen
        name="MoreTab"
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⋯</Text>,
          headerShown: false,
        }}
        listeners={{
          tabPress: e => {
            e.preventDefault()
            setShowModal(true)
          },
        }}
      >
        {() => <View />}
      </Tab.Screen>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: `${colors.bg}80` }}>
          <View
            style={{
              flex: 1,
              marginTop: 60,
              backgroundColor: colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          >
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>More Features</Text>
            </View>

            <View style={{ flex: 1 }}>
              {MORE_SCREENS.map(screen => (
                <TouchableOpacity
                  key={screen.name}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setShowModal(false)
                    navigation.navigate(screen.name, { userId })
                  }}
                >
                  <Text style={{ fontSize: 28, marginRight: 12 }}>{screen.emoji}</Text>
                  <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500', flex: 1 }}>
                    {screen.label}
                  </Text>
                  <Text style={{ color: colors.muted }}>→</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}
              onPress={() => setShowModal(false)}
            >
              <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

function AppTabs({ userId, colors }) {
  const navigation = React.useContext(NavigationContext)
  const tabOptions = { 
    tabBarActiveTintColor: colors.primary, 
    headerShown: false, 
    tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border } 
  }
  
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }} />
      <Tab.Screen name="Journal" component={JournalScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Journal', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📔</Text> }} />
      <Tab.Screen name="Koda" component={KodaScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Koda', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✨</Text> }} />
      <Tab.Screen name="Routines" component={RoutinesScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Routines', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔄</Text> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Settings', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text> }} />
      
      <MoreMenu userId={userId} colors={colors} navigation={navigation} />

      {MORE_SCREENS.map(screen => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{ tabBarButton: () => null, headerShown: false }}
          initialParams={{ userId }}
        />
      ))}
    </Tab.Navigator>
  )
}

function AppContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { colors, loading: themeLoading } = useTheme()
  const { loading: languageLoading } = useLanguage()

  useEffect(() => {
    const initApp = async () => {
      await check()
    }
    initApp()
  }, [])

  const check = async () => {
    try {
      const saved = await AsyncStorage.getItem('skynkod_user')
      const onboarded = await AsyncStorage.getItem('skynkod_onboarded')
      
      if (saved) {
        const userData = JSON.parse(saved)
        setUser(userData)
        
        if (!onboarded) {
          setShowOnboarding(true)
        }
        
        await initializeNotifications(userData.userId)
      }
    } catch (error) {
      await logError('AppContent_check', error, {}, 'error')
    } finally {
      setLoading(false)
    }
  }

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

  const handleLogin = async (email, userId) => {
    const data = { email, userId }
    setUser(data)
    await AsyncStorage.setItem('skynkod_user', JSON.stringify(data))
    await initializeNotifications(userId)
    
    const onboarded = await AsyncStorage.getItem('skynkod_onboarded')
    if (!onboarded) {
      setShowOnboarding(true)
    }
  }

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('skynkod_onboarded', 'true')
    setShowOnboarding(false)
  }

  if (themeLoading || languageLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (loading) return null
  if (!user) return <LoginScreen onLogin={handleLogin} />
  if (showOnboarding) return <OnboardingScreen onComplete={handleOnboardingComplete} />

  return (
    <NavigationContainer>
      <AppTabs userId={user.userId} colors={colors} />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  )
}
