import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://akshyahfnxmilhpimzme.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_B7gC1CGaQLe1thewflvNvA_qeKHI_iP'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Authentication functions
export const signUp = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return { success: true, user: data.user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return { success: true, user: data.user, session: data.session }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

// Database functions
export const createUser = async (userId, email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({ id: userId, email })
      .select()
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Create user error:', error)
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
    console.error('Get journal entries error:', error)
    return []
  }
}

export const saveJournalEntry = async (userId, entry) => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        mood: entry.mood,
        skin_conditions: entry.skin_conditions,
        notes: entry.notes,
      })
      .select()
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Save journal entry error:', error)
    return null
  }
}

export const getUserProducts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', userId)
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get user products error:', error)
    return []
  }
}

export const addUserProduct = async (userId, product) => {
  try {
    const { data, error } = await supabase
      .from('user_products')
      .insert({
        user_id: userId,
        product_name: product.name,
        brand: product.brand,
        category: product.category,
      })
      .select()
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Add product error:', error)
    return null
  }
}

export const deleteUserProduct = async (productId) => {
  try {
    const { error } = await supabase
      .from('user_products')
      .delete()
      .eq('id', productId)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete product error:', error)
    return false
  }
}