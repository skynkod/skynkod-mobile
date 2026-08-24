import * as FileSystem from 'expo-file-system'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { deletePhoto, getUserPhotos } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function PhotosScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS
  
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null)

  useEffect(() => {
    loadPhotos()
  }, [userId])

  const loadPhotos = async () => {
    try {
      const userPhotos = await getUserPhotos(userId)
      setPhotos(userPhotos)
    } catch (error) {
      console.error('Error loading photos:', error)
      Alert.alert('Error', 'Failed to load photos')
    } finally {
      setPageLoading(false)
    }
  }

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
        await uploadPhoto(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const uploadPhoto = async (uri) => {
    setLoading(true)
    const photoId = Date.now()
    setUploadingPhotoId(photoId)
    
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Upload to Supabase Storage
      const fileName = `${userId}/${photoId}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, decode(base64), {
          contentType: 'image/jpeg',
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage.from('photos').getPublicUrl(fileName)
      const photoUrl = data.publicUrl

      // Save to database
      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: userId,
          photo_url: photoUrl,
          notes: '',
        })
        .select()

      if (dbError) throw dbError

      setPhotos([photoData[0], ...photos])
      Alert.alert('Success', 'Photo uploaded!')
    } catch (error) {
      console.error('Upload error:', error)
      Alert.alert('Error', 'Failed to upload photo')
    } finally {
      setLoading(false)
      setUploadingPhotoId(null)
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
              setPhotos(photos.filter(p => p.id !== photoId))
              Alert.alert('Success', 'Photo deleted')
            } else {
              Alert.alert('Error', 'Failed to delete photo')
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to delete photo')
          }
        },
      },
    ])
  }

  if (pageLoading) {
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

      <ScrollView style={styles.content}>
        {photos.length === 0 ? (
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
          style={[styles.actionBtn, { backgroundColor: colors.primary }]} 
          onPress={() => pickImage(true)} 
          disabled={loading}
        >
          {uploadingPhotoId && loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={styles.actionBtnEmoji}>📷</Text>
              <Text style={styles.actionBtnText}>Take Photo</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: colors.primary }]} 
          onPress={() => pickImage(false)} 
          disabled={loading}
        >
          {uploadingPhotoId && loading ? (
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

// Helper to decode base64
function decode(base64String) {
  const binaryString = atob(base64String)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

// Import supabase for storage
import { supabase } from '../utils/supabase'

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
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