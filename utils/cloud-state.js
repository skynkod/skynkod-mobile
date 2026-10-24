import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

// Small pieces of her state kept on the phone AND in her account (Lita's
// audit, 2026-10-24), so a new phone gets them back. The phone answers first;
// the account fills in when the phone has nothing yet.
const localKey = (userId, name) => `${name}_${userId}`

export const loadState = async (userId, name, fallback = null) => {
  if (!userId) return fallback
  const local = await AsyncStorage.getItem(localKey(userId, name)).catch(() => null)
  if (local) { try { return JSON.parse(local) } catch {} }
  try {
    const { data } = await supabase.from('user_state').select('value').eq('user_id', userId).eq('key', name).maybeSingle()
    if (data?.value != null) {
      AsyncStorage.setItem(localKey(userId, name), JSON.stringify(data.value)).catch(() => {})
      return data.value
    }
  } catch {}
  return fallback
}

export const saveState = async (userId, name, value) => {
  if (!userId) return
  await AsyncStorage.setItem(localKey(userId, name), JSON.stringify(value)).catch(() => {})
  supabase.from('user_state').upsert({ user_id: userId, key: name, value, updated_at: new Date().toISOString() }).then(() => {}, () => {})
}
