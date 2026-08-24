import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'
import { getRoutineStreak, getTodayRoutineCompletion, markRoutineComplete } from '../utils/supabase'

export default function RoutinesScreen({ route }) {
  const { userId } = route.params
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
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={SKYNKOD_COLORS.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skincare Routines</Text>
        <Text style={styles.subtitle}>Track your daily routines</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* MORNING ROUTINE */}
        <View style={[styles.routineCard, morningComplete && styles.routineCardComplete]}>
          <View style={styles.routineHeader}>
            <Text style={styles.routineEmoji}>🌅</Text>
            <View style={styles.routineInfo}>
              <Text style={styles.routineName}>Morning Routine</Text>
              <Text style={styles.routineTime}>Start your day right</Text>
            </View>
            {morningComplete && <Text style={styles.checkmark}>✓</Text>}
          </View>

          <View style={styles.streakContainer}>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakNumber}>{morningStreak} days</Text>
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about your morning routine..."
            value={morningNotes}
            onChangeText={setMorningNotes}
            multiline
            placeholderTextColor={SKYNKOD_COLORS.muted}
          />

          <TouchableOpacity
            style={[styles.completeBtn, morningComplete && styles.completeBtnDone]}
            onPress={() => handleMarkComplete('morning')}
            disabled={morningComplete}
          >
            <Text style={styles.completeBtnText}>
              {morningComplete ? '✓ Completed Today' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>

          <View style={styles.stepsList}>
            <Text style={styles.stepsTitle}>Suggested Steps:</Text>
            <Text style={styles.step}>1. Cleanse your face</Text>
            <Text style={styles.step}>2. Apply toner</Text>
            <Text style={styles.step}>3. Apply serum</Text>
            <Text style={styles.step}>4. Apply moisturizer</Text>
            <Text style={styles.step}>5. Apply sunscreen</Text>
          </View>
        </View>

        {/* EVENING ROUTINE */}
        <View style={[styles.routineCard, eveningComplete && styles.routineCardComplete]}>
          <View style={styles.routineHeader}>
            <Text style={styles.routineEmoji}>🌙</Text>
            <View style={styles.routineInfo}>
              <Text style={styles.routineName}>Evening Routine</Text>
              <Text style={styles.routineTime}>End your day with care</Text>
            </View>
            {eveningComplete && <Text style={styles.checkmark}>✓</Text>}
          </View>

          <View style={styles.streakContainer}>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakNumber}>{eveningStreak} days</Text>
          </View>

          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about your evening routine..."
            value={eveningNotes}
            onChangeText={setEveningNotes}
            multiline
            placeholderTextColor={SKYNKOD_COLORS.muted}
          />

          <TouchableOpacity
            style={[styles.completeBtn, eveningComplete && styles.completeBtnDone]}
            onPress={() => handleMarkComplete('evening')}
            disabled={eveningComplete}
          >
            <Text style={styles.completeBtnText}>
              {eveningComplete ? '✓ Completed Today' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>

          <View style={styles.stepsList}>
            <Text style={styles.stepsTitle}>Suggested Steps:</Text>
            <Text style={styles.step}>1. Remove makeup</Text>
            <Text style={styles.step}>2. Cleanse your face</Text>
            <Text style={styles.step}>3. Apply toner</Text>
            <Text style={styles.step}>4. Apply serum</Text>
            <Text style={styles.step}>5. Apply night cream</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: SKYNKOD_COLORS.border },
  title: { fontSize: 24, fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  subtitle: { fontSize: 12, color: SKYNKOD_COLORS.muted, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  routineCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16 },
  routineCardComplete: { borderWidth: 2, borderColor: '#4CAF50' },
  routineHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  routineEmoji: { fontSize: 32, marginRight: 12 },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 18, fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  routineTime: { fontSize: 12, color: SKYNKOD_COLORS.muted, marginTop: 2 },
  checkmark: { fontSize: 28, color: '#4CAF50', fontWeight: 'bold' },
  streakContainer: { backgroundColor: 'rgba(178, 131, 172, 0.1)', padding: 12, borderRadius: 8, marginBottom: 12 },
  streakLabel: { fontSize: 12, color: SKYNKOD_COLORS.muted },
  streakNumber: { fontSize: 24, fontWeight: 'bold', color: SKYNKOD_COLORS.primary, marginTop: 4 },
  notesInput: { borderWidth: 1, borderColor: SKYNKOD_COLORS.border, borderRadius: 8, padding: 12, marginBottom: 12, height: 80, color: SKYNKOD_COLORS.text },
  completeBtn: { backgroundColor: SKYNKOD_COLORS.primary, padding: 14, borderRadius: 8, marginBottom: 12 },
  completeBtnDone: { backgroundColor: '#4CAF50' },
  completeBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
  stepsList: { borderTopWidth: 1, borderTopColor: SKYNKOD_COLORS.border, paddingTop: 12 },
  stepsTitle: { fontSize: 12, fontWeight: 'bold', color: SKYNKOD_COLORS.text, marginBottom: 8 },
  step: { fontSize: 13, color: SKYNKOD_COLORS.muted, marginBottom: 6, lineHeight: 18 },
})