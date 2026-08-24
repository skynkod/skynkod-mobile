import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { callKodaAI } from '../utils/koda'
import { useLanguage } from '../utils/LanguageContext'
import { isPremiumUser } from '../utils/premium'
import { getChatHistory, saveChatMessage } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function KodaScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [todayMessageCount, setTodayMessageCount] = useState(0)

  useEffect(() => {
    initialize()
  }, [userId])

  const initialize = async () => {
    try {
      const premium = await isPremiumUser(userId)
      setIsPremium(premium)
      
      await loadChatHistory()
    } catch (error) {
      console.error('Initialize error:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory(userId)
      setMessages(history || [])

      // Count today's messages
      const today = new Date().toISOString().split('T')[0]
      const todayCount = (history || []).filter(m => {
        const msgDate = new Date(m.created_at).toISOString().split('T')[0]
        return msgDate === today && m.role === 'user'
      }).length

      setTodayMessageCount(todayCount)
    } catch (error) {
      console.error('Load chat history error:', error)
      Alert.alert('Error', 'Failed to load chat history')
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // FREEMIUM CHECK - BEFORE sending!
    if (!isPremium && todayMessageCount >= 5) {
      Alert.alert(
        'Limit Reached',
        'You have reached your daily chat limit (5 messages). Upgrade to Premium for unlimited chat!',
        [
          { text: 'Cancel', onPress: () => {} },
          {
            text: 'Go Premium',
            onPress: () => {
              // Navigate to Premium screen
              // For now, just show alert
              Alert.alert('Premium', 'Premium features coming soon!')
            },
          },
        ]
      )
      return
    }

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    try {
      // Add user message to UI immediately
      const newUserMessage = {
        id: Date.now(),
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      }
      setMessages([...messages, newUserMessage])

      // Call Koda AI
      const kodaResponse = await callKodaAI(userMessage, messages)

      if (!kodaResponse) {
        Alert.alert('Error', 'Failed to get response from Koda')
        return
      }

      // Add Koda response to UI
      const newKodaMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: kodaResponse,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, newKodaMessage])

      // Save both messages to database
      await saveChatMessage(userId, 'user', userMessage)
      await saveChatMessage(userId, 'assistant', kodaResponse)

      // Update today's message count
      setTodayMessageCount(prev => prev + 1)
    } catch (error) {
      console.error('Send message error:', error)
      Alert.alert('Error', `Failed to send message: ${error.message}`)
      // Remove the user message we added
      setMessages(messages.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Are you sure? This will clear the conversation.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Clear',
        onPress: () => {
          setMessages([])
          setTodayMessageCount(0)
          Alert.alert('Success', 'Chat cleared')
        },
      },
    ])
  }

  if (pageLoading) {
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
      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>✨</Text>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Koda</Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>Your AI Skin Coach</Text>
          </View>
        </View>

        {!isPremium && (
          <View style={[styles.limitBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.limitBadgeText}>{5 - todayMessageCount} left</Text>
          </View>
        )}
      </View>

      {/* MESSAGES */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => {}}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Hi! I'm Koda</Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              Ask me anything about skincare, routines, or your skin concerns
            </Text>
          </View>
        ) : (
          messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                msg.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
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
            </View>
          ))
        )}

        {loading && (
          <View style={styles.userMessageWrapper}>
            <View style={[styles.messageBubble, { backgroundColor: colors.primary }]}>
              <ActivityIndicator color="white" size="small" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* INPUT */}
      <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
        {todayMessageCount >= 5 && !isPremium && (
          <View style={[styles.limitWarning, { backgroundColor: colors.primary }]}>
            <Text style={styles.limitWarningText}>Daily limit reached. Upgrade to Premium for unlimited chat!</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Ask Koda anything..."
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            editable={!loading && (isPremium || todayMessageCount < 5)}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  loading || (!isPremium && todayMessageCount >= 5)
                    ? colors.muted
                    : colors.primary,
              },
            ]}
            onPress={handleSendMessage}
            disabled={loading || (!isPremium && todayMessageCount >= 5)}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>📤</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.clearBtn} onPress={handleClearChat}>
          <Text style={[styles.clearBtnText, { color: colors.muted }]}>Clear Chat</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerEmoji: { fontSize: 32, marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  limitBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  limitBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  messageWrapper: { marginBottom: 8 },
  userMessageWrapper: { alignItems: 'flex-end' },
  assistantMessageWrapper: { alignItems: 'flex-start' },
  messageBubble: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, maxWidth: '80%' },
  messageText: { fontSize: 14, lineHeight: 20 },
  inputContainer: { borderTopWidth: 1, padding: 12 },
  limitWarning: { borderRadius: 8, padding: 8, marginBottom: 8 },
  limitWarningText: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { fontSize: 20 },
  clearBtn: { alignItems: 'center', paddingVertical: 8, marginTop: 8 },
  clearBtnText: { fontSize: 12, fontWeight: '600' },
})