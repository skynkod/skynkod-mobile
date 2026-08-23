import AsyncStorage from '@react-native-async-storage/async-storage'

export const isPremiumUser = async (userId) => {
  try {
    const premium = await AsyncStorage.getItem(`premium_${userId}`)
    return premium === 'true'
  } catch (error) {
    return false
  }
}

export const setPremium = async (userId, isPremium) => {
  try {
    await AsyncStorage.setItem(`premium_${userId}`, isPremium ? 'true' : 'false')
  } catch (error) {
    console.error('Error setting premium:', error)
  }
}

export const getRemainingKodaChats = async (userId) => {
  try {
    const chats = await AsyncStorage.getItem(`koda_chats_${userId}`)
    return chats ? parseInt(chats) : 3
  } catch (error) {
    return 3
  }
}

export const decrementKodaChats = async (userId) => {
  try {
    const current = await getRemainingKodaChats(userId)
    const remaining = Math.max(0, current - 1)
    await AsyncStorage.setItem(`koda_chats_${userId}`, remaining.toString())
    return remaining
  } catch (error) {
    return 0
  }
}

export const resetKodaChats = async (userId) => {
  try {
    await AsyncStorage.setItem(`koda_chats_${userId}`, '3')
  } catch (error) {
    console.error('Error resetting chats:', error)
  }
}