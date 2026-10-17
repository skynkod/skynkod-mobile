import AsyncStorage from '@react-native-async-storage/async-storage'
import { logError } from './errorLogger'
import { askKoda } from './koda-ai'

const FREEMIUM_DAILY_LIMIT = 5
const PREMIUM_DAILY_LIMIT = 999

// Goes through the backend like askKoda; no model key lives in the app.
export async function callKodaAI(userMessage) {
  try {
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('Message cannot be empty')
    }

    if (userMessage.length > 1000) {
      throw new Error('Message too long (max 1000 chars)')
    }

    const result = await askKoda(userMessage)
    if (result.error) {
      throw new Error(result.message || result.error)
    }

    return result.content
  } catch (error) {
    await logError('callKodaAI', error, { messageLength: userMessage?.length })
    throw error
  }
}

export async function checkDailyMessageLimit(userId, isPremium) {
  try {
    const limit = isPremium ? PREMIUM_DAILY_LIMIT : FREEMIUM_DAILY_LIMIT
    const today = new Date().toISOString().split('T')[0]
    const key = `koda_messages_${userId}_${today}`
    
    const count = await AsyncStorage.getItem(key)
    const current = parseInt(count || '0', 10)

    if (current >= limit) {
      return { allowed: false, remaining: 0, limit }
    }

    // Increment counter
    await AsyncStorage.setItem(key, (current + 1).toString())

    // Expire counter at midnight
    await AsyncStorage.setItem(
      `${key}_expires`,
      new Date().setHours(24, 0, 0, 0).toString()
    )

    return { allowed: true, remaining: limit - current - 1, limit }
  } catch (error) {
    await logError('checkDailyMessageLimit', error, { userId })
    return { allowed: true, remaining: -1, limit: -1 } // Allow on error
  }
}
