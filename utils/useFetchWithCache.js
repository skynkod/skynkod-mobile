import { useState, useCallback } from 'react'
import { getCachedData, setCachedData } from './cacheManager'
import { withRetry } from './retryManager'
import { logError } from './errorLogger'

export function useFetchWithCache(cacheKey, fetchFn, userId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    setIsOffline(false)

    try {
      // Try to fetch fresh data with retry
      const freshData = await withRetry(() => fetchFn(), 3)
      setData(freshData)
      
      // Cache it
      await setCachedData(cacheKey, freshData)
      
      setError(null)
    } catch (err) {
      console.error(`Fetch error for ${cacheKey}:`, err)
      
      // Log the error
      await logError(`useFetchWithCache_${cacheKey}`, err, { userId })
      
      // Try to get cached data as fallback
      const cached = await getCachedData(cacheKey)
      if (cached) {
        setData(cached.data)
        setIsOffline(true)
        setError(null)
      } else {
        setData(null)
        setError(err.message || 'Failed to load data')
      }
    } finally {
      setLoading(false)
    }
  }, [cacheKey, fetchFn, userId])

  const retry = useCallback(async () => {
    await fetch()
  }, [fetch])

  return { data, loading, error, isOffline, fetch, retry }
}
