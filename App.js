import AsyncStorage from '@react-native-async-storage/async-storage'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native'
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
import { LanguageProvider, useLanguage } from './utils/LanguageContext'
import { getExpoPushToken, requestNotificationPermissions, scheduleEveningReminder, scheduleJournalReminder, scheduleMorningReminder } from './utils/notifications'
import { ThemeProvider, useTheme } from './utils/ThemeContext'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

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
  const [showModal, setShowModal] = useState(false)

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

      <Modal visible={showModal} transparent animationType="slide">
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

            <ScrollView style={{ flex: 1 }}>
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
            </ScrollView>

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
  const navigation = useNavigation()
  const tabOptions = { 
    tabBarActiveTintColor: colors.primary, 
    headerShown: false, 
    tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border } 
  }
  
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        initialParams={{ userId }} 
        options={{ 
          tabBarLabel: 'Home', 
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text> 
        }} 
      />
      <Tab.Screen 
        name="Journal" 
        component={JournalScreen} 
        initialParams={{ userId }} 
        options={{ 
          tabBarLabel: 'Journal', 
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📔</Text> 
        }} 
      />
      <Tab.Screen 
        name="Koda" 
        component={KodaScreen} 
        initialParams={{ userId }} 
        options={{ 
          tabBarLabel: 'Koda', 
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✨</Text> 
        }} 
      />
      <Tab.Screen 
        name="Routines" 
        component={RoutinesScreen} 
        initialParams={{ userId }} 
        options={{ 
          tabBarLabel: 'Routines', 
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔄</Text> 
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        initialParams={{ userId }} 
        options={{ 
          tabBarLabel: 'Settings', 
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text> 
        }} 
      />
      
      <MoreMenu userId={userId} colors={colors} navigation={navigation} />

      {/* Hidden Stack Screens for "More" Menu */}
      {MORE_SCREENS.map(screen => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{ tabBarButton: () => null, headerShown: false }}
        />
      ))}
    </Tab.Navigator>
  )
}

function useNavigation() {
  const navigation = React.useContext(NavigationContext)
  if (!navigation) {
    throw new Error('useNavigation must be used within a NavigationContainer')
  }
  return navigation
}

import { NavigationContext } from '@react-navigation/native'

function AppContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { colors, loading: themeLoading } = useTheme()
  const { loading: languageLoading } = useLanguage()

  useEffect(() => {
    check()
  }, [])

  const check = async () => {
    try {
      const saved = await AsyncStorage.getItem('skynkod_user')
      const onboarded = await AsyncStorage.getItem('skynkod_onboarded')
      if (saved) {
        setUser(JSON.parse(saved))
        if (!onboarded) {
          setShowOnboarding(true)
        }
        
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