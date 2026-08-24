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

  const [morningComplete, setMorningComplete] = useState(false)
  const [eveningComplete, setEveningComplete] = useState(false)
  const [morningStreak, setMorningStreak] = useState(0)
  const [eveningStreak, setEveningStreak] = useState(0)
  const [morningNotes, setMorningNotes] = useState('')
  const [eveningNotes, setEveningNotes] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRoutineStatus()
  }, [userId])

  const loadRoutineStatus = async () => {
    try {
      const morningDone = await getTodayRoutineCompletion(userId, 'morning')
      const eveningDone = await getTodayRoutineCompletion(userId, 'evening')
      const morningStrk = await getRoutineStreak(userId, 'morning')
      const eveningStrk = await getRoutineStreak(userId, 'evening')
      
      setMorningComplete(morningDone)
      setEveningComplete(eveningDone)
      setMorningStreak(morningStrk)
      setEveningStreak(eveningStrk)
    } catch (error) {
      console.error('Load routine status error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async (type) => {
    try {
      await markRoutineComplete(userId, type)
      if (type === 'morning') {
        setMorningComplete(true)
        const streak = await getRoutineStreak(userId, 'morning')
        setMorningStreak(streak)
        Alert.alert('Great!', '✅ Morning routine completed!')
      } else {
        setEveningComplete(true)
        const streak = await getRoutineStreak(userId, 'evening')
        setEveningStreak(streak)
        Alert.alert('Great!', '✅ Evening routine completed!')
      }
    } catch (error) {
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
        <Text style={[styles.title, { color: colors.text }]}>{t('routines_title')}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Track your daily routines</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* MORNING ROUTINE */}
        <View style={[styles.routineCard, morningComplete && { borderColor: colors.primary, borderWidth: 2 }, { backgroundColor: colors.card }]}>
          <View style={styles.routineHeader}>
            <Text style={styles.routineEmoji}>🌅</Text>
            <View style={styles.routineInfo}>
              <Text style={[styles.routineName, { color: colors.text }]}>{t('routines_morning')}</Text>
              <Text style={[styles.routineTime, { color: colors.muted }]}>Start your day right</Text>
            </View>
            {morningComplete && <Text style={styles.checkmark}>✓</Text>}
          </View>

          <View style={[styles.streakContainer, { backgroundColor: colors.bg }]}>
            <Text style={[styles.streakLabel, { color: colors.muted }]}>{t('routines_streak')}</Text>
            <Text style={[styles.streakNumber, { color: colors.primary }]}>{morningStreak} days</Text>
          </View>

          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
            placeholder="Add notes about your morning routine..."
            placeholderTextColor={colors.muted}
            value={morningNotes}
            onChangeText={setMorningNotes}
            multiline
          />

          <TouchableOpacity
            style={[styles.completeBtn, morningComplete && styles.completeBtnDone, { backgroundColor: morningComplete ? '#4CAF50' : colors.primary }]}
            onPress={() => handleMarkComplete('morning')}
            disabled={morningComplete}
          >
            <Text style={styles.completeBtnText}>
              {morningComplete ? '✓ Completed Today' : t('routines_complete')}
            </Text>
          </TouchableOpacity>

          <View style={styles.stepsList}>
            <Text style={[styles.stepsTitle, { color: colors.text }]}>Suggested Steps:</Text>
            <Text style={[styles.step, { color: colors.muted }]}>1. Cleanse your face</Text>
            <Text style={[styles.step, { color: colors.muted }]}>2. Apply toner</Text>
            <Text style={[styles.step, { color: colors.muted }]}>3. Apply serum</Text>
            <Text style={[styles.step, { color: colors.muted }]}>4. Apply moisturizer</Text>
            <Text style={[styles.step, { color: colors.muted }]}>5. Apply sunscreen</Text>
          </View>
        </View>

        {/* EVENING ROUTINE */}
        <View style={[styles.routineCard, eveningComplete && { borderColor: colors.primary, borderWidth: 2 }, { backgroundColor: colors.card }]}>
          <View style={styles.routineHeader}>
            <Text style={styles.routineEmoji}>🌙</Text>
            <View style={styles.routineInfo}>
              <Text style={[styles.routineName, { color: colors.text }]}>{t('routines_evening')}</Text>
              <Text style={[styles.routineTime, { color: colors.muted }]}>End your day with care</Text>
            </View>
            {eveningComplete && <Text style={styles.checkmark}>✓</Text>}
          </View>

          <View style={[styles.streakContainer, { backgroundColor: colors.bg }]}>
            <Text style={[styles.streakLabel, { color: colors.muted }]}>{t('routines_streak')}</Text>
            <Text style={[styles.streakNumber, { color: colors.primary }]}>{eveningStreak} days</Text>
          </View>

          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }]}
            placeholder="Add notes about your evening routine..."
            placeholderTextColor={colors.muted}
            value={eveningNotes}
            onChangeText={setEveningNotes}
            multiline
          />

          <TouchableOpacity
            style={[styles.completeBtn, eveningComplete && styles.completeBtnDone, { backgroundColor: eveningComplete ? '#4CAF50' : colors.primary }]}
            onPress={() => handleMarkComplete('evening')}
            disabled={eveningComplete}
          >
            <Text style={styles.completeBtnText}>
              {eveningComplete ? '✓ Completed Today' : t('routines_complete')}
            </Text>
          </TouchableOpacity>

          <View style={styles.stepsList}>
            <Text style={[styles.stepsTitle, { color: colors.text }]}>Suggested Steps:</Text>
            <Text style={[styles.step, { color: colors.muted }]}>1. Remove makeup</Text>
            <Text style={[styles.step, { color: colors.muted }]}>2. Cleanse your face</Text>
            <Text style={[styles.step, { color: colors.muted }]}>3. Apply toner</Text>
            <Text style={[styles.step, { color: colors.muted }]}>4. Apply serum</Text>
            <Text style={[styles.step, { color: colors.muted }]}>5. Apply night cream</Text>
          </View>
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
  routineHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  routineEmoji: { fontSize: 32, marginRight: 12 },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 18, fontWeight: 'bold' },
  routineTime: { fontSize: 12, marginTop: 2 },
  checkmark: { fontSize: 28, color: '#4CAF50', fontWeight: 'bold' },
  streakContainer: { padding: 12, borderRadius: 8, marginBottom: 12 },
  streakLabel: { fontSize: 12 },
  streakNumber: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  notesInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, height: 80 },
  completeBtn: { padding: 14, borderRadius: 8, marginBottom: 12 },
  completeBtnDone: { backgroundColor: '#4CAF50' },
  completeBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  stepsList: { borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 12 },
  stepsTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  step: { fontSize: 13, marginBottom: 6, lineHeight: 18 },
})