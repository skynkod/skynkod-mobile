import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MOODS, SKYNKOD_COLORS } from '../utils/constants'
import { getJournalEntries } from '../utils/supabase'

export default function HomeScreen({ route, navigation }) {
  const { userId } = route.params
  const [yesterdayScore, setYesterdayScore] = useState(7.5)
  const [mood, setMood] = useState('great')
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    loadData()
    setFadeIn(true)
  }, [userId])

  const loadData = async () => {
    try {
      const entries = await getJournalEntries(userId)
      if (entries.length > 0) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const yesterdayEntry = entries.find(e => e.date === yesterday)
        if (yesterdayEntry) {
          let score = 8
          if (yesterdayEntry.skin_conditions?.includes('acne')) score -= 1
          if (yesterdayEntry.skin_conditions?.includes('dry')) score -= 1
          setYesterdayScore(score)
          setMood(yesterdayEntry.mood)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          await AsyncStorage.removeItem('skynkod_user')
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        },
      },
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, fadeIn && styles.fadeInHeader]}>
        <Text style={styles.title}>Welcome! 👋</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, fadeIn && styles.fadeInCard, { marginTop: 20 }]}>
        <Text style={styles.label}>Yesterday's Score</Text>
        <Text style={styles.score}>{yesterdayScore}</Text>
      </View>

      <View style={[styles.card, fadeIn && styles.fadeInCard, { marginTop: 10 }]}>
        <Text style={styles.label}>How's your skin today?</Text>
        <View style={styles.moods}>
          {MOODS.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.moodBtn, mood === m && styles.moodBtnActive]}
              onPress={() => setMood(m)}
            >
              <Text style={styles.moodEmoji}>
                {m === 'great' ? '😊' : m === 'okay' ? '😐' : '😔'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.card, styles.kodalCard, fadeIn && styles.fadeInCard, { marginTop: 10 }]}>
        <Text style={styles.kodaText}>
          "Your data is now synced with Supabase! Keep tracking your skin! 🌟"
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SKYNKOD_COLORS.bg,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    opacity: 0,
  },
  fadeInHeader: {
    opacity: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SKYNKOD_COLORS.text,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: SKYNKOD_COLORS.primary,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  card: {
    backgroundColor: SKYNKOD_COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    opacity: 0,
  },
  fadeInCard: {
    opacity: 1,
  },
  label: {
    fontSize: 14,
    color: SKYNKOD_COLORS.muted,
    marginBottom: 8,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: SKYNKOD_COLORS.primary,
  },
  moods: {
    flexDirection: 'row',
    gap: 8,
  },
  moodBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: SKYNKOD_COLORS.primary,
    alignItems: 'center',
  },
  moodBtnActive: {
    backgroundColor: SKYNKOD_COLORS.primary,
  },
  moodEmoji: {
    fontSize: 16,
  },
  kodalCard: {
    backgroundColor: 'rgba(178, 131, 172, 0.1)',
  },
  kodaText: {
    color: SKYNKOD_COLORS.primary,
    fontStyle: 'italic',
    fontSize: 14,
  },
})