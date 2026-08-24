import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { getJournalEntries, saveJournalEntry } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function JournalScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [entries, setEntries] = useState([])
  const [moodInput, setMoodInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadEntries()
  }, [userId])

  const loadEntries = async () => {
    try {
      const data = await getJournalEntries(userId)
      setEntries(data || [])
    } catch (error) {
      console.error('Load entries error:', error)
      Alert.alert('Error', 'Failed to load journal entries')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEntry = async () => {
    if (!moodInput.trim() && !notesInput.trim()) {
      Alert.alert('Error', 'Please enter mood or notes')
      return
    }

    setSaving(true)
    try {
      const newEntry = {
        user_id: userId,
        mood: moodInput.trim(),
        notes: notesInput.trim(),
      }

      const result = await saveJournalEntry(newEntry)
      if (result) {
        setEntries([result, ...entries])
        setMoodInput('')
        setNotesInput('')
        Alert.alert('Success', 'Journal entry saved!')
      }
    } catch (error) {
      console.error('Save entry error:', error)
      Alert.alert('Error', 'Failed to save entry')
    } finally {
      setSaving(false)
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
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Daily Journal</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Track your skin mood</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* INPUT SECTION */}
        <View style={[styles.inputSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Mood Today</Text>
          <TextInput
            style={[
              styles.moodInput,
              {
                backgroundColor: colors.bg,
                borderColor: colors.primary,
                color: colors.text,
              },
            ]}
            placeholder="How's your skin feeling? (Poor, Okay, Good, Great)"
            placeholderTextColor={colors.muted}
            value={moodInput}
            onChangeText={setMoodInput}
            editable={!saving}
          />

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Notes</Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.bg,
                borderColor: colors.primary,
                color: colors.text,
              },
            ]}
            placeholder="Any observations? Breakouts, dryness, irritation..."
            placeholderTextColor={colors.muted}
            value={notesInput}
            onChangeText={setNotesInput}
            multiline
            numberOfLines={4}
            editable={!saving}
          />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSaveEntry}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveBtnText}>Save Entry</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ENTRIES LIST */}
        <View style={styles.entriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Entries</Text>

          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📔</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No entries yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.muted }]}>Start tracking your skin today!</Text>
            </View>
          ) : (
            entries.map(entry => (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card }]}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryDate, { color: colors.muted }]}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.entryMood, { color: colors.primary, fontWeight: 'bold' }]}>
                    {entry.mood}
                  </Text>
                </View>
                {entry.notes && (
                  <Text style={[styles.entryNotes, { color: colors.text }]}>
                    {entry.notes}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  inputSection: { borderRadius: 12, padding: 16, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  moodInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 12 },
  notesInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, textAlignVertical: 'top', marginBottom: 12 },
  saveBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  entriesSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  emptySubtext: { fontSize: 12 },
  entryCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  entryDate: { fontSize: 12 },
  entryMood: { fontSize: 12 },
  entryNotes: { fontSize: 14, lineHeight: 20 },
})