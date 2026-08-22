const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY

export const askKodaWithContext = async (userMessage, journalHistory, chatHistory) => {
  try {
    const journalContext = journalHistory.length > 0 ? `Recent journal entries: ${journalHistory.slice(0, 5).map(e => `${e.date}: ${e.skin_conditions.join(', ')} (mood: ${e.mood})`).join('. ')}` : 'No journal entries yet'

    const systemPrompt = `You are Koda, an empathetic skincare AI coach. You have access to the user's skin journal history and chat history. 
    
${journalContext}

Be warm, encouraging, concise (max 100 words), and give personalized advice based on their skin patterns. Reference their specific conditions and mood trends when relevant. Remember what they've told you in this conversation.`

    const messages = [
      ...chatHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage }
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 250,
        system: systemPrompt,
        messages: messages,
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error('API Error:', data.error)
      return 'I had trouble responding. Try again!'
    }

    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text
    }

    return 'Sorry, I could not generate a response.'
  } catch (error) {
    console.error('Error:', error)
    return 'Connection issue. Please try again!'
  }
}