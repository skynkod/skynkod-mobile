import { useEffect, useState } from 'react'
import { getUserProfile } from './supabase'
import { engineProfile } from './skin-quiz'

// The user's skin answers from onboarding, for match badges.
export const useSkinProfile = (userId) => {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    if (!userId) return
    let active = true
    getUserProfile(userId).then(p => {
      if (!active) return
      // Suspected conditions and fragile-skin treatments count as precautions.
      setProfile(p ? engineProfile(p) : null)
    })
    return () => { active = false }
  }, [userId])
  return profile
}
