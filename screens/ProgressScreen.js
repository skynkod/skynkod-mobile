import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { getUserPhotos } from '../utils/supabase'
import { useFetchWithCache } from '../utils/useFetchWithCache'
import { Screen, Card, Button, EmptyState, Banner, LoadingView, SectionHeader, useColors } from '../components/ui'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

export default function ProgressScreen({ route, navigation }) {
  const { userId } = route.params
  const colors = useColors()
  const { data: photos, loading, error, isOffline, fetch, retry } = useFetchWithCache('progress_photos', () => getUserPhotos(userId), userId)

  useEffect(() => {
    fetch()
  }, [fetch])

  if (loading && !photos) return <LoadingView />

  const list = Array.isArray(photos) ? photos.filter(p => p?.id) : []
  const first = list[list.length - 1]
  const latest = list[0]
  const days = first && latest ? Math.max(0, Math.round((new Date(latest.created_at) - new Date(first.created_at)) / 86400000)) : 0

  return (
    <Screen back title="Progress" subtitle="Your skin journey over time">
      {error ? <Banner message={error} actionLabel="Retry" onAction={retry} /> : null}
      {isOffline && !error ? <Banner tone="info" message="Offline — showing saved data" /> : null}

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={[TYPE.title, { color: colors.primary }]}>{list.length}</Text>
          <Text style={[TYPE.caption, { color: colors.muted }]}>Photos</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={[TYPE.title, { color: colors.primary }]}>{days}</Text>
          <Text style={[TYPE.caption, { color: colors.muted }]}>Days tracked</Text>
        </Card>
      </View>

      {list.length === 0 ? (
        <EmptyState icon="trending-up-outline" title="No photos yet" description="Take progress photos to see your skin change over time." action="Add a photo" onAction={() => navigation.navigate('Photos')} />
      ) : (
        <>
          {list.length > 1 && first?.photo_url && latest?.photo_url ? (
            <>
              <SectionHeader title="Before / after" />
              <View style={styles.compare}>
                {[{ p: first, label: 'First' }, { p: latest, label: 'Latest' }].map(({ p, label }) => (
                  <View key={label} style={{ flex: 1 }}>
                    <Image source={{ uri: p.photo_url }} style={[styles.compareImg, { backgroundColor: colors.surface }]} />
                    <Text style={[TYPE.caption, { color: colors.muted, marginTop: 6, textAlign: 'center' }]}>
                      {label} · {new Date(p.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <SectionHeader title="Timeline" style={{ marginTop: SPACING.xl }} />
          {list.map((photo, idx) => (
            <View key={photo.id} style={styles.timelineRow}>
              <View style={styles.dotCol}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                {idx < list.length - 1 ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
              </View>
              <Card style={{ flex: 1, marginBottom: SPACING.md }}>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]}>Photo {list.length - idx}</Text>
                <Text style={[TYPE.caption, { color: colors.muted }]}>
                  {photo.created_at ? new Date(photo.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown date'}
                </Text>
                {photo.notes ? <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.sm }]}>{photo.notes}</Text> : null}
              </Card>
            </View>
          ))}
          <Button title="Add a photo" icon="camera-outline" variant="secondary" onPress={() => navigation.navigate('Photos')} style={{ marginTop: SPACING.sm }} />
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl },
  stat: { flex: 1, alignItems: 'center' },
  compare: { flexDirection: 'row', gap: SPACING.md },
  compareImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: RADIUS.lg },
  timelineRow: { flexDirection: 'row', gap: SPACING.md },
  dotCol: { width: 14, alignItems: 'center', paddingTop: SPACING.lg },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, marginTop: 4 },
})
