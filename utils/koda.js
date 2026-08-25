import AsyncStorage from '@react-native-async-storage/async-storage'
import { logError } from './errorLogger'

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY
const API_URL = 'https://api.anthropic.com/v1/messages'
const FREEMIUM_DAILY_LIMIT = 5
const PREMIUM_DAILY_LIMIT = 999

export async function callKodaAI(userMessage) {
  try {
    if (!API_KEY) {
      throw new Error('API key not configured')
    }

    // ✅ Extra validation
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('Message cannot be empty')
    }

    if (userMessage.length > 1000) {
      throw new Error('Message too long (max 1000 chars)')
    }

    const systemPrompt = `You are Koda, an AI skin care coach. You provide personalized skin care advice based on user input. Be friendly, professional, and helpful. Keep responses concise and actionable.`

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || `API error: ${response.status}`)
    }

    const data = await response.json()
    const aiMessage = data.content[0]?.text

    if (!aiMessage) {
      throw new Error('No response from API')
    }

    return aiMessage
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
