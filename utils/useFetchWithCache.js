import { useState, useCallback, useRef } from 'react'
import { getCachedData, setCachedData } from './cacheManager'
import { withRetry } from './retryManager'
import { logError } from './errorLogger'

export function useFetchWithCache(cacheKey, fetchFn, userId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(false)

  // Screens pass a new inline fetchFn on every render. Keeping it in a ref keeps
  // `fetch` stable, otherwise `useEffect(..., [fetch])` refetches in a loop.
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    setIsOffline(false)

    try {
      const freshData = await withRetry(() => fetchFnRef.current(), 3)
      setData(freshData)
      await setCachedData(cacheKey, freshData)
    } catch (err) {
      console.error(`Fetch error for ${cacheKey}:`, err)
      await logError(`useFetchWithCache_${cacheKey}`, err, { userId })

      const cached = await getCachedData(cacheKey)
      if (cached) {
        setData(cached.data)
        setIsOffline(true)
      } else {
        setData(null)
        setError(err.message || 'Failed to load data')
      }
    } finally {
      setLoading(false)
    }
  }, [cacheKey, userId])

  return { data, loading, error, isOffline, fetch, retry: fetch }
}
