import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://akshyahfnxmilhpimzme.supabase.co'
const supabaseAnonKey = 'sb_publishable_B7gC1CGaQLe1thewflvNvA_qeKHI_iP'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInApp: true,
  },
})

// ============ AUTH ============
export async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { success: false, error: error.message }
    return { success: true, user: data.user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    return { success: true, user: data.user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function getUser() {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return data.user
  } catch (error) {
    return null
  }
}

// ============ USER PROFILE ============
export async function createUser(userId, email) {
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

export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error('Get user profile error:', error)
    return null
  }
}

export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Update user profile error:', error)
    return null
  }
}

// ============ JOURNAL ============
export async function getJournalEntries(userId) {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Get journal entries error:', error)
    return []
  }
}

export async function saveJournalEntry(entry) {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([entry])
      .select()
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Save journal entry error:', error)
    return null
  }
}

export async function updateJournalEntry(entryId, updates) {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Update journal entry error:', error)
    return null
  }
}

export async function deleteJournalEntry(entryId) {
  try {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete journal entry error:', error)
    return false
  }
}

// ============ PRODUCTS ============
export async function getUserProducts(userId) {
  try {
    const { data, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Get user products error:', error)
    return []
  }
}

export async function addUserProduct(product) {
  try {
    const { data, error } = await supabase
      .from('user_products')
      .insert([product])
      .select()
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Add user product error:', error)
    return null
  }
}

export async function deleteUserProduct(productId) {
  try {
    const { error } = await supabase
      .from('user_products')
      .delete()
      .eq('id', productId)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete user product error:', error)
    return false
  }
}

// ============ CHAT ============
export async function getChatHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Get chat history error:', error)
    return []
  }
}

export async function saveChatMessage(messageData) {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .insert([messageData])
      .select()
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Save chat message error:', error)
    return null
  }
}

export async function clearChatHistory(userId) {
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

// ============ PHOTOS ============
export async function uploadPhoto(fileName, blob) {
  try {
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(fileName, blob, { contentType: 'image/jpeg' })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Upload photo error:', error)
    return null
  }
}

export async function getUserPhotos(userId) {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Get user photos error:', error)
    return []
  }
}

export async function deletePhoto(photoId) {
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

// ============ ROUTINES ============
export async function markRoutineComplete(data) {
  try {
    const { error } = await supabase
      .from('routine_completions')
      .insert([data])
    if (error) throw error
    return true
  } catch (error) {
    console.error('Mark routine complete error:', error)
    return false
  }
}

export async function getTodayRoutineCompletion(userId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('routine_completions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throw error
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    console.error('Get today routine completion error:', error)
    return null
  }
}

// ✅ FIXED: Changed .eq('${routineType}_completed', true) to .eq('completed', true)
// ✅ FIXED: Improved date calculation to use timezone-safe comparison
export async function getRoutineStreak(userId, routineType) {
  try {
    const { data, error } = await supabase
      .from('routine_completions')
      .select('created_at')
      .eq('user_id', userId)
      .eq('routine_type', routineType)
      .eq('completed', true)
      .order('created_at', { ascending: false })
    if (error) throw error
    if (!data || data.length === 0) return 0

    let streak = 1
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let currentDate = new Date(today)

    for (let i = 0; i < data.length; i++) {
      const entryDate = new Date(data[i].created_at)
      entryDate.setHours(0, 0, 0, 0)
      
      const expectedDate = new Date(currentDate)
      expectedDate.setDate(expectedDate.getDate() - 1)

      if (entryDate.getTime() === expectedDate.getTime()) {
        streak += 1
        currentDate = new Date(expectedDate)
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

// ============ EXPENSES ============
export async function getExpenses(userId) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  } catch (error) {
    console.error('Get expenses error:', error)
    return []
  }
}

export async function addExpense(expense) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Add expense error:', error)
    return null
  }
}

export async function deleteExpense(expenseId) {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete expense error:', error)
    return false
  }
}

// ✅ FIXED: Use UTC for consistent timezone handling
export async function getMonthlyBudgetTotal(userId) {
  try {
    const now = new Date()
    const firstDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))

    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', firstDay.toISOString())
      .lte('created_at', lastDay.toISOString())
    if (error) throw error

    const total = data.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    return total
  } catch (error) {
    console.error('Get monthly budget total error:', error)
    return 0
  }
}

// ============ ANALYTICS ============
export async function getJournalStats(userId, daysBack = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    const { data, error } = await supabase
      .from('journal_entries')
      .select('mood')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .limit(500)
    if (error) throw error

    const moodCounts = {
      Poor: 0,
      Okay: 0,
      Good: 0,
      Great: 0,
    }

    data.forEach(entry => {
      if (entry.mood && moodCounts.hasOwnProperty(entry.mood)) {
        moodCounts[entry.mood] += 1
      }
    })

    return moodCounts
  } catch (error) {
    console.error('Get journal stats error:', error)
    return null
  }
}

export async function getProductCount(userId) {
  try {
    const { count, error } = await supabase
      .from('user_products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (error) throw error
    return count
  } catch (error) {
    console.error('Get product count error:', error)
    return 0
  }
}
