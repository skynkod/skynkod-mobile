import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Koda runs through our backend, which holds the model key and checks the
// Supabase session. Only { role, content } is sent; the server cleans the rest.
export const askKoda = async (userMessage, conversationHistory = [], language = 'en') => {
  if (!API_URL) {
    return {
      error: 'missing_api_url',
      message: "Koda isn't configured yet: add EXPO_PUBLIC_API_URL to .env.local and restart Expo.",
    };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { error: 'not_signed_in', message: 'Please sign in to chat with Koda.' };
    }

    const messages = [...conversationHistory, { role: 'user', content: userMessage }]
      .filter(m => m && !m.error)
      .map(({ role, content }) => ({ role, content }));

    const response = await fetch(`${API_URL.replace(/\/$/, '')}/koda`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages, language }),
    });

    const data = await response.json().catch(() => ({}));

    if (data.error === 'refusal') {
      return { error: 'refusal', message: "I can't help with that one. Try asking another way?" };
    }

    if (data.error === 'daily_limit') {
      return {
        error: 'daily_limit',
        message: "You've used your Koda questions for today. Come back tomorrow! 🌙",
      };
    }

    if (!response.ok || data.error) {
      return {
        error: data.error || `HTTP ${response.status}`,
        message: response.status === 401
          ? 'Your session expired. Please sign in again.'
          : 'Sorry, something went wrong. Please try again.',
      };
    }

    return {
      role: 'assistant',
      content: data.content || 'No response',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      error: error.message,
      message: '⚠️ Connection error. Make sure you\'re online and try again.',
    };
  }
};

export const getKodaSuggestion = (skinConditions = []) => {
  const suggestions = {
    'Acne-prone': '💡 Have you tried a consistent spot treatment routine?',
    'Sensitive': '💡 Consider introducing one new product at a time.',
    'Dry': '💡 Try hydrating serums before moisturizer for extra hydration.',
    'Oily': '💡 Niacinamide can help control excess oil production.',
    'Aging': '💡 Retinol at night and vitamin C in the morning work great together.',
    'Redness': '💡 Centella asiatica is excellent for calming inflammation.',
    'Dehydrated': '💡 Hyaluronic acid works best on damp skin.',
  };

  if (skinConditions.length === 0) {
    return '💡 Tell me about your skin type so I can give better advice!';
  }

  const condition = skinConditions[0];
  return suggestions[condition] || '💡 What specific skincare concern can I help with?';
};

export const generateKodaIntroduction = () => {
  return `Hi! I'm Koda, your AI skin coach. 👋

I'm here to help you with:
✨ Personalized skincare routines
🧪 Product recommendations
💊 Ingredient information
🆘 Emergency skin rescue plans
📊 Skin tracking & analysis

Ask me anything about your skin! What can I help with today?`;
};
