import { BarCodeScanner } from 'expo-barcode-scanner'
import React, { useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function BarcodeScannerScreen() {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [scanned, setScanned] = useState(false)
  const [hasPermission, setHasPermission] = useState(null)
  const [torchOn, setTorchOn] = useState(false)

  React.useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true)
    Alert.alert(
      'Barcode Scanned',
      `Type: ${type}\nData: ${data}`,
      [
        { text: 'Scan Again', onPress: () => setScanned(false) },
        {
          text: 'Use This',
          onPress: () => {
            Alert.alert('Success', 'Product barcode saved!')
            setScanned(false)
          },
        },
      ]
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
        <Text style={[styles.text, { color: colors.text }]}>Camera access denied</Text>
        <Text style={[styles.subtext, { color: colors.muted }]}>Please enable camera in settings</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Barcode Scanner</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Scan product barcodes</Text>
      </View>

      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
          torchMode={torchOn ? 'on' : 'off'}
        />
        
        <View style={styles.overlay}>
          <View style={[styles.scanFrame, { borderColor: colors.primary }]} />
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.torchBtn, { backgroundColor: torchOn ? colors.primary : colors.border }]}
          onPress={() => setTorchOn(!torchOn)}
        >
          <Text style={styles.torchBtnText}>💡 {torchOn ? 'Torch On' : 'Torch Off'}</Text>
        </TouchableOpacity>

        {scanned && (
          <TouchableOpacity
            style={[styles.scanAgainBtn, { backgroundColor: colors.primary }]}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.scanAgainBtnText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 4 },
  scannerContainer: { flex: 1, position: 'relative' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderRadius: 12 },
  text: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  subtext: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1 },
  torchBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  torchBtnText: { fontWeight: 'bold', fontSize: 14, color: 'white' },
  scanAgainBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  scanAgainBtnText: { fontWeight: 'bold', fontSize: 14, color: 'white' },
})