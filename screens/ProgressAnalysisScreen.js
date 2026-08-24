import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { getJournalEntries, getUserPhotos } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function ProgressAnalysisScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [photos, setPhotos] = useState([])
  const [journal, setJournal] = useState([])
  const [loading, setLoading] = useState(true)
  const [improvement, setImprovement] = useState(0)

  useEffect(() => {
    loadProgressData()
  }, [userId])

  const loadProgressData = async () => {
    try {
      const userPhotos = await getUserPhotos(userId)
      const entries = await getJournalEntries(userId)
      
      setPhotos(userPhotos)
      setJournal(entries)
      
      if (entries.length > 0) {
        const recentMoods = entries.slice(0, 7).map(e => e.mood)
        const moodScore = recentMoods.filter(m => m === 'Great' || m === 'Good').length / Math.max(recentMoods.length, 1)
        setImprovement(Math.round(moodScore * 100))
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load progress data')
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
        <Text style={[styles.title, { color: colors.text }]}>{t('analysis_title')}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Your journey to better skin</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* IMPROVEMENT SCORE */}
        <View style={[styles.scoreCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.scoreLabel}>{t('analysis_improvement')}</Text>
          <Text style={styles.scoreNumber}>{improvement}%</Text>
          <View style={styles.scoreBar}>
            <View style={[styles.scoreBarFill, { width: `${improvement}%` }]} />
          </View>
          <Text style={styles.scoreDesc}>Based on your mood & skin conditions</Text>
        </View>

        {/* PHOTO TIMELINE */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('analysis_photos')} ({photos.length})</Text>
          
          {photos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.text }]}>No photos yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.muted }]}>Take photos to track your progress!</Text>
            </View>
          ) : (
            photos.map((photo, idx) => (
              <View key={photo.id} style={styles.photoTimeline}>
                <View style={styles.timelineMarker}>
                  <View style={[styles.markerDot, idx === 0 && { backgroundColor: colors.primary }]} />
                </View>
                <View style={styles.photoContent}>
                  <Image source={{ uri: photo.photo_url }} style={styles.timelinePhoto} />
                  <Text style={[styles.photoDate, { color: colors.muted }]}>
                    {new Date(photo.uploaded_at).toLocaleDateString()}
                  </Text>
                  {photo.notes && <Text style={[styles.photoNotes, { color: colors.text }]}>{photo.notes}</Text>}
                </View>
              </View>
            ))
          )}
        </View>

        {/* STATS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={styles.statEmoji}>📝</Text>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{journal.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Journal Entries</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={styles.statEmoji}>📸</Text>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{photos.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Photos</Text>
            </View>
          </View>
        </View>

        {/* MOOD TREND */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mood Trend (Last 7 Days)</Text>
          
          <View style={[styles.moodTrend, { backgroundColor: colors.card }]}>
            {journal.slice(0, 7).map((entry, idx) => (
              <View key={idx} style={styles.moodBar}>
                <View style={[
                  styles.moodBarFill,
                  entry.mood === 'Great' && { backgroundColor: '#4CAF50', height: '100%' },
                  entry.mood === 'Good' && { backgroundColor: '#8BC34A', height: '75%' },
                  entry.mood === 'Okay' && { backgroundColor: '#FFC107', height: '50%' },
                  entry.mood === 'Poor' && { backgroundColor: '#FF9800', height: '25%' },
                ]} />
                <Text style={[styles.moodDate, { color: colors.muted }]}>
                  {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* INSIGHTS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Insights</Text>
          
          {journal.length > 0 && (
            <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>🎯 Keep It Up!</Text>
              <Text style={[styles.insightText, { color: colors.muted }]}>
                You've logged {journal.length} journal entries. Consistency is key to seeing results!
              </Text>
            </View>
          )}

          {photos.length >= 2 && (
            <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>📸 Visual Progress</Text>
              <Text style={[styles.insightText, { color: colors.muted }]}>
                You have {photos.length} photos documenting your journey. Compare your first and latest photos!
              </Text>
            </View>
          )}

          {improvement >= 75 && (
            <View style={[styles.insightCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.insightTitle, { color: colors.text }]}>✨ Excellent Progress!</Text>
              <Text style={[styles.insightText, { color: colors.muted }]}>
                Your skin has shown significant improvement! Keep following your routine.
              </Text>
            </View>
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
  content: { flex: 1, padding: 16 },
  scoreCard: { borderRadius: 12, padding: 20, marginBottom: 24 },
  scoreLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  scoreNumber: { fontSize: 48, fontWeight: 'bold', color: 'white', marginVertical: 8 },
  scoreBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  scoreBarFill: { height: '100%', backgroundColor: 'white' },
  scoreDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  emptyDesc: { fontSize: 12, marginTop: 4 },
  photoTimeline: { flexDirection: 'row', marginBottom: 16 },
  timelineMarker: { width: 40, alignItems: 'center', paddingTop: 8 },
  markerDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#ccc' },
  photoContent: { flex: 1, marginLeft: 12 },
  timelinePhoto: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8 },
  photoDate: { fontSize: 12, fontWeight: '600' },
  photoNotes: { fontSize: 12, marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  moodTrend: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8, borderRadius: 12, padding: 12 },
  moodBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  moodBarFill: { width: '100%', borderRadius: 4, marginBottom: 8 },
  moodDate: { fontSize: 10 },
  insightCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  insightTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  insightText: { fontSize: 13, lineHeight: 18 },
})