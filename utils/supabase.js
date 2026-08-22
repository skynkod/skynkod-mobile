import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export const getUser = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    return null
  }
}

export const createUser = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ email }])
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

export const getJournalEntries = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching entries:', error)
    return []
  }
}

export const saveJournalEntry = async (userId, entry) => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([{ user_id: userId, ...entry }])
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error saving entry:', error)
    return null
  }
}