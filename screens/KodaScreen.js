import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'
import { askKodaWithContext } from '../utils/koda'
import { decrementKodaChats, getRemainingKodaChats, isPremiumUser } from '../utils/premium'
import { getJournalEntries } from '../utils/supabase'

export default function KodaScreen({ route, navigation }) {
  const { userId } = route.params
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hi! I\'m Koda, your skincare coach. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [journalHistory, setJournalHistory] = useState([])
  const [isPremium, setIsPremium] = useState(false)
  const [remainingChats, setRemainingChats] = useState(3)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      const entries = await getJournalEntries(userId)
      setJournalHistory(entries)
      
      const premium = await isPremiumUser(userId)
      setIsPremium(premium)
      
      if (!premium) {
        const chats = await getRemainingKodaChats(userId)
        setRemainingChats(chats)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    if (!isPremium && remainingChats <= 0) {
      Alert.alert(
        'Out of Chats',
        'You\'ve used all 3 free Koda chats today!\n\nUpgrade to Premium for unlimited chat.',
        [
          { text: 'Cancel', onPress: () => {} },
          { text: 'Go Premium', onPress: () => navigation.navigate('Premium') },
        ]
      )
      return
    }

    const userMsg = { id: Date.now(), role: 'user', content: input }
    setMessages([...messages, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await askKodaWithContext(input, journalHistory, messages)
      const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: response }
      setMessages(prev => [...prev, assistantMsg])

      if (!isPremium) {
        const remaining = await decrementKodaChats(userId)
        setRemainingChats(remaining)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Koda AI Coach</Text>
        {!isPremium && <Text style={styles.badge}>{remainingChats}/3 chats left</Text>}
      </View>

      <ScrollView style={styles.chatBox}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.message, msg.role === 'user' ? styles.userMsg : styles.assistantMsg]}>
            <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>{msg.content}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator size="large" color={SKYNKOD_COLORS.primary} style={styles.loader} />}
      </ScrollView>

      {!isPremium && remainingChats === 0 && (
        <View style={styles.upgradePrompt}>
          <Text style={styles.upgradeText}>Upgrade to Premium for unlimited Koda chats!</Text>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate('Premium')}>
            <Text style={styles.upgradeBtnText}>Go Premium</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputBox}>
        <TextInput style={styles.input} placeholder="Ask Koda..." value={input} onChangeText={setInput} multiline editable={isPremium || remainingChats > 0} />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading || (!isPremium && remainingChats <= 0)}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: SKYNKOD_COLORS.border },
  title: { fontSize: 24, fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  badge: { fontSize: 12, color: 'white', backgroundColor: SKYNKOD_COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  chatBox: { flex: 1, padding: 16 },
  message: { marginBottom: 12, borderRadius: 8, padding: 12, maxWidth: '80%' },
  userMsg: { alignSelf: 'flex-end', backgroundColor: SKYNKOD_COLORS.primary },
  assistantMsg: { alignSelf: 'flex-start', backgroundColor: 'white' },
  userText: { color: 'white', fontSize: 14 },
  assistantText: { color: SKYNKOD_COLORS.text, fontSize: 14 },
  loader: { marginVertical: 20 },
  upgradePrompt: { backgroundColor: 'rgba(178, 131, 172, 0.1)', padding: 12, margin: 16, borderRadius: 8 },
  upgradeText: { color: SKYNKOD_COLORS.primary, fontWeight: 'bold', marginBottom: 8 },
  upgradeBtn: { backgroundColor: SKYNKOD_COLORS.primary, padding: 8, borderRadius: 6 },
  upgradeBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 12 },
  inputBox: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: SKYNKOD_COLORS.border, gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: SKYNKOD_COLORS.border, borderRadius: 8, padding: 12, maxHeight: 100 },
  sendBtn: { backgroundColor: SKYNKOD_COLORS.primary, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  sendBtnText: { color: 'white', fontWeight: 'bold' },
})