import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { BarCodeScanner } from 'expo-barcode-scanner'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { logError } from '../utils/errorLogger'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'

export default function BarcodeScannerScreen({ route, navigation }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    requestCameraPermission()
  }, [])

  const requestCameraPermission = async () => {
    try {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === 'granted')
    } catch (error) {
      await logError('BarcodeScannerScreen_requestPermission', error, { userId }, 'error')
      setHasPermission(false)
    } finally {
      setLoading(false)
    }
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    try {
      setScanned(true)
      await logError('BarcodeScannerScreen_barcodeScan', new Error(`Scanned: ${data}`), { userId, data }, 'info')
      
      Alert.alert(
        'Barcode Scanned',
        `Type: ${type}\nValue: ${data}`,
        [
          {
            text: 'Scan Again',
            onPress: () => setScanned(false),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      )
    } catch (error) {
      await logError('BarcodeScannerScreen_handleBarCodeScanned', error, { userId }, 'error')
      setScanned(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <Text style={[styles.text, { color: colors.text }]}>Requesting camera permission...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.bg }]}>
        <Text style={[styles.text, { color: colors.text }]}>Camera permission denied</Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary, marginTop: 20 }]}
          onPress={requestCameraPermission}
        >
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Text style={styles.scanText}>📸 Scan a product barcode</Text>
      </View>

      <TouchableOpacity
        style={[styles.closeBtn, { backgroundColor: colors.primary }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeBtnText}>Close</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, fontWeight: '600' },
  btn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, padding: 16 },
  scanText: { color: 'white', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  closeBtn: { position: 'absolute', bottom: 16, right: 16, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  closeBtnText: { color: 'white', fontWeight: 'bold' },
})
