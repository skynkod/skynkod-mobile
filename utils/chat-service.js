import { supabase } from './supabase';

export const saveChatMessage = async (userId, message) => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .insert([
        {
          user_id: userId,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp || new Date().toISOString(),
        },
      ]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getChatHistory = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data: data.reverse() };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const clearChatHistory = async (userId) => {
  try {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
