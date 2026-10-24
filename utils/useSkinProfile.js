import { useEffect, useState } from 'react'
import { getUserProfile } from './supabase'
import { engineProfile } from './skin-quiz'
import { currentSkinState } from './skin-state'

// The user's skin answers from onboarding, and her skin state today, for match badges.
export const useSkinProfile = (userId) => {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    if (!userId) return
    let active = true
    // Her skin today (check-in or journal) rides along, for "not right now".
    Promise.all([getUserProfile(userId), currentSkinState(userId).catch(() => null)]).then(([p, skinState]) => {
      if (!active) return
      // Suspected conditions and fragile-skin treatments count as precautions.
      setProfile(p ? { ...engineProfile(p), skinState } : null)
    })
    return () => { active = false }
  }, [userId])
  return profile
}
