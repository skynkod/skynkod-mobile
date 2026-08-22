import { BarCodeScanner } from 'expo-barcode-scanner'
import React, { useRef, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'

export default function BarcodeScannerScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null)
  const [scanned, setScanned] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const cameraRef = useRef(null)

  React.useEffect(() => {
    const getPermission = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync()
      setHasPermission(status === 'granted')
    }
    getPermission()
  }, [])

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true)
    Alert.alert('Barcode Scanned', `${data}`, [
      {
        text: 'Add to Products',
        onPress: () => {
          navigation.navigate('Products', { scannedBarcode: data })
          setScanned(false)
        },
      },
      {
        text: 'Scan Again',
        onPress: () => setScanned(false),
      },
    ])
  }

  const toggleTorch = async () => {
    setTorchOn(!torchOn)
    if (cameraRef.current) {
      await cameraRef.current.toggleTorch()
    }
  }

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>
  }
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission denied</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        ref={cameraRef}
      />

      <View style={styles.topBar}>
        <Text style={styles.title}>Scan Product</Text>
        <TouchableOpacity style={styles.torchBtn} onPress={toggleTorch}>
          <Text style={styles.torchText}>{torchOn ? '💡 Off' : '💡 On'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scanBox} />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.6)' },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  torchBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: SKYNKOD_COLORS.primary, borderRadius: 8 },
  torchText: { color: 'white', fontWeight: 'bold' },
  scanBox: { width: 250, height: 250, borderWidth: 2, borderColor: 'white', alignSelf: 'center', marginTop: 120, borderRadius: 12 },
  bottomBar: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  cancelBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: SKYNKOD_COLORS.primary, borderRadius: 8 },
  cancelText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  text: { color: 'white', fontSize: 16, textAlign: 'center', marginTop: 50 },
})