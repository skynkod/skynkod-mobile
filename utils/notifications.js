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

const scheduleDaily = async (id, title, body, hour, minute) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(id)
  } catch (_) {}
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title, body, sound: true },
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

export const scheduleMorningReminder = (userId) =>
  scheduleDaily(`morning-${userId}`, "Skynkod", "Ta routine du matin t'attend ☀️", 8, 0)

// During Ramadan (in Arab and Muslim countries) the bedtime reminder also says
// to rehydrate; rescheduled at each app start, so it follows the month.
export const scheduleEveningReminder = (userId) =>
  scheduleDaily(
    `evening-${userId}`,
    "Skynkod",
    ramadanDay() ? "Ta routine du soir 🌙 Et pense à bien t'hydrater avant de dormir 💧" : "Ta routine du soir, c'est le moment 🌙",
    21,
    0,
  )

export const scheduleJournalReminder = (userId) =>
  scheduleDaily(`journal-${userId}`, "Skynkod", "Comment va ta peau ce matin ? 🌸", 7, 45)
