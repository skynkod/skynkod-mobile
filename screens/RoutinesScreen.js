import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { markRoutineComplete, getTodayRoutineCompletion, getRoutineStreak } from '../utils/supabase'
import { useFetchWithCache } from '../utils/useFetchWithCache'
import { logError } from '../utils/errorLogger'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'

export default function RoutinesScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const { data: todayData, loading, fetch } = useFetchWithCache(
    'today_routine',
    () => getTodayRoutineCompletion(userId),
    userId
  )

  const [morningRoutine, setMorningRoutine] = useState('')
  const [morningNotes, setMorningNotes] = useState('')
  const [morningCompleted, setMorningCompleted] = useState(false)
  const [morningStreak, setMorningStreak] = useState(0)

  const [eveningRoutine, setEveningRoutine] = useState('')
  const [eveningNotes, setEveningNotes] = useState('')
  const [eveningCompleted, setEveningCompleted] = useState(false)
  const [eveningStreak, setEveningStreak] = useState(0)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    initialize()
  }, [userId])

  useEffect(() => {
    if (todayData) {
      setMorningRoutine(todayData.morning_routine || '')
      setMorningNotes(todayData.morning_notes || '')
      setMorningCompleted(todayData.morning_completed || false)
      setEveningRoutine(todayData.evening_routine || '')
      setEveningNotes(todayData.evening_notes || '')
      setEveningCompleted(todayData.evening_completed || false)
    }
  }, [todayData])

  const initialize = async () => {
    try {
      await fetch()

      const mStreak = await getRoutineStreak(userId, 'morning')
      const eStreak = await getRoutineStreak(userId, 'evening')
      setMorningStreak(mStreak || 0)
      setEveningStreak(eStreak || 0)
    } catch (error) {
      await logError('RoutinesScreen_initialize', error, { userId })
      Alert.alert('Error', 'Failed to load routines')
    }
  }

  const handleCompleteRoutine = async (type) => {
    setSaving(true)
    try {
      const data = {
        user_id: userId,
        routine_type: type,
        [type === 'morning' ? 'morning_completed' : 'evening_completed']: true,
        [type === 'morning' ? 'morning_notes' : 'evening_notes']: type === 'morning' ? morningNotes : eveningNotes,
      }

      const success = await markRoutineComplete(data)
      if (success) {
        if (type === 'morning') {
          setMorningCompleted(true)
          setMorningStreak(morningStreak + 1)
        } else {
          setEveningCompleted(true)
          setEveningStreak(eveningStreak + 1)
        }
        Alert.alert('Success', `${type} routine completed! 🎉`)
        await fetch()
      }
    } catch (error) {
      await logError('RoutinesScreen_completeRoutine', error, { userId })
      Alert.alert('Error', 'Failed to mark routine complete')
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
        <Text style={[styles.title, { color: colors.text }]}>Routines</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Build your streaks</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* MORNING ROUTINE */}
        <View style={[styles.routineCard, { backgroundColor: colors.card }]}>
          <View style={styles.routineHeader}>
            <View style={styles.routineTitle}>
              <Text style={styles.routineEmoji}>🌅</Text>
              <View>
                <Text style={[styles.routineName, { color: colors.text }]}>Morning Routine</Text>
                <Text style={[styles.routineStreak, { color: colors.primary }]}>
                  🔥 {morningStreak} day streak
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.checkBtn,
                morningCompleted && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleCompleteRoutine('morning')}
              disabled={morningCompleted || saving}
            >
              <Text style={styles.checkBtnText}>{morningCompleted ? '✓' : '○'}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.routineInput,
              {
                backgroundColor: colors.bg,
                borderColor: colors.primary,
                color: colors.text,
              },
            ]}
            placeholder="Your morning routine steps..."
            placeholderTextColor={colors.muted}
            value={morningRoutine}
            onChangeText={setMorningRoutine}
            multiline
            numberOfLines={3}
            editable={!morningCompleted}
          />

          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.bg,
                borderColor: colors.primary,
                color: colors.text,
              },
            ]}
            placeholder="Notes (saved to Supabase)..."
            placeholderTextColor={colors.muted}
            value={morningNotes}
            onChangeText={setMorningNotes}
            multiline
            numberOfLines={2}
            editable={!morningCompleted}
          />
        </View>

        {/* EVENING ROUTINE */}
        <View style={[styles.routineCard, { backgroundColor: colors.card }]}>
          <View style={styles.routineHeader}>
            <View style={styles.routineTitle}>
              <Text style={styles.routineEmoji}>🌙</Text>
              <View>
                <Text style={[styles.routineName, { color: colors.text }]}>Evening Routine</Text>
                <Text style={[styles.routineStreak, { color: colors.primary }]}>
                  🔥 {eveningStreak} day streak
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.checkBtn,
                eveningCompleted && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleCompleteRoutine('evening')}
              disabled={eveningCompleted || saving}
            >
              <Text style={styles.checkBtnText}>{eveningCompleted ? '✓' : '○'}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.routineInput,
              {
                backgroundColor: colors.bg,
                borderColor: colors.primary,
                color: colors.text,
              },
            ]}
            placeholder="Your evening routine steps..."
            placeholderTextColor={colors.muted}
            value={eveningRoutine}
            onChangeText={setEveningRoutine}
            multiline
            numberOfLines={3}
            editable={!eveningCompleted}
          />

          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: colors.bg,
                borderColor: colors.primary,
                color: colors.text,
              },
            ]}
            placeholder="Notes (saved to Supabase)..."
            placeholderTextColor={colors.muted}
            value={eveningNotes}
            onChangeText={setEveningNotes}
            multiline
            numberOfLines={2}
            editable={!eveningCompleted}
          />
        </View>

        {/* INFO */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>💡 Tips</Text>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Complete your routine daily to build streaks. Your notes are automatically saved!
          </Text>
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
  routineCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  routineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  routineTitle: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  routineEmoji: { fontSize: 32, marginRight: 12 },
  routineName: { fontWeight: 'bold', fontSize: 14 },
  routineStreak: { fontSize: 12, marginTop: 2 },
  checkBtn: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center', borderColor: '#ccc' },
  checkBtnText: { fontSize: 24, fontWeight: 'bold' },
  routineInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 13, textAlignVertical: 'top' },
  notesInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 13, textAlignVertical: 'top' },
  infoCard: { borderRadius: 12, padding: 16, marginBottom: 24 },
  infoTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  infoText: { fontSize: 13, lineHeight: 20 },
})
