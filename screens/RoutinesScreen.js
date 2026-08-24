import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { getRoutineStreak, getTodayRoutineCompletion, markRoutineComplete } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function RoutinesScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [morningRoutine, setMorningRoutine] = useState('')
  const [morningNotes, setMorningNotes] = useState('')
  const [morningCompleted, setMorningCompleted] = useState(false)
  const [morningStreak, setMorningStreak] = useState(0)

  const [eveningRoutine, setEveningRoutine] = useState('')
  const [eveningNotes, setEveningNotes] = useState('')
  const [eveningCompleted, setEveningCompleted] = useState(false)
  const [eveningStreak, setEveningStreak] = useState(0)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initialize()
  }, [userId])

  const initialize = async () => {
    try {
      const today = await getTodayRoutineCompletion(userId)
      if (today) {
        setMorningRoutine(today.morning_routine || '')
        setMorningNotes(today.morning_notes || '')
        setMorningCompleted(today.morning_completed || false)
        setEveningRoutine(today.evening_routine || '')
        setEveningNotes(today.evening_notes || '')
        setEveningCompleted(today.evening_completed || false)
      }

      const mStreak = await getRoutineStreak(userId, 'morning')
      const eStreak = await getRoutineStreak(userId, 'evening')
      setMorningStreak(mStreak || 0)
      setEveningStreak(eStreak || 0)
    } catch (error) {
      console.error('Initialize error:', error)
      Alert.alert('Error', 'Failed to load routines')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteRoutine = async (type) => {
    try {
      const data = {
        user_id: userId,
        routine_type: type,
        completed: true,
        notes: type === 'morning' ? morningNotes : eveningNotes,
      }

      await markRoutineComplete(data)

      if (type === 'morning') {
        setMorningCompleted(true)
        setMorningStreak(morningStreak + 1)
      } else {
        setEveningCompleted(true)
        setEveningStreak(eveningStreak + 1)
      }

      Alert.alert('Success', `${type} routine completed! 🎉`)
    } catch (error) {
      console.error('Complete routine error:', error)
      Alert.alert('Error', 'Failed to mark routine complete')
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
              disabled={morningCompleted}
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
            placeholder="Notes (optional)..."
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
              disabled={eveningCompleted}
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
            placeholder="Notes (optional)..."
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
            Complete your routine daily to build streaks. Consistency is key to healthy skin!
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