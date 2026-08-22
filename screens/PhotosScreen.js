import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'

export default function PhotosScreen() {
  const [photos, setPhotos] = useState([])

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        const newPhoto = {
          id: Date.now(),
          uri: result.assets[0].uri,
          date: new Date().toISOString().split('T')[0],
        }
        setPhotos([newPhoto, ...photos])
        Alert.alert('Success', 'Photo saved!')
      }
    } catch (error) {
      Alert.alert('Error', error.message)
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
        const newPhoto = {
          id: Date.now(),
          uri: result.assets[0].uri,
          date: new Date().toISOString().split('T')[0],
        }
        setPhotos([newPhoto, ...photos])
        Alert.alert('Success', 'Photo taken!')
      }
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  const deletePhoto = (id) => {
    setPhotos(photos.filter(p => p.id !== id))
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Skin Photos</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.btn} onPress={takePhoto}>
          <Text style={styles.btnText}>📷 Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={pickImage}>
          <Text style={styles.btnText}>🖼️ Gallery</Text>
        </TouchableOpacity>
      </View>

      {photos.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyText}>Track your skin progress with photos!</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Photo Gallery</Text>
          {photos.map(photo => (
            <View key={photo.id} style={styles.photoCard}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <View style={styles.photoInfo}>
                <Text style={styles.photoDate}>{photo.date}</Text>
                <TouchableOpacity onPress={() => deletePhoto(photo.id)}>
                  <Text style={styles.deleteBtn}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg, padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: SKYNKOD_COLORS.text },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  btn: { flex: 1, backgroundColor: SKYNKOD_COLORS.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  emptyCard: { backgroundColor: 'white', borderRadius: 12, padding: 40, alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: SKYNKOD_COLORS.text, marginBottom: 8 },
  emptyText: { color: SKYNKOD_COLORS.muted, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: SKYNKOD_COLORS.text },
  photoCard: { backgroundColor: 'white', borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  photo: { width: '100%', height: 250, borderRadius: 12 },
  photoInfo: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoDate: { fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  deleteBtn: { color: '#D84040', fontWeight: 'bold' },
})