import React, { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getJournalStats } from '../utils/supabase'
import { useFetchWithCache } from '../utils/useFetchWithCache'
import { Screen, Card, Banner, LoadingView, SectionHeader, EmptyState, ProgressBar, useColors } from '../components/ui'
import { SPACING, TYPE } from '../utils/theme'

export default function ProgressAnalysisScreen({ route, navigation }) {
  const { userId } = route.params
  const colors = useColors()
  const { data: stats, loading, error, isOffline, fetch, retry } = useFetchWithCache('analysis_stats', () => getJournalStats(userId, 30), userId)

  useEffect(() => {
    fetch()
  }, [fetch])

  if (loading && !stats) return <LoadingView />

  const moods = [
    { mood: 'Great', emoji: '😄', color: colors.success },
    { mood: 'Good', emoji: '🙂', color: colors.primary },
    { mood: 'Okay', emoji: '😐', color: colors.warning },
    { mood: 'Poor', emoji: '😞', color: colors.danger },
  ]
  const total = stats ? Object.values(stats).reduce((sum, n) => sum + (Number(n) || 0), 0) : 0

  return (
    <Screen back title="Analysis" subtitle="Last 30 days">
      {error ? <Banner message={error} actionLabel="Retry" onAction={retry} /> : null}
      {isOffline && !error ? <Banner tone="info" message="Offline — showing saved data" /> : null}

      <Card tone="soft" style={{ marginBottom: SPACING.xl }}>
        <Text style={[TYPE.overline, { color: colors.primary }]}>Journal entries</Text>
        <Text style={[TYPE.display, { color: colors.text, marginTop: 4 }]}>{total}</Text>
      </Card>

      {total === 0 ? (
        <EmptyState icon="stats-chart-outline" title="Not enough data yet" description="Log a few journal entries and your mood breakdown will appear here." action="Open journal" onAction={() => navigation.navigate('Journal')} />
      ) : (
        <>
          <SectionHeader title="Mood breakdown" />
          <Card>
            {moods.map(({ mood, emoji, color }, idx) => {
              const count = Number(stats?.[mood]) || 0
              return (
                <View key={mood} style={[styles.row, idx === moods.length - 1 && { marginBottom: 0 }]}>
                  <Text style={styles.emoji}>{emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowHead}>
                      <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{mood}</Text>
                      <Text style={[TYPE.caption, { color: colors.muted }]}>{count} · {Math.round((count / total) * 100)}%</Text>
                    </View>
                    <ProgressBar value={count / total} color={color} />
                  </View>
                </View>
              )
            })}
          </Card>
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  emoji: { fontSize: 26, width: 34 },
})
