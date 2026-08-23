import * as Notifications from 'expo-notifications'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export const scheduleDailyNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to journal! 📔',
        body: 'How is your skin today? Track it to see your progress!',
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      },
    })
  } catch (error) {
    console.error('Error scheduling notification:', error)
  }
}

export const requestNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    return status === 'granted'
  } catch (error) {
    console.error('Error requesting permissions:', error)
    return false
  }
}