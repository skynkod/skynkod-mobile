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

// User functions
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

// Journal functions
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

// Products functions
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

// Chat history functions
export const getChatHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get chat history error:', error)
    return []
  }
}

export const saveChatMessage = async (userId, role, content) => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        role: role,
        content: content,
      })
      .select()
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Save chat message error:', error)
    return null
  }
}

export const clearChatHistory = async (userId) => {
  try {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Clear chat history error:', error)
    return false
  }
}

// Photo functions
export const uploadPhoto = async (userId, photoBase64, notes = '') => {
  try {
    const fileName = `${userId}/${Date.now()}.jpg`
    
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, decode(photoBase64), {
        contentType: 'image/jpeg',
      })
    
    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName)

    const photoUrl = data.publicUrl

    const { data: photoData, error: dbError } = await supabase
      .from('photos')
      .insert({
        user_id: userId,
        photo_url: photoUrl,
        notes: notes,
      })
      .select()

    if (dbError) throw dbError

    return { success: true, photo: photoData[0] }
  } catch (error) {
    console.error('Upload photo error:', error)
    return { success: false, error: error.message }
  }
}

export const getUserPhotos = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get photos error:', error)
    return []
  }
}

export const deletePhoto = async (photoId) => {
  try {
    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete photo error:', error)
    return false
  }
}

// Routine completion functions
export const markRoutineComplete = async (userId, routineType) => {
  try {
    const { data, error } = await supabase
      .from('routine_completions')
      .insert({
        user_id: userId,
        routine_type: routineType,
        date: new Date().toISOString().split('T')[0],
      })
      .select()
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Mark routine complete error:', error)
    return null
  }
}

export const getTodayRoutineCompletion = async (userId, routineType) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('routine_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('routine_type', routineType)
      .eq('date', today)
    if (error) throw error
    return data && data.length > 0
  } catch (error) {
    console.error('Get today routine completion error:', error)
    return false
  }
}

export const getRoutineStreak = async (userId, routineType) => {
  try {
    const { data, error } = await supabase
      .from('routine_completions')
      .select('date')
      .eq('user_id', userId)
      .eq('routine_type', routineType)
      .order('date', { ascending: false })
    if (error) throw error
    
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < data.length; i++) {
      const completionDate = new Date(data[i].date)
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      
      if (completionDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  } catch (error) {
    console.error('Get routine streak error:', error)
    return 0
  }
}

// Helper function to decode base64
function decode(base64String) {
  const binaryString = atob(base64String.split(',')[1] || base64String)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}