import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { getUserPhotos } from '../utils/supabase'
import { useFetchWithCache } from '../utils/useFetchWithCache'
import { logError } from '../utils/errorLogger'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'

export default function ProgressScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const { data: photos, loading, error, isOffline, fetch, retry } = useFetchWithCache(
    'progress_photos',
    () => getUserPhotos(userId),
    userId
  )

  useEffect(() => {
    fetch()
  }, [userId])

  if (loading && !photos) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>See your skin improvements</Text>
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
          <Text style={[styles.statsLabel, { color: colors.text }]}>Total Photos</Text>
          <Text style={[styles.statsValue, { color: colors.primary }]}>
            {photos ? photos.length : 0}
          </Text>
        </View>

        {!photos || photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No photos yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              Start taking progress photos to track your skin improvements
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Progress Timeline</Text>
            {photos.map((photo, idx) => (
              <View key={photo.id} style={[styles.photoItem, { backgroundColor: colors.card }]}>
                <Text style={styles.photoNumber}>Photo {idx + 1}</Text>
                <Text style={[styles.photoDate, { color: colors.muted }]}>
                  {new Date(photo.created_at).toLocaleDateString()}
                </Text>
                {photo.notes && (
                  <Text style={[styles.photoNotes, { color: colors.text }]}>
                    {photo.notes}
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
  statsValue: { fontSize: 28, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  photoItem: { borderRadius: 12, padding: 16, marginBottom: 12 },
  photoNumber: { fontWeight: 'bold', fontSize: 14 },
  photoDate: { fontSize: 12, marginTop: 4 },
  photoNotes: { fontSize: 13, marginTop: 8, lineHeight: 18 },
})
