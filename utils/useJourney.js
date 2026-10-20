import { useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { quickJourney, onJourneyNews } from './journey'

// Level, stars and earned badges for the profile circle and the Profile page.
// Read from the phone; refreshed on focus and whenever a badge or level is won.
export const useJourney = (userId) => {
  const [data, setData] = useState(null)
  const refresh = useCallback(() => { if (userId) quickJourney(userId).then(setData).catch(() => {}) }, [userId])
  useFocusEffect(refresh)
  useEffect(() => onJourneyNews(refresh), [refresh])
  return data
}
