import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { getJournalEntries } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function HomeScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [yesterdayScore, setYesterdayScore] = useState(0)

  useEffect(() => {
    loadHomeData()
  }, [userId])

  const loadHomeData = async () => {
    try {
      const journalEntries = await getJournalEntries(userId)
      setEntries(journalEntries)
      
      if (journalEntries.length > 0) {
        const yesterdayEntry = journalEntries.find(e => {
          const entryDate = new Date(e.date)
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          return entryDate.toDateString() === yesterday.toDateString()
        })
        
        if (yesterdayEntry) {
          const moodScore = yesterdayEntry.mood === 'Great' ? 100 : yesterdayEntry.mood === 'Good' ? 75 : yesterdayEntry.mood === 'Okay' ? 50 : 25
          setYesterdayScore(moodScore)
        }
      }
    } catch (error) {
      console.error('Error loading home data:', error)
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
        <Text style={[styles.title, { color: colors.text }]}>Skynkod</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Your AI Skin Coach</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* YESTERDAY'S SCORE */}
        <View style={[styles.scoreCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.scoreLabel}>{t('home_yesterday_score')}</Text>
          <Text style={styles.scoreNumber}>{yesterdayScore}%</Text>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: `${yesterdayScore}%` }]} />
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.actionEmoji}>📔</Text>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Journal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.actionEmoji}>✨</Text>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Ask Koda</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.actionEmoji}>🔄</Text>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Routine</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.actionEmoji}>📸</Text>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Photos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RECENT ENTRIES */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Entries</Text>
          
          {entries.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No entries yet</Text>
            </View>
          ) : (
            entries.slice(0, 3).map(entry => (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card }]}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryDate, { color: colors.muted }]}>
                    {new Date(entry.date).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.entryMood, { color: colors.primary }]}>{entry.mood}</Text>
                </View>
                {entry.notes && (
                  <Text style={[styles.entryNotes, { color: colors.text }]} numberOfLines={2}>
                    {entry.notes}
                  </Text>
                )}
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
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  scoreCard: { borderRadius: 12, padding: 20, marginBottom: 24 },
  scoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  scoreNumber: { fontSize: 48, fontWeight: 'bold', color: 'white', marginVertical: 8 },
  scoreBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  scoreBarFill: { height: '100%', backgroundColor: 'white' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '48%', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  actionEmoji: { fontSize: 32, marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 14 },
  entryCard: { borderRadius: 12, padding: 12, marginBottom: 12 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  entryDate: { fontSize: 12, fontWeight: '600' },
  entryMood: { fontSize: 12, fontWeight: '600' },
  entryNotes: { fontSize: 12, lineHeight: 16 },
})