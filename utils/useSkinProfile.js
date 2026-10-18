import { useEffect, useState } from 'react'
import { getUserProfile } from './supabase'

// The user's skin type and concerns from onboarding, for match badges.
export const useSkinProfile = (userId) => {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    if (!userId) return
    let active = true
    getUserProfile(userId).then(p => {
      if (active) setProfile(p ? { skin_type: p.skin_type, skin_concerns: p.skin_concerns || [] } : null)
    })
    return () => { active = false }
  }, [userId])
  return profile
}
