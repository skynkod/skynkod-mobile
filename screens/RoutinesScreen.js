import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Keyboard } from 'react-native'
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
  const scrollViewRef = useRef(null)

  const { data: todayData, loading, error, isOffline, fetch, retry } = useFetchWithCache(
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
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    return () => {
      setMounted(false)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    initialize()
  }, [userId, mounted])

  useEffect(() => {
    if (todayData && mounted) {
      setMorningRoutine(todayData.morning_routine || '')
      setMorningNotes(todayData.morning_notes || '')
      setMorningCompleted(todayData.morning_completed || false)
      setEveningRoutine(todayData.evening_routine || '')
      setEveningNotes(todayData.evening_notes || '')
      setEveningCompleted(todayData.evening_completed || false)
    }
  }, [todayData, mounted])

  const initialize = async () => {
    try {
      await fetch()
      
      if (!mounted) return

      const mStreak = await getRoutineStreak(userId, 'morning')
      const eStreak = await getRoutineStreak(userId, 'evening')
      
      if (mounted) {
        setMorningStreak(mStreak || 0)
        setEveningStreak(eStreak || 0)
      }
    } catch (error) {
      await logError('RoutinesScreen_initialize', error, { userId }, 'error')
      if (mounted) {
        Alert.alert('Error', 'Failed to load routines')
      }
    }
  }

  const handleCompleteRoutine = async (type) => {
    setSaving(true)
    Keyboard.dismiss()

    try {
      const data = {
        user_id: userId,
        routine_type: type,
        [type === 'morning' ? 'morning_completed' : 'evening_completed']: true,
        [type === 'morning' ? 'morning_notes' : 'evening_notes']: type === 'morning' ? morningNotes : eveningNotes,
      }

      const success = await markRoutineComplete(data)
      
      if (success) {
        if (mounted) {
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
      } else {
        throw new Error(`Failed to mark ${type} routine complete`)
      }
    } catch (error) {
      await logError('RoutinesScreen_completeRoutine', error, { userId, type }, 'error')
      if (mounted) {
        Alert.alert('Error', error.message || 'Failed to mark routine complete')
      }
    } finally {
      if (mounted) {
        setSaving(false)
      }
    }
  }

  const handleRetry = async () => {
    try {
      await retry()
    } catch (err) {
      await logError('RoutinesScreen_retry', err, { userId }, 'error')
    }
  }

  if (loading && !todayData) {
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
        <Text style={[styles.subtitle, { color: colors.muted }]}>Daily skincare ritual</Text>
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
        {/* MORNING ROUTINE */}
        <View style={[styles.routineCard, { backgroundColor: colors.card }]}>
          <View style={styles.routineHeader}>
            <View style={styles.routineTitle}>
              <Text style={styles.routineEmoji}>☀️</Text>
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
                { borderColor: colors.primary },
                morningCompleted && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleCompleteRoutine('morning')}
              disabled={morningCompleted || saving}
            >
              <Text style={[styles.checkBtnText, morningCompleted && { color: 'white' }]}>
                {morningCompleted ? '✓' : '○'}
              </Text>
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
            editable={!morningCompleted && !saving}
            textAlignVertical="top"
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
            editable={!morningCompleted && !saving}
            textAlignVertical="top"
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
                { borderColor: colors.primary },
                eveningCompleted && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleCompleteRoutine('evening')}
              disabled={eveningCompleted || saving}
            >
              <Text style={[styles.checkBtnText, eveningCompleted && { color: 'white' }]}>
                {eveningCompleted ? '✓' : '○'}
              </Text>
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
            editable={!eveningCompleted && !saving}
            textAlignVertical="top"
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
            editable={!eveningCompleted && !saving}
            textAlignVertical="top"
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
  errorBanner: { padding: 12, margin: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorText: { color: 'white', fontSize: 12, fontWeight: '600' },
  retryBtn: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  retryBtnText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  offlineBanner: { padding: 10, margin: 8, borderRadius: 8 },
  offlineText: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  content: { flex: 1, padding: 16 },
  routineCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  routineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  routineTitle: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  routineEmoji: { fontSize: 32, marginRight: 12 },
  routineName: { fontWeight: 'bold', fontSize: 14 },
  routineStreak: { fontSize: 12, marginTop: 2 },
  checkBtn: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkBtnText: { fontSize: 24, fontWeight: 'bold', color: '#ccc' },
  routineInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 13, textAlignVertical: 'top' },
  notesInput: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 13, textAlignVertical: 'top' },
  infoCard: { borderRadius: 12, padding: 16, marginBottom: 24 },
  infoTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  infoText: { fontSize: 13, lineHeight: 20 },
})
