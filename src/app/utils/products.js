import { supabase } from './supabase'

export const getUserProducts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export const addUserProduct = async (userId, productId, quantity = 1) => {
  try {
    const { data, error } = await supabase
      .from('user_products')
      .insert([{ user_id: userId, product_id: productId, quantity }])
      .select()

    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error adding product:', error)
    return null
  }
}

export const deleteUserProduct = async (id) => {
  try {
    const { error } = await supabase
      .from('user_products')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting product:', error)
    return false
  }
}