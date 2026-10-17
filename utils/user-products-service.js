import { supabase } from './supabase';

export const addUserProduct = async (userId, productId) => {
  try {
    const { data, error } = await supabase
      .from('user_products')
      .insert([
        {
          user_id: userId,
          product_id: productId,
          added_date: new Date().toISOString(),
        },
      ]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserProducts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_products')
      .select('products(*)')
      .eq('user_id', userId)
      .order('added_date', { ascending: false });

    if (error) throw error;
    return { success: true, data: data.map(up => up.products) };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const removeUserProduct = async (userId, productId) => {
  try {
    const { error } = await supabase
      .from('user_products')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
