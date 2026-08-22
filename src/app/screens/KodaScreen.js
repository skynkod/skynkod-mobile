import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'
import { askKodaWithContext } from '../utils/koda'
import { getJournalEntries } from '../utils/supabase'

export default function KodaScreen({ route }) {
  const { userId } = route.params
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hi! I\'m Koda, your skincare coach. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [journalHistory, setJournalHistory] = useState([])

  useEffect(() => {
    loadJournalHistory()
  }, [userId])

  const loadJournalHistory = async () => {
    try {
      const entries = await getJournalEntries(userId)
      setJournalHistory(entries)
    } catch (error) {
      console.error('Error loading journal:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg = { id: Date.now(), role: 'user', content: input }
    setMessages([...messages, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await askKodaWithContext(input, journalHistory, messages)
      const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: response }
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Koda AI Coach</Text>

      <ScrollView style={styles.chatBox}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.message, msg.role === 'user' ? styles.userMsg : styles.assistantMsg]}>
            <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>{msg.content}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator size="large" color={SKYNKOD_COLORS.primary} style={styles.loader} />}
      </ScrollView>

      <View style={styles.inputBox}>
        <TextInput style={styles.input} placeholder="Ask Koda..." value={input} onChangeText={setInput} multiline />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg },
  title: { fontSize: 24, fontWeight: 'bold', padding: 16, color: SKYNKOD_COLORS.text },
  chatBox: { flex: 1, padding: 16 },
  message: { marginBottom: 12, borderRadius: 8, padding: 12, maxWidth: '80%' },
  userMsg: { alignSelf: 'flex-end', backgroundColor: SKYNKOD_COLORS.primary },
  assistantMsg: { alignSelf: 'flex-start', backgroundColor: 'white' },
  userText: { color: 'white', fontSize: 14 },
  assistantText: { color: SKYNKOD_COLORS.text, fontSize: 14 },
  loader: { marginVertical: 20 },
  inputBox: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: SKYNKOD_COLORS.border, gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: SKYNKOD_COLORS.border, borderRadius: 8, padding: 12, maxHeight: 100 },
  sendBtn: { backgroundColor: SKYNKOD_COLORS.primary, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  sendBtnText: { color: 'white', fontWeight: 'bold' },
})