import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'
import { getJournalEntries } from '../utils/supabase'

export default function ProgressScreen({ route }) {
  const { userId } = route.params
  const [entries, setEntries] = useState([])
  const [avgScore, setAvgScore] = useState(0)
  const [bestDay, setBestDay] = useState(null)

  useEffect(() => {
    loadProgress()
  }, [userId])

  const loadProgress = async () => {
    try {
      const data = await getJournalEntries(userId)
      setEntries(data)

      if (data.length > 0) {
        const scores = data.map(e => {
          let score = 8
          if (e.skin_conditions?.includes('acne')) score -= 1
          if (e.skin_conditions?.includes('dry')) score -= 1
          if (e.mood === 'bad') score -= 2
          if (e.mood === 'great') score += 1
          return score
        })

        const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        setAvgScore(avg)

        const maxScore = Math.max(...scores)
        const bestEntry = data[scores.indexOf(maxScore)]
        setBestDay(bestEntry)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const last7Days = entries.slice(0, 7)

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Average Score</Text>
        <Text style={styles.bigNumber}>{avgScore}</Text>
        <Text style={styles.subtitle}>Last {entries.length} days</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Best Day</Text>
        {bestDay ? (
          <>
            <Text style={styles.date}>{bestDay.date}</Text>
            <Text style={styles.conditions}>{bestDay.skin_conditions.join(', ')}</Text>
          </>
        ) : (
          <Text style={styles.subtitle}>No data yet</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Last 7 Days</Text>
        {last7Days.length > 0 ? (
          <View style={styles.chart}>
            {last7Days.map((entry, idx) => {
              let score = 8
              if (entry.skin_conditions?.includes('acne')) score -= 1
              if (entry.skin_conditions?.includes('dry')) score -= 1
              if (entry.mood === 'bad') score -= 2
              if (entry.mood === 'great') score += 1
              const height = (score / 10) * 100
              return (
                <View key={idx} style={styles.barContainer}>
                  <View style={[styles.bar, { height: `${height}%` }]} />
                  <Text style={styles.barLabel}>{entry.date.split('-')[2]}</Text>
                </View>
              )
            })}
          </View>
        ) : (
          <Text style={styles.subtitle}>Start journaling to see progress!</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Stats</Text>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Total Entries</Text>
          <Text style={styles.statValue}>{entries.length}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Consistency</Text>
          <Text style={styles.statValue}>{entries.length > 0 ? '📈' : 'Start now!'}</Text>
        </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: SKYNKOD_COLORS.text,
  },
  card: {
    backgroundColor: SKYNKOD_COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: SKYNKOD_COLORS.muted,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: SKYNKOD_COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: SKYNKOD_COLORS.muted,
    marginTop: 4,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: SKYNKOD_COLORS.text,
  },
  conditions: {
    fontSize: 12,
    color: SKYNKOD_COLORS.muted,
    marginTop: 4,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: '80%',
    backgroundColor: SKYNKOD_COLORS.primary,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: SKYNKOD_COLORS.muted,
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: SKYNKOD_COLORS.border,
  },
  statLabel: {
    color: SKYNKOD_COLORS.muted,
    fontSize: 14,
  },
  statValue: {
    fontWeight: 'bold',
    color: SKYNKOD_COLORS.text,
    fontSize: 14,
  },
})