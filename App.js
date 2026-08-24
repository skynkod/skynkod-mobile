import AsyncStorage from '@react-native-async-storage/async-storage'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import AboutScreen from './screens/AboutScreen'
import BarcodeScannerScreen from './screens/BarcodeScannerScreen'
import BudgetScreen from './screens/BudgetScreen'
import EmergencyScreen from './screens/EmergencyScreen'
import HomeScreen from './screens/HomeScreen'
import JournalScreen from './screens/JournalScreen'
import KodaScreen from './screens/KodaScreen'
import LoginScreen from './screens/LoginScreen'
import NotificationsScreen from './screens/NotificationsScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import PhotosScreen from './screens/PhotosScreen'
import PremiumScreen from './screens/PremiumScreen'
import ProductsScreen from './screens/ProductsScreen'
import ProgressAnalysisScreen from './screens/ProgressAnalysisScreen'
import ProgressScreen from './screens/ProgressScreen'
import RoutinesScreen from './screens/RoutinesScreen'
import SettingsScreen from './screens/SettingsScreen'
import SkinTypeQuizScreen from './screens/SkinTypeQuizScreen'
import { SKYNKOD_COLORS } from './utils/constants'
import { getExpoPushToken, requestNotificationPermissions, scheduleEveningReminder, scheduleJournalReminder, scheduleMorningReminder } from './utils/notifications'

const Tab = createBottomTabNavigator()

function AppTabs({ userId }) {
  const tabOptions = { tabBarActiveTintColor: SKYNKOD_COLORS.primary, headerShown: false }
  
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> }} />
      <Tab.Screen name="Journal" component={JournalScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Journal', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📔</Text> }} />
      <Tab.Screen name="Progress" component={ProgressScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Progress', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text> }} />
      <Tab.Screen name="Analysis" component={ProgressAnalysisScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Analysis', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📈</Text> }} />
      <Tab.Screen name="Koda" component={KodaScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Koda', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✨</Text> }} />
      <Tab.Screen name="Routines" component={RoutinesScreen} options={{ tabBarLabel: 'Routines', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔄</Text> }} />
      <Tab.Screen name="Products" component={ProductsScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Products', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🧴</Text> }} />
      <Tab.Screen name="Photos" component={PhotosScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Photos', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📸</Text> }} />
      <Tab.Screen name="Quiz" component={SkinTypeQuizScreen} options={{ tabBarLabel: 'Quiz', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎯</Text> }} />
      <Tab.Screen name="Budget" component={BudgetScreen} options={{ tabBarLabel: 'Budget', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💰</Text> }} />
      <Tab.Screen name="Alerts" component={NotificationsScreen} options={{ tabBarLabel: 'Alerts', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔔</Text> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Settings', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text> }} />
      <Tab.Screen name="Premium" component={PremiumScreen} initialParams={{ userId }} options={{ tabBarLabel: 'Premium', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👑</Text> }} />
      <Tab.Screen name="About" component={AboutScreen} options={{ tabBarLabel: 'About', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>ℹ️</Text> }} />
      <Tab.Screen name="Emergency" component={EmergencyScreen} options={{ tabBarLabel: 'SOS', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🆘</Text> }} />
      <Tab.Screen name="Scanner" component={BarcodeScannerScreen} options={{ tabBarLabel: 'Scanner', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📷</Text> }} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    check()
  }, [])

  const check = async () => {
    try {
      const saved = await AsyncStorage.getItem('skynkod_user')
      const onboarded = await AsyncStorage.getItem('skynkod_onboarded')
      if (saved) {
        setUser(JSON.parse(saved))
        if (!onboarded) setShowOnboarding(true)
        
        await initializeNotifications(JSON.parse(saved).userId)
      }
    } catch (error) {
      console.error('Error:', error)
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

        await scheduleMorningReminder(userId)
        await scheduleEveningReminder(userId)
        await scheduleJournalReminder(userId)
      }
    } catch (error) {
      console.error('Initialize notifications error:', error)
    }
  }

  const handleLogin = async (email, userId) => {
    const data = { email, userId }
    setUser(data)
    await AsyncStorage.setItem('skynkod_user', JSON.stringify(data))
    await initializeNotifications(userId)
    setShowOnboarding(true)
  }

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem('skynkod_onboarded', 'true')
    setShowOnboarding(false)
  }

  if (loading) return null
  if (!user) return <LoginScreen onLogin={handleLogin} />
  if (showOnboarding) return <OnboardingScreen onComplete={handleOnboardingComplete} />

  return (
    <NavigationContainer>
      <AppTabs userId={user.userId} />
    </NavigationContainer>
  )
}