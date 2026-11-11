import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Image, Alert, ActivityIndicator, Dimensions } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { getUserPhotos, deletePhoto, supabase } from '../utils/supabase'
import { useFetchWithCache } from '../utils/useFetchWithCache'
import { logError } from '../utils/errorLogger'
import { Screen, Button, EmptyState, Banner, LoadingView, useColors } from '../components/ui'
import { SPACING, RADIUS } from '../utils/theme'
import { GTYPE, GFW } from '../components/glossy'

const GAP = SPACING.md
const TILE = (Dimensions.get('window').width - SPACING.xl * 2 - GAP) / 2

export default function PhotosScreen({ route }) {
  const { userId } = route.params
  const colors = useColors()
  const { data: photos, loading, error, isOffline, fetch, retry } = useFetchWithCache('user_photos', () => getUserPhotos(userId), userId)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch()
  }, [fetch])

  const pickImage = async (useCamera) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission needed', `Allow ${useCamera ? 'camera' : 'photo library'} access in your settings to add photos.`)
        return
      }

      const options = { mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.8 }
      const result = useCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options)

      if (!result.canceled && result.assets?.length) {
        await upload(result.assets[0].uri)
      }
    } catch (err) {
      await logError('PhotosScreen_pickImage', err, { userId, useCamera })
      Alert.alert('Error', err.message || 'Failed to pick image')
    }
  }

  const upload = async (uri) => {
    setUploading(true)
    try {
      // expo-file-system's legacy read APIs are gone in SDK 57; fetch reads local URIs directly.
      const body = await (await globalThis.fetch(uri)).arrayBuffer()
      const fileName = `${userId}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, body, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      const { data: signed, error: urlError } = await supabase.storage.from('photos').createSignedUrl(fileName, 60 * 60 * 24 * 365)
      if (urlError) throw urlError
      if (!signed?.signedUrl) throw new Error('Failed to get signed URL')

      const { error: dbError } = await supabase.from('photos').insert({ user_id: userId, photo_url: signed.signedUrl, notes: '' })
      if (dbError) throw dbError

      await fetch()
    } catch (err) {
      await logError('PhotosScreen_upload', err, { userId })
      Alert.alert('Upload failed', err.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (photoId) => {
    Alert.alert('Delete photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const ok = await deletePhoto(photoId)
          if (ok) fetch()
          else Alert.alert('Error', 'Failed to delete photo')
        },
      },
    ])
  }

  if (loading && !photos) return <LoadingView />

  const list = Array.isArray(photos) ? photos.filter(p => p?.id && p.photo_url) : []

  return (
    <Screen
      back
      title="Photos"
      subtitle="Same light, same angle, every week"
      footer={
        <View style={styles.actions}>
          <Button title="Take photo" icon="camera-outline" onPress={() => pickImage(true)} disabled={uploading} style={{ flex: 1 }} />
          <Button title="Library" icon="images-outline" variant="secondary" onPress={() => pickImage(false)} disabled={uploading} style={{ flex: 1 }} />
        </View>
      }
    >
      {error ? <Banner message={error} actionLabel="Retry" onAction={retry} /> : null}
      {isOffline && !error ? <Banner tone="info" message="Offline — showing saved photos" /> : null}
      {uploading ? (
        <View style={[styles.uploading, { backgroundColor: colors.primarySoft }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[GTYPE.caption, { color: colors.primary, ...GFW('700') }]}>Uploading…</Text>
        </View>
      ) : null}

      {list.length === 0 ? (
        <EmptyState icon="camera-outline" koda="curious" title="No photos yet" description="Progress photos make small changes visible. Take your first one today." />
      ) : (
        <View style={styles.grid}>
          {list.map(photo => (
            <Pressable key={photo.id} onLongPress={() => handleDelete(photo.id)} style={[styles.tile, { backgroundColor: colors.surface }]}>
              <Image
                source={{ uri: photo.photo_url }}
                style={styles.image}
                onError={e => logError('PhotosScreen_imageLoad', e?.nativeEvent || e, { photoId: photo.id })}
              />
              <View style={styles.dateTag}>
                <Text style={styles.dateText}>
                  {photo.created_at ? new Date(photo.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(photo.id)} hitSlop={8} style={styles.deleteBtn} accessibilityLabel="Delete photo">
                <Ionicons name="trash-outline" size={16} color="#fff" />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: SPACING.md },
  uploading: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: { width: TILE, height: TILE * 1.3, borderRadius: RADIUS.lg, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  dateTag: { position: 'absolute', left: 8, bottom: 8, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dateText: { color: '#fff', fontSize: 11, ...GFW('700') },
  deleteBtn: { position: 'absolute', right: 8, top: 8, backgroundColor: 'rgba(0,0,0,0.45)', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
})
