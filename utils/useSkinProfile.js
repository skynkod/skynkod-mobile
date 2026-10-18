import { useEffect, useState } from 'react'
import { getUserProfile } from './supabase'

// The user's skin answers from onboarding, for match badges.
export const useSkinProfile = (userId) => {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    if (!userId) return
    let active = true
    getUserProfile(userId).then(p => {
      if (!active) return
      setProfile(p ? {
        skin_type: p.skin_type,
        skin_concerns: p.skin_concerns || [],
        acne_types: p.acne_types || [],
        skin_conditions: p.skin_conditions || [],
        avoid_ingredients: p.avoid_ingredients || [],
        pregnancy: p.pregnancy || null,
      } : null)
    })
    return () => { active = false }
  }, [userId])
  return profile
}
