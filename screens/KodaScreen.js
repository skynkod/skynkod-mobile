import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { getChatHistory, saveChatMessage } from '../utils/supabase'
import { callKodaAI, checkDailyMessageLimit } from '../utils/koda'
import { useFetchWithCache } from '../utils/useFetchWithCache'
import { logError } from '../utils/errorLogger'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { FREEMIUM_LIMITS } from '../utils/constants'

export default function KodaScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const { data: chatHistory, loading, error, isOffline, fetch, retry } = useFetchWithCache(
    'chat_history',
    () => getChatHistory(userId),
    userId
  )

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    initialize()
  }, [userId])

  useEffect(() => {
    if (chatHistory) {
      setMessages(chatHistory)
      checkMessageLimit()
    }
  }, [chatHistory])

  const initialize = async () => {
    try {
      await fetch()
      
      const premium = await AsyncStorage.getItem('skynkod_premium')
      setIsPremium(premium === 'true')
    } catch (err) {
      await logError('KodaScreen_initialize', err, { userId })
    }
  }

  const checkMessageLimit = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayMessages = (chatHistory || []).filter(m => {
      const msgDate = new Date(m.created_at).toISOString().split('T')[0]
      return msgDate === today && m.role === 'user'
    }).length

    setTodayCount(todayMessages)
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const limit = isPremium ? FREEMIUM_LIMITS.premium_daily_chat : FREEMIUM_LIMITS.freemium_daily_chat
    if (!isPremium && todayCount >= limit) {
      Alert.alert('Limit Reached', `You've reached your daily limit of ${limit} chats. Upgrade to Premium for unlimited access!`)
      return
    }

    const userMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      // Save user message
      await saveChatMessage({
        user_id: userId,
        role: 'user',
        content: userMessage.content,
      })

      // Get AI response
      const aiResponse = await callKodaAI(userMessage.content)

      if (!aiResponse) {
        throw new Error('No response from AI')
      }

      const assistantMessage = { role: 'assistant', content: aiResponse }
      setMessages(prev => [...prev, assistantMessage])

      // Save assistant message
      await saveChatMessage({
        user_id: userId,
        role: 'assistant',
        content: aiResponse,
      })

      setTodayCount(todayCount + 1)
      await fetch() // Refresh chat history
    } catch (err) {
      await logError('KodaScreen_sendMessage', err, { userId, userMessage })
      
      // Remove the user message if AI call failed
      setMessages(prev => prev.slice(0, -1))
      Alert.alert('Error', err.message || 'Failed to get response from Koda')
    } finally {
      setSending(false)
    }
  }

  if (loading && !messages.length) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Koda</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Your AI Skin Coach ✨</Text>
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: '#FF6B6B' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <TouchableOpacity onPress={retry} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOffline && !error && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.offlineText}>📡 Offline - Cached messages only</Text>
        </View>
      )}

      {!isPremium && (
        <View style={[styles.limitBanner, { backgroundColor: colors.card }]}>
          <Text style={[styles.limitText, { color: colors.text }]}>
            🔄 Today: {todayCount}/{FREEMIUM_LIMITS.freemium_daily_chat} chats
          </Text>
        </View>
      )}

      <ScrollView style={styles.messagesContainer}>
        {(!messages || messages.length === 0) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>Hi! I'm Koda, your AI skin coach</Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>Ask me anything about your skin!</Text>
          </View>
        )}

        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.message,
              msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
              msg.role === 'user'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.role === 'user'
                  ? { color: 'white' }
                  : { color: colors.text },
              ]}
            >
              {msg.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.bg,
              borderColor: colors.primary,
              color: colors.text,
            },
          ]}
          placeholder="Ask Koda..."
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: colors.primary, opacity: sending || !input.trim() ? 0.6 : 1 },
          ]}
          onPress={handleSendMessage}
          disabled={sending || !input.trim()}
        >
          {sending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 4 },
  errorBanner: { padding: 12, margin: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorText: { color: 'white', fontSize: 12, fontWeight: '600' },
  retryBtn: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  retryBtnText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  offlineBanner: { padding: 10, margin: 8, borderRadius: 8 },
  offlineText: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  limitBanner: { paddingHorizontal: 16, paddingVertical: 8, margin: 8, borderRadius: 8 },
  limitText: { fontSize: 12, fontWeight: '600' },
  messagesContainer: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14 },
  message: { marginBottom: 12, padding: 12, borderRadius: 12, maxWidth: '85%' },
  userMessage: { alignSelf: 'flex-end' },
  assistantMessage: { alignSelf: 'flex-start' },
  messageText: { fontSize: 14, lineHeight: 20 },
  inputContainer: { borderTopWidth: 1, padding: 12, flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, maxHeight: 100 },
  sendBtn: { paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
})
