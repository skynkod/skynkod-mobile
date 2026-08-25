import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { getJournalStats } from '../utils/supabase'
import { useFetchWithCache } from '../utils/useFetchWithCache'
import { logError } from '../utils/errorLogger'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'

export default function ProgressAnalysisScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const { data: stats, loading, error, isOffline, fetch, retry } = useFetchWithCache(
    'analysis_stats',
    () => getJournalStats(userId, 30),
    userId
  )

  const [totalEntries, setTotalEntries] = useState(0)

  useEffect(() => {
    fetch()
  }, [userId])

  useEffect(() => {
    if (stats) {
      const total = Object.values(stats).reduce((sum, count) => sum + count, 0)
      setTotalEntries(total)
    }
  }, [stats])

  if (loading && !stats) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Skin Analysis</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Last 30 days</Text>
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: '#FF6B6B' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <TouchableOpacity onPress={retry} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOffline && !error && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.offlineText}>📡 Offline - Showing cached data</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsLabel, { color: colors.text }]}>Total Journal Entries</Text>
          <Text style={[styles.statsValue, { color: colors.primary }]}>{totalEntries}</Text>
        </View>

        {stats && (
          <>
            <Text style={[styles.moodTitle, { color: colors.text }]}>Mood Breakdown</Text>
            
            {[
              { mood: 'Great', emoji: '😄', color: '#4CAF50' },
              { mood: 'Good', emoji: '🙂', color: '#8BC34A' },
              { mood: 'Okay', emoji: '😐', color: '#FFC107' },
              { mood: 'Poor', emoji: '😞', color: '#FF5722' },
            ].map(({ mood, emoji, color }) => (
              <View key={mood} style={[styles.moodBar, { backgroundColor: colors.card }]}>
                <Text style={styles.moodEmoji}>{emoji}</Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${(stats[mood] / Math.max(totalEntries, 1)) * 100}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.moodCount, { color: colors.text }]}>
                  {stats[mood]}
                </Text>
              </View>
            ))}
          </>
        )}
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
  statsCard: { borderRadius: 12, padding: 16, marginBottom: 24 },
  statsLabel: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  statsValue: { fontSize: 32, fontWeight: 'bold' },
  moodTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  moodBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8, gap: 12 },
  moodEmoji: { fontSize: 24, width: 30 },
  barContainer: { flex: 1, height: 20, backgroundColor: '#E0E0E0', borderRadius: 10, overflow: 'hidden' },
  bar: { height: '100%' },
  moodCount: { fontWeight: '600', fontSize: 14, width: 30, textAlign: 'right' },
})
