import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'
import { deletePhoto, getUserPhotos } from '../utils/supabase'

export default function PhotosScreen({ route }) {
  const { userId } = route.params
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    loadPhotos()
  }, [userId])

  const loadPhotos = async () => {
    try {
      const userPhotos = await getUserPhotos(userId)
      setPhotos(userPhotos)
    } catch (error) {
      console.error('Error loading photos:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        uploadPhoto(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        uploadPhoto(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo')
    }
  }

  const uploadPhoto = async (uri) => {
    setLoading(true)
    try {
      const base64 = await fetch(uri).then(res => res.blob())
      console.log('Photo ready to upload')
      Alert.alert('Success', 'Photo uploaded! (In next version with backend)')
      loadPhotos()
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePhoto = async (photoId) => {
    Alert.alert('Delete Photo', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          const success = await deletePhoto(photoId)
          if (success) {
            setPhotos(photos.filter(p => p.id !== photoId))
            Alert.alert('Success', 'Photo deleted')
          } else {
            Alert.alert('Error', 'Failed to delete photo')
          }
        },
      },
    ])
  }

  if (pageLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={SKYNKOD_COLORS.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skin Progress Photos</Text>
      </View>

      <ScrollView style={styles.content}>
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>Take photos to track your skin progress</Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {photos.map(photo => (
              <View key={photo.id} style={styles.photoCard}>
                <Image source={{ uri: photo.photo_url }} style={styles.photoImage} />
                {photo.notes && <Text style={styles.photoNotes}>{photo.notes}</Text>}
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

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionBtn} onPress={takePhoto} disabled={loading}>
          <Text style={styles.actionBtnEmoji}>📷</Text>
          <Text style={styles.actionBtnText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={pickImage} disabled={loading}>
          <Text style={styles.actionBtnEmoji}>🖼️</Text>
          <Text style={styles.actionBtnText}>Pick Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: SKYNKOD_COLORS.border },
  title: { fontSize: 24, fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  emptySubtext: { fontSize: 14, color: SKYNKOD_COLORS.muted, marginTop: 4 },
  photoGrid: { gap: 12 },
  photoCard: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  photoImage: { width: '100%', height: 300 },
  photoNotes: { padding: 12, color: SKYNKOD_COLORS.muted, fontSize: 12 },
  deleteBtn: { backgroundColor: '#FF6B6B', padding: 8, margin: 12, borderRadius: 6 },
  deleteBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 12 },
  actionButtons: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: SKYNKOD_COLORS.border },
  actionBtn: { flex: 1, backgroundColor: SKYNKOD_COLORS.primary, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  actionBtnEmoji: { fontSize: 24, marginBottom: 4 },
  actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
})