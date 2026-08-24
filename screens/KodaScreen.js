import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
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
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [chatsToday, setChatsToday] = useState(0)

  useEffect(() => {
    loadChatHistory()
    checkPremiumStatus()
  }, [userId])

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory(userId)
      setMessages(history)
      
      // Count chats from today
      const today = new Date().toISOString().split('T')[0]
      const todayChats = history.filter(m => m.role === 'assistant' && m.created_at?.startsWith(today))
      setChatsToday(todayChats.length)
    } catch (error) {
      console.error('Error loading chat history:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkPremiumStatus = async () => {
    const premium = await isPremiumUser(userId)
    setIsPremium(premium)
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    // Check freemium limits
    if (!isPremium && chatsToday >= 3) {
      Alert.alert('Limit Reached', 'Upgrade to Premium for unlimited Koda chats!')
      return
    }

    setSending(true)
    try {
      // Save user message
      await saveChatMessage(userId, 'user', inputText)
      
      // Add to UI
      setMessages([...messages, { role: 'user', content: inputText, created_at: new Date().toISOString() }])

      // Get AI response
      const response = await callKodaAI(userId, inputText, messages)
      
      // Save AI response
      await saveChatMessage(userId, 'assistant', response)
      
      // Add to UI
      setMessages(prev => [...prev, { role: 'assistant', content: response, created_at: new Date().toISOString() }])
      
      setInputText('')
      setChatsToday(chatsToday + 1)
    } catch (error) {
      Alert.alert('Error', 'Failed to get response from Koda')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
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
        <Text style={[styles.title, { color: colors.text }]}>Koda AI Coach</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {isPremium ? 'Unlimited' : `${3 - chatsToday} chats left today`}
        </Text>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <View style={styles.welcomeMessage}>
            <Text style={styles.welcomeEmoji}>✨</Text>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>Hi! I'm Koda</Text>
            <Text style={[styles.welcomeText, { color: colors.muted }]}>
              Your AI skin coach. Ask me anything about skincare, routines, or your skin concerns!
            </Text>
          </View>
        ) : (
          messages.map((msg, idx) => (
            <View
              key={idx}
              style={[
                styles.messageBubble,
                msg.role === 'user'
                  ? { alignSelf: 'flex-end', backgroundColor: colors.primary }
                  : { alignSelf: 'flex-start', backgroundColor: colors.card },
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  { color: msg.role === 'user' ? 'white' : colors.text },
                ]}
              >
                {msg.content}
              </Text>
            </View>
          ))
        )}
        {sending && (
          <View style={[styles.messageBubble, { alignSelf: 'flex-start', backgroundColor: colors.card }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder={t('koda_ask')}
          placeholderTextColor={colors.muted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxHeight={100}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: sending ? 0.5 : 1 }]}
          onPress={handleSendMessage}
          disabled={sending || !inputText.trim()}
        >
          <Text style={styles.sendBtnText}>{t('koda_send')}</Text>
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
  messagesContainer: { flex: 1, padding: 16 },
  welcomeMessage: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  welcomeEmoji: { fontSize: 60, marginBottom: 16 },
  welcomeTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  welcomeText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  messageBubble: { borderRadius: 12, padding: 12, marginVertical: 6, maxWidth: '85%' },
  messageText: { fontSize: 14, lineHeight: 18 },
  inputContainer: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, alignItems: 'flex-end' },
  input: { flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
  sendBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  sendBtnText: { color: 'white', fontWeight: 'bold' },
})