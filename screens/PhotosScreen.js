import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { getUserPhotos, deletePhoto } from '../utils/supabase'
import { supabase } from '../utils/supabase'
import { useFetchWithCache } from '../utils/useFetchWithCache'
import { logError } from '../utils/errorLogger'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import * as FileSystem from 'expo-file-system'

export default function PhotosScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS
  
  const { data: photos, loading, error, isOffline, fetch, retry } = useFetchWithCache(
    'user_photos',
    () => getUserPhotos(userId),
    userId
  )

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  useEffect(() => {
    fetch()
  }, [userId])

  const pickImage = async (useCamera = false) => {
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })

      if (!result.canceled) {
        await uploadPhotoToSupabase(result.assets[0].uri)
      }
    } catch (err) {
      await logError('PhotosScreen_pickImage', err, { userId })
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const uploadPhotoToSupabase = async (uri) => {
    setUploading(true)
    setUploadError(null)
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri)
      if (!fileInfo.exists) {
        throw new Error('File does not exist')
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: 'image/jpeg' })
      const fileName = `${userId}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
        })

      if (uploadError) throw uploadError

      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('photos')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365)

      if (urlError) throw urlError

      const photoUrl = signedUrlData.signedUrl

      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: userId,
          photo_url: photoUrl,
          notes: '',
        })
        .select()

      if (dbError) throw dbError

      fetch() // Refresh list
      Alert.alert('Success', 'Photo uploaded!')
    } catch (err) {
      await logError('PhotosScreen_uploadPhoto', err, { userId })
      setUploadError(err.message || 'Failed to upload photo')
      Alert.alert('Error', err.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId) => {
    Alert.alert('Delete Photo', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const success = await deletePhoto(photoId)
            if (success) {
              fetch() // Refresh list
              Alert.alert('Success', 'Photo deleted')
            }
          } catch (err) {
            await logError('PhotosScreen_deletePhoto', err, { userId })
            Alert.alert('Error', 'Failed to delete photo')
          }
        },
      },
    ])
  }

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
        <Text style={[styles.title, { color: colors.text }]}>Skin Progress Photos</Text>
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

      {uploadError && (
        <View style={[styles.errorBanner, { backgroundColor: '#FF6B6B' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorText}>{uploadError}</Text>
          </View>
          <TouchableOpacity onPress={() => setUploadError(null)} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOffline && !error && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.offlineText}>📡 Offline - Showing cached data</Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {!photos || photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>No photos yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>Take photos to track your skin progress</Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {photos.map(photo => (
              <View key={photo.id} style={[styles.photoCard, { backgroundColor: colors.card }]}>
                <Image source={{ uri: photo.photo_url }} style={styles.photoImage} />
                {photo.notes && <Text style={[styles.photoNotes, { color: colors.muted }]}>{photo.notes}</Text>}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeletePhoto(photo.id)}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.actionButtons, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.6 : 1 }]} 
          onPress={() => pickImage(true)} 
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={styles.actionBtnEmoji}>📷</Text>
              <Text style={styles.actionBtnText}>Take Photo</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.6 : 1 }]} 
          onPress={() => pickImage(false)} 
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={styles.actionBtnEmoji}>🖼️</Text>
              <Text style={styles.actionBtnText}>Pick Photo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  errorBanner: { padding: 12, margin: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorText: { color: 'white', fontSize: 12, fontWeight: '600' },
  retryBtn: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  retryBtnText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  offlineBanner: { padding: 10, margin: 8, borderRadius: 8 },
  offlineText: { color: 'white', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  photoGrid: { gap: 12 },
  photoCard: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  photoImage: { width: '100%', height: 300 },
  photoNotes: { padding: 12, fontSize: 12 },
  deleteBtn: { backgroundColor: '#FF6B6B', padding: 8, margin: 12, borderRadius: 6 },
  deleteBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 12 },
  actionButtons: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  actionBtnEmoji: { fontSize: 24, marginBottom: 4 },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
})
