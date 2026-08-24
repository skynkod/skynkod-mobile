import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { getJournalEntries } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function ProgressScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekData, setWeekData] = useState([])
  const [avgScore, setAvgScore] = useState(0)

  useEffect(() => {
    loadProgressData()
  }, [userId])

  const loadProgressData = async () => {
    try {
      const data = await getJournalEntries(userId)
      setEntries(data)
      
      // Get last 7 days
      const last7 = data.slice(0, 7)
      setWeekData(last7)
      
      // Calculate average score
      if (last7.length > 0) {
        const scores = last7.map(e => {
          switch(e.mood) {
            case 'Great': return 100
            case 'Good': return 75
            case 'Okay': return 50
            case 'Poor': return 25
            default: return 0
          }
        })
        const avg = Math.round(scores.reduce((a, b) => a + b) / scores.length)
        setAvgScore(avg)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
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
        <Text style={[styles.title, { color: colors.text }]}>{t('progress_title')}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{t('progress_7day')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* AVERAGE SCORE */}
        <View style={[styles.scoreCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.scoreLabel}>{t('progress_avg_score')}</Text>
          <Text style={styles.scoreNumber}>{avgScore}%</Text>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: `${avgScore}%` }]} />
          </View>
        </View>

        {/* CHART */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mood Trend</Text>
          <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
            <View style={styles.chart}>
              {weekData.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.muted }]}>No data for this week</Text>
              ) : (
                <View style={styles.barsContainer}>
                  {weekData.map((entry, idx) => {
                    const moodValue = entry.mood === 'Great' ? 4 : entry.mood === 'Good' ? 3 : entry.mood === 'Okay' ? 2 : 1
                    return (
                      <View key={idx} style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${moodValue * 25}%`,
                              backgroundColor: colors.primary,
                            },
                          ]}
                        />
                        <Text style={[styles.barLabel, { color: colors.muted }]}>
                          {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* STATISTICS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={styles.statEmoji}>📝</Text>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{entries.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Total Entries</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{weekData.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>This Week</Text>
            </View>
          </View>
        </View>

        {/* RECENT ENTRIES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          
          {entries.slice(0, 5).map(entry => (
            <View key={entry.id} style={[styles.activityCard, { backgroundColor: colors.card }]}>
              <View style={styles.activityHeader}>
                <Text style={[styles.activityDate, { color: colors.muted }]}>
                  {new Date(entry.date).toLocaleDateString()}
                </Text>
                <Text style={[styles.activityMood, { color: colors.primary }]}>{entry.mood}</Text>
              </View>
              {entry.notes && (
                <Text style={[styles.activityNotes, { color: colors.text }]} numberOfLines={2}>
                  {entry.notes}
                </Text>
              )}
            </View>
          ))}
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
  scoreCard: { borderRadius: 12, padding: 20, marginBottom: 24 },
  scoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  scoreNumber: { fontSize: 48, fontWeight: 'bold', color: 'white', marginVertical: 8 },
  scoreBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  scoreBarFill: { height: '100%', backgroundColor: 'white' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  chartContainer: { borderRadius: 12, padding: 16 },
  chart: { height: 200, justifyContent: 'flex-end' },
  emptyText: { textAlign: 'center' },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 150 },
  barWrapper: { alignItems: 'center', flex: 1 },
  bar: { width: '70%', borderRadius: 4, marginBottom: 8 },
  barLabel: { fontSize: 10, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  activityCard: { borderRadius: 12, padding: 12, marginBottom: 12 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  activityDate: { fontSize: 12, fontWeight: '600' },
  activityMood: { fontSize: 12, fontWeight: '600' },
  activityNotes: { fontSize: 12, lineHeight: 16 },
})