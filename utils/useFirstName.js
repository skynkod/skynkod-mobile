import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getUserProfile } from './supabase'

// The first name given during onboarding: from the phone right away, then
// refreshed from the profile in Supabase. null when the user hasn't given one.
export const useFirstName = (userId) => {
  const [firstName, setFirstName] = useState(null)

  useEffect(() => {
    if (!userId) return
    let active = true
    const key = `skynkod_first_name_${userId}`
    AsyncStorage.getItem(key)
      .then(saved => { if (active && saved) setFirstName(saved) })
      .catch(() => {})
    getUserProfile(userId).then(profile => {
      if (!active || !profile?.first_name) return
      setFirstName(profile.first_name)
      AsyncStorage.setItem(key, profile.first_name).catch(() => {})
    })
    return () => { active = false }
  }, [userId])

  return firstName
}
