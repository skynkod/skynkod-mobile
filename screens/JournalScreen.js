import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { getJournalEntries, saveJournalEntry } from '../utils/supabase'

export default function JournalScreen({ route }) {
  const { userId } = route.params
  const [conditions, setConditions] = useState(['oily'])
  const [mood, setMood] = useState('okay')
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  const skinOptions = ['oily', 'dry', 'acne', 'irritated', 'normal', 'sensitive']

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    const data = await getJournalEntries(userId)
    setEntries(data)
  }

  const toggleCondition = (c) => {
    if (conditions.includes(c)) {
      setConditions(conditions.filter(x => x !== c))
    } else {
      setConditions([...conditions, c])
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await saveJournalEntry(userId, { date: today, skin_conditions: conditions, mood, notes })
      setConditions(['oily'])
      setMood('okay')
      setNotes('')
      Alert.alert('Success', 'Entry saved!')
      loadData()
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>Daily Check-In</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Skin?</Text>
          <View style={styles.tags}>
            {skinOptions.map(o => (
              <TouchableOpacity key={o} onPress={() => toggleCondition(o)} style={[styles.tag, conditions.includes(o) && styles.tagActive]}>
                <Text style={[styles.tagText, conditions.includes(o) && styles.tagTextActive]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Mood</Text>
          <View style={styles.moods}>
            {['great', 'okay', 'bad'].map(m => (
              <TouchableOpacity key={m} onPress={() => setMood(m)} style={[styles.moodBtn, mood === m && styles.moodActive]}>
                <Text style={styles.moodText}>{m === 'great' ? '😊' : m === 'okay' ? '😐' : '😔'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Notes</Text>
          <TextInput style={styles.textarea} placeholder="What products?" value={notes} onChangeText={setNotes} multiline />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>

        {entries.length > 0 ? (
          <View>
            <Text style={styles.pastTitle}>Past</Text>
            {entries.map(e => (
              <View key={e.id} style={styles.entryCard}>
                <Text style={styles.entryDate}>{e.date}</Text>
                <Text style={styles.entryText}>{e.skin_conditions.join(', ')} • {e.mood}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F1F5' },
  scroll: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#14121A' },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16 },
  label: { fontSize: 14, color: '#9B97A0', marginBottom: 12, fontWeight: 'bold' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 2, borderColor: '#B283AC' },
  tagActive: { backgroundColor: '#B283AC' },
  tagText: { color: '#B283AC', fontSize: 12 },
  tagTextActive: { color: 'white' },
  moods: { flexDirection: 'row', gap: 8 },
  moodBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, borderColor: '#B283AC', alignItems: 'center' },
  moodActive: { backgroundColor: '#B283AC' },
  moodText: { fontSize: 16 },
  textarea: { borderWidth: 1, borderColor: '#ABA0AA', borderRadius: 8, padding: 12, minHeight: 80 },
  saveBtn: { backgroundColor: '#B283AC', padding: 16, borderRadius: 8, marginBottom: 20 },
  saveBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  pastTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 12, color: '#14121A' },
  entryCard: { backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 8 },
  entryDate: { fontWeight: 'bold', color: '#14121A', marginBottom: 4 },
  entryText: { color: '#9B97A0', fontSize: 12 },
})