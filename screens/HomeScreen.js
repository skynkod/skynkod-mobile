import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { getJournalEntries } from '../utils/supabase'
import { useFetchWithCache } from '../utils/useFetchWithCache'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'

export default function HomeScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const { data: entries, loading, error, isOffline, fetch, retry } = useFetchWithCache(
    'journal_entries',
    () => getJournalEntries(userId),
    userId
  )

  useEffect(() => {
    fetch()
  }, [userId])

  if (loading && !entries) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Home</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Your skin journey</Text>
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

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetch} tintColor={colors.primary} />
        }
      >
        {!entries || entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👋</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Welcome to Skynkod!</Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              Start by logging your first journal entry to begin tracking your skin
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statsTitle, { color: colors.text }]}>Recent Activity</Text>
              <Text style={[styles.statsValue, { color: colors.primary }]}>
                {entries.length} entries
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Entries</Text>
            {entries.slice(0, 5).map(entry => (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card }]}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryDate, { color: colors.muted }]}>
                    {new Date(entry.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.entryMood, { color: colors.primary, fontWeight: 'bold' }]}>
                    {entry.mood}
                  </Text>
                </View>
                {entry.notes && (
                  <Text style={[styles.entryNotes, { color: colors.text }]} numberOfLines={2}>
                    {entry.notes}
                  </Text>
                )}
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
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 4 },
  errorBanner: { 
    padding: 12, 
    margin: 8, 
    borderRadius: 8, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  errorText: { color: 'white', fontSize: 12, fontWeight: '600' },
  retryBtn: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  retryBtnText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  offlineBanner: { padding: 10, margin: 8, borderRadius: 8 },
  offlineText: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  statsCard: { borderRadius: 12, padding: 16, marginBottom: 24 },
  statsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  statsValue: { fontSize: 28, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  entryCard: { borderRadius: 12, padding: 12, marginBottom: 8 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  entryDate: { fontSize: 12 },
  entryMood: { fontSize: 12 },
  entryNotes: { fontSize: 13, lineHeight: 18 },
})
