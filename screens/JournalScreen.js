import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { MOODS, SKIN_CONDITIONS } from '../utils/constants'
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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newEntry, setNewEntry] = useState({
    mood: 'Good',
    skin_conditions: [],
    notes: '',
  })

  useEffect(() => {
    loadJournalEntries()
  }, [userId])

  const loadJournalEntries = async () => {
    try {
      const data = await getJournalEntries(userId)
      setEntries(data)
    } catch (error) {
      console.error('Error loading entries:', error)
      Alert.alert('Error', 'Failed to load journal entries')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEntry = async () => {
    if (!newEntry.notes) {
      Alert.alert('Error', 'Please add some notes')
      return
    }

    setSubmitting(true)
    try {
      const saved = await saveJournalEntry(userId, newEntry)
      if (saved) {
        setEntries([saved, ...entries])
        setNewEntry({ mood: 'Good', skin_conditions: [], notes: '' })
        setShowForm(false)
        Alert.alert('Success', 'Journal entry saved!')
      } else {
        Alert.alert('Error', 'Failed to save entry')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleCondition = (condition) => {
    if (newEntry.skin_conditions.includes(condition)) {
      setNewEntry({
        ...newEntry,
        skin_conditions: newEntry.skin_conditions.filter(c => c !== condition),
      })
    } else {
      setNewEntry({
        ...newEntry,
        skin_conditions: [...newEntry.skin_conditions, condition],
      })
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
        <Text style={[styles.title, { color: colors.text }]}>{t('journal_title')}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t('journal_daily_checkin')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {!showForm ? (
          <>
            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📔</Text>
                <Text style={[styles.emptyText, { color: colors.text }]}>No entries yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.muted }]}>Start journaling your skin journey</Text>
              </View>
            ) : (
              <View style={styles.entriesList}>
                {entries.map(entry => (
                  <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card }]}>
                    <View style={styles.entryHeader}>
                      <Text style={[styles.entryDate, { color: colors.muted }]}>
                        {new Date(entry.date).toLocaleDateString()}
                      </Text>
                      <Text style={[styles.entryMood, { color: colors.primary }]}>{entry.mood}</Text>
                    </View>
                    {entry.skin_conditions && entry.skin_conditions.length > 0 && (
                      <View style={styles.conditionsRow}>
                        {entry.skin_conditions.map(cond => (
                          <View key={cond} style={[styles.conditionTag, { backgroundColor: colors.primary }]}>
                            <Text style={styles.conditionTagText}>{cond}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <Text style={[styles.entryNotes, { color: colors.text }]}>{entry.notes}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.formContainer}>
            <Text style={[styles.formLabel, { color: colors.text }]}>{t('journal_mood')}</Text>
            <View style={styles.moodSelector}>
              {MOODS.map(mood => (
                <TouchableOpacity
                  key={mood}
                  style={[
                    styles.moodBtn,
                    newEntry.mood === mood && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setNewEntry({ ...newEntry, mood })}
                >
                  <Text style={[
                    styles.moodBtnText,
                    newEntry.mood === mood ? { color: 'white' } : { color: colors.text }
                  ]}>
                    {mood}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.formLabel, { color: colors.text, marginTop: 16 }]}>{t('journal_conditions')}</Text>
            <View style={styles.conditionsGrid}>
              {SKIN_CONDITIONS.map(condition => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.conditionBtn,
                    { backgroundColor: newEntry.skin_conditions.includes(condition) ? colors.primary : colors.border }
                  ]}
                  onPress={() => toggleCondition(condition)}
                >
                  <Text style={[
                    styles.conditionBtnText,
                    { color: newEntry.skin_conditions.includes(condition) ? 'white' : colors.text }
                  ]}>
                    {condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.notesInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder={t('journal_notes')}
              placeholderTextColor={colors.muted}
              value={newEntry.notes}
              onChangeText={(text) => setNewEntry({ ...newEntry, notes: text })}
              multiline
              numberOfLines={5}
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formBtn, { backgroundColor: colors.border }]}
                onPress={() => setShowForm(false)}
                disabled={submitting}
              >
                <Text style={[styles.formBtnText, { color: colors.text }]}>{t('common_cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveEntry}
                disabled={submitting}
              >
                <Text style={styles.formBtnText}>{submitting ? 'Saving...' : t('journal_save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {!showForm && (
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.addBtnText}>+ {t('journal_daily_checkin')}</Text>
        </TouchableOpacity>
      )}
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
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  entriesList: { gap: 12, paddingBottom: 80 },
  entryCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  entryDate: { fontSize: 12, fontWeight: '600' },
  entryMood: { fontSize: 12, fontWeight: '600' },
  conditionsRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  conditionTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  conditionTagText: { color: 'white', fontSize: 10, fontWeight: '600' },
  entryNotes: { fontSize: 13, lineHeight: 18 },
  formContainer: { paddingBottom: 80 },
  formLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  moodSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  moodBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ccc' },
  moodBtnText: { fontWeight: '600', fontSize: 12 },
  conditionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  conditionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  conditionBtnText: { fontSize: 12, fontWeight: '600' },
  notesInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 },
  formButtons: { flexDirection: 'row', gap: 12 },
  formBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  formBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  addBtn: { position: 'absolute', bottom: 16, left: 16, right: 16, padding: 16, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
})