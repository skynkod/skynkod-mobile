
export async function callKodaAI(userMessage, conversationHistory = []) {
  try {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY
    
    if (!apiKey) {
      throw new Error('Anthropic API key not configured')
    }

    // Build conversation context
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: userMessage,
      },
    ]

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: `You are Koda, an AI skincare coach. You provide personalized advice about skincare routines, products, and skin health. 
        
Be friendly, supportive, and practical. Keep responses concise and actionable.
If the user asks about serious skin conditions, recommend consulting a dermatologist.`,
        messages: messages,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'API request failed')
    }

    const data = await response.json()
    
    if (data.content && data.content.length > 0) {
      return data.content[0].text
    } else {
      throw new Error('No response from API')
    }
  } catch (error) {
    console.error('Koda AI error:', error)
    throw error
  }
}

// Rate limiting helper
export async function checkDailyMessageLimit(userId, currentCount, limit = 5) {
  const today = new Date().toISOString().split('T')[0]
  const key = `koda_messages_${userId}_${today}`
  
  if (currentCount >= limit) {
    return { canMessage: false, remaining: 0 }
  }
  
  return { canMessage: true, remaining: limit - currentCount }
}