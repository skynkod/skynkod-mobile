import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export const requestNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  } catch (error) {
    console.error('Request permissions error:', error)
    return false
  }
}

export const getExpoPushToken = async () => {
  try {
    const token = await Notifications.getExpoPushTokenAsync()
    return token.data
  } catch (error) {
    console.error('Get push token error:', error)
    return null
  }
}

export const scheduleMorningReminder = async (userId) => {
  try {
    const saved = await AsyncStorage.getItem(`morning_reminder_${userId}`)
    if (saved === 'disabled') return

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Good Morning!',
        body: 'Time for your morning skincare routine',
        sound: 'default',
        badge: 1,
      },
      trigger: {
        hour: 8,
        minute: 0,
        repeats: true,
      },
    })
  } catch (error) {
    console.error('Schedule morning reminder error:', error)
  }
}

export const scheduleEveningReminder = async (userId) => {
  try {
    const saved = await AsyncStorage.getItem(`evening_reminder_${userId}`)
    if (saved === 'disabled') return

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌙 Evening Routine',
        body: 'Time for your evening skincare routine',
        sound: 'default',
        badge: 1,
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      },
    })
  } catch (error) {
    console.error('Schedule evening reminder error:', error)
  }
}

export const scheduleJournalReminder = async (userId) => {
  try {
    const saved = await AsyncStorage.getItem(`journal_reminder_${userId}`)
    if (saved === 'disabled') return

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📔 Journal Check-in',
        body: 'How is your skin feeling today?',
        sound: 'default',
        badge: 1,
      },
      trigger: {
        hour: 21,
        minute: 0,
        repeats: true,
      },
    })
  } catch (error) {
    console.error('Schedule journal reminder error:', error)
  }
}

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
  } catch (error) {
    console.error('Cancel notifications error:', error)
  }
}

export const disableReminder = async (userId, reminderType) => {
  try {
    await AsyncStorage.setItem(`${reminderType}_reminder_${userId}`, 'disabled')
  } catch (error) {
    console.error('Disable reminder error:', error)
  }
}

export const enableReminder = async (userId, reminderType) => {
  try {
    await AsyncStorage.removeItem(`${reminderType}_reminder_${userId}`)
  } catch (error) {
    console.error('Enable reminder error:', error)
  }
}

export const isReminderEnabled = async (userId, reminderType) => {
  try {
    const saved = await AsyncStorage.getItem(`${reminderType}_reminder_${userId}`)
    return saved !== 'disabled'
  } catch (error) {
    return true
  }
}