import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Asks the backend to wipe the signed-in user's data and login, then drops the
// local session. Returns { success: true } or { success: false, error }.
export const deleteAccount = async () => {
  try {
    if (!API_URL) return { success: false, error: 'EXPO_PUBLIC_API_URL is not set' };

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { success: false, error: 'Please sign in again first.' };

    const response = await fetch(`${API_URL.replace(/\/$/, '')}/delete-account`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      return { success: false, error: data.error || `HTTP ${response.status}` };
    }

    // The login no longer exists server-side, so only clear it on this device.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
