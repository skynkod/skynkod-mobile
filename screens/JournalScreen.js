import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Keyboard } from 'react-native'
import { getJournalEntries, saveJournalEntry, deleteJournalEntry, updateJournalEntry } from '../utils/supabase'
import { useFetchWithCache } from '../utils/useFetchWithCache'
import { logError } from '../utils/errorLogger'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { SKIN_MOODS, SKIN_CONDITIONS } from '../utils/constants'

export default function JournalScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS
  const scrollViewRef = useRef(null)

  const { data: entries, loading, error, isOffline, fetch, retry } = useFetchWithCache(
    'journal_entries',
    () => getJournalEntries(userId),
    userId
  )

  const [mood, setMood] = useState('Good')
  const [conditions, setConditions] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    return () => {
      setMounted(false)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    fetch()
  }, [userId, fetch, mounted])

  const handleSaveEntry = async () => {
    if (!mood || !notes.trim()) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

    setSaving(true)
    Keyboard.dismiss()
    
    try {
      const entryData = {
        user_id: userId,
        mood,
        skin_conditions: conditions.join(', '),
        notes: notes.trim(),
      }

      if (editingId) {
        const success = await updateJournalEntry(editingId, entryData)
        if (success) {
          Alert.alert('Success', 'Entry updated!')
          setEditingId(null)
        } else {
          throw new Error('Failed to update entry')
        }
      } else {
        const result = await saveJournalEntry(entryData)
        if (result) {
          Alert.alert('Success', 'Entry saved!')
        } else {
          throw new Error('Failed to save entry')
        }
      }

      if (mounted) {
        await fetch()
        setMood('Good')
        setConditions([])
        setNotes('')
      }
    } catch (err) {
      await logError('JournalScreen_saveEntry', err, { userId, editingId }, 'error')
      Alert.alert('Error', err.message || 'Failed to save entry')
    } finally {
      if (mounted) {
        setSaving(false)
      }
    }
  }

  const handleDeleteEntry = async (entryId) => {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const success = await deleteJournalEntry(entryId)
            if (success) {
              if (mounted) {
                await fetch()
                Alert.alert('Success', 'Entry deleted')
              }
            } else {
              throw new Error('Failed to delete entry')
            }
          } catch (err) {
            await logError('JournalScreen_deleteEntry', err, { userId, entryId }, 'error')
            Alert.alert('Error', err.message || 'Failed to delete entry')
          }
        },
      },
    ])
  }

  const handleEditEntry = (entry) => {
    setMood(entry.mood || 'Good')
    setConditions(entry.skin_conditions ? entry.skin_conditions.split(', ') : [])
    setNotes(entry.notes || '')
    setEditingId(entry.id)
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true })
    }
  }

  const handleRetry = async () => {
    try {
      await retry()
    } catch (err) {
      await logError('JournalScreen_retry', err, { userId }, 'error')
    }
  }

  const toggleCondition = (condition) => {
    setConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    )
  }

  if (loading && !entries) {
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
        <Text style={[styles.subtitle, { color: colors.muted }]}>Track your skin</Text>
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: '#FF6B6B' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOffline && !error && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.offlineText}>📡 Offline - Showing cached data</Text>
        </View>
      )}

      <ScrollView ref={scrollViewRef} style={styles.content}>
        <View style={[styles.inputCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Entry</Text>

          <Text style={[styles.label, { color: colors.text }]}>How's your skin today?</Text>
          <View style={[styles.moodSelector, { borderColor: colors.primary }]}>
            {SKIN_MOODS.map(m => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.moodOption,
                  mood === m && { backgroundColor: colors.primary },
                ]}
                onPress={() => setMood(m)}
              >
                <Text style={[styles.moodText, mood === m && { color: 'white' }]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Skin Conditions</Text>
          <View style={styles.conditionsGrid}>
            {SKIN_CONDITIONS.map(condition => (
              <TouchableOpacity
                key={condition}
                style={[
                  styles.conditionTag,
                  { borderColor: colors.primary },
                  conditions.includes(condition) && { backgroundColor: colors.primary },
                ]}
                onPress={() => toggleCondition(condition)}
              >
                <Text
                  style={[
                    styles.conditionText,
                    conditions.includes(condition) ? { color: 'white' } : { color: colors.text },
                  ]}
                >
                  {condition}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

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
            placeholder="Write your observations..."
            placeholderTextColor={colors.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
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
              <Text style={styles.saveBtnText}>
                {editingId ? 'Update Entry' : 'Save Entry'}
              </Text>
            )}
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.primary }]}
              onPress={() => {
                setEditingId(null)
                setMood('Good')
                setConditions([])
                setNotes('')
                Keyboard.dismiss()
              }}
            >
              <Text style={[styles.cancelBtnText, { color: colors.primary }]}>Cancel Editing</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Previous Entries</Text>

          {!entries || entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📔</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No entries yet</Text>
            </View>
          ) : (
            entries.map(entry => (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card }]}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryMood, { color: colors.primary }]}>
                    {entry.mood || 'N/A'}
                  </Text>
                  <Text style={[styles.entryDate, { color: colors.muted }]}>
                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>

                {entry.skin_conditions && (
                  <Text style={[styles.entryConditions, { color: colors.muted }]}>
                    {entry.skin_conditions}
                  </Text>
                )}

                {entry.notes && (
                  <Text style={[styles.entryNotes, { color: colors.text }]}>
                    {entry.notes}
                  </Text>
                )}

                <View style={styles.entryActions}>
                  <TouchableOpacity onPress={() => handleEditEntry(entry)}>
                    <Text style={styles.actionEmoji}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)}>
                    <Text style={styles.actionEmoji}>🗑️</Text>
                  </TouchableOpacity>
                </View>
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
  errorBanner: { padding: 12, margin: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorText: { color: 'white', fontSize: 12, fontWeight: '600' },
  retryBtn: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  retryBtnText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  offlineBanner: { padding: 10, margin: 8, borderRadius: 8 },
  offlineText: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  content: { flex: 1, padding: 16 },
  inputCard: { borderRadius: 12, padding: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  moodSelector: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  moodOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRightWidth: 1 },
  moodText: { fontSize: 12, fontWeight: '600' },
  conditionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conditionTag: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  conditionText: { fontSize: 12, fontWeight: '500' },
  notesInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, textAlignVertical: 'top' },
  saveBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  cancelBtn: { borderWidth: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', fontSize: 14 },
  listSection: { marginBottom: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: 'bold' },
  entryCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  entryMood: { fontWeight: 'bold', fontSize: 14 },
  entryDate: { fontSize: 12 },
  entryConditions: { fontSize: 12, marginBottom: 8 },
  entryNotes: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  entryActions: { flexDirection: 'row', gap: 16 },
  actionEmoji: { fontSize: 20 },
})
