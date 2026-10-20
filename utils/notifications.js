import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { ramadanDay } from './ramadan'
import Constants from 'expo-constants'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export const requestNotificationPermissions = async () => {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync()
    let status = existing
    if (existing !== 'granted') {
      const response = await Notifications.requestPermissionsAsync()
      status = response.status
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    }
    return status === 'granted'
  } catch (error) {
    console.warn('Notification permission error:', error)
    return false
  }
}

export const getExpoPushToken = async () => {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
    return data
  } catch (error) {
    console.warn('Push token error:', error)
    return null
  }
}

// Reminders speak the app's language and open the right page when tapped.
const lang = async () => ((await AsyncStorage.getItem('skynkod_language').catch(() => null)) === 'fr' ? 'fr' : 'en')
const TEXT = {
  morning: { en: 'Your morning routine is waiting ☀️', fr: "Ta routine du matin t'attend ☀️" },
  evening: { en: 'Time for your evening routine 🌙', fr: "Ta routine du soir, c'est le moment 🌙" },
  eveningRamadan: { en: 'Your evening routine 🌙 And drink enough water before bed 💧', fr: "Ta routine du soir 🌙 Et pense à bien t'hydrater avant de dormir 💧" },
  journal: { en: 'How is your skin this morning? 🌸', fr: 'Comment va ta peau ce matin ? 🌸' },
}

const scheduleDaily = async (id, title, body, hour, minute, screen) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(id)
  } catch (_) {}
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title, body, sound: true, data: screen ? { screen } : {} },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    })
  } catch (error) {
    console.warn(`Schedule ${id} error:`, error)
  }
}

export const scheduleMorningReminder = async (userId) =>
  scheduleDaily(`morning-${userId}`, 'Skynkod', TEXT.morning[await lang()], 8, 0, 'Home')

// During Ramadan (in Arab and Muslim countries) the bedtime reminder also says
// to rehydrate; rescheduled at each app start, so it follows the month.
export const scheduleEveningReminder = async (userId) =>
  scheduleDaily(`evening-${userId}`, 'Skynkod', (ramadanDay() ? TEXT.eveningRamadan : TEXT.evening)[await lang()], 21, 0, 'Home')

export const scheduleJournalReminder = async (userId) =>
  scheduleDaily(`journal-${userId}`, 'Skynkod', TEXT.journal[await lang()], 7, 45, 'Journal')
