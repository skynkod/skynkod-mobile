import AsyncStorage from '@react-native-async-storage/async-storage'

// Cache avec TTL (Time To Live)
const CACHE_TTL = {
  journal: 60 * 60 * 1000, // 1 heure
  products: 60 * 60 * 1000, // 1 heure
  budget: 30 * 60 * 1000, // 30 minutes
  photos: 2 * 60 * 60 * 1000, // 2 heures
  profile: 60 * 60 * 1000, // 1 heure
}

export async function getCachedData(key) {
  try {
    const cached = await AsyncStorage.getItem(`cache_${key}`)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    const age = Date.now() - timestamp
    const ttl = CACHE_TTL[key] || 60 * 60 * 1000

    if (age > ttl) {
      // Cache expired
      await AsyncStorage.removeItem(`cache_${key}`)
      return null
    }

    return { data, age }
  } catch (err) {
    console.error(`Failed to get cached data for ${key}:`, err)
    return null
  }
}

export async function setCachedData(key, data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    }
    await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheData))
  } catch (err) {
    console.error(`Failed to cache data for ${key}:`, err)
  }
}

export async function clearCache(key) {
  try {
    await AsyncStorage.removeItem(`cache_${key}`)
  } catch (err) {
    console.error(`Failed to clear cache for ${key}:`, err)
  }
}

export async function clearAllCache() {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const cacheKeys = keys.filter(k => k.startsWith('cache_'))
    await AsyncStorage.multiRemove(cacheKeys)
  } catch (err) {
    console.error('Failed to clear all cache:', err)
  }
}
