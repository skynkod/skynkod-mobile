import React, { useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useIsFocused } from '@react-navigation/native'
import { Screen, Button, EmptyState, useColors } from '../components/ui'
import { useT } from '../utils/LanguageContext'
import { lookupBarcode } from '../utils/catalog'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// Full-screen camera that reads a product barcode and opens its page.
export default function BarcodeScannerScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const insets = useSafeAreaInsets()
  const isFocused = useIsFocused()
  const [permission, requestPermission] = useCameraPermissions()
  const [status, setStatus] = useState('scanning') // scanning | looking | notFound | error
  const busy = useRef(false)
  const [unknown, setUnknown] = useState(null) // { barcode, brandHint }

  const onScanned = async ({ data }) => {
    if (busy.current) return
    busy.current = true
    setStatus('looking')
    const result = await lookupBarcode(data)
    if (result.product) {
      setStatus('scanning')
      busy.current = false
      // Opened from the routine builder: the product goes straight into the step.
      const pickFor = route?.params?.pickFor
      if (pickFor) {
        navigation.setParams({ pickFor: undefined })
        navigation.navigate({ name: 'RoutineBuilder', params: { picked: { ...pickFor, product: result.product } }, merge: true })
      } else {
        navigation.navigate('Product', { id: result.product.id, product: result.product })
      }
      return
    }
    if (result.notFound) setUnknown({ barcode: data, brandHint: result.brandHint })
    setStatus(result.notFound ? 'notFound' : 'error')
  }

  const scanAgain = () => {
    busy.current = false
    setStatus('scanning')
  }

  if (!permission) return <Screen back />
  if (!permission.granted) {
    return (
      <Screen back>
        <EmptyState
          icon="camera-outline"
          title={t('Allow the camera')}
          description={t('Skynkod needs your camera to read product barcodes.')}
          action={t('Allow camera')}
          onAction={requestPermission}
        />
      </Screen>
    )
  }

  return (
    <View style={styles.flex}>
      {isFocused ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={status === 'scanning' ? onScanned : undefined}
        />
      ) : null}

      <View style={[styles.top, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.round} accessibilityLabel={t('Back')}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>{t('Scan Product')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>{t('Align the barcode in the frame')}</Text>
      </View>

      {status !== 'scanning' ? (
        <View style={[styles.sheet, { backgroundColor: colors.bg, paddingBottom: insets.bottom + SPACING.lg }]}>
          {status === 'looking' ? (
            <View style={styles.sheetRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Looking up this product…')}</Text>
            </View>
          ) : (
            <>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>
                {status === 'notFound' ? t("We don't know this product yet") : t("Couldn't look up this product")}
              </Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                {status === 'notFound'
                  ? unknown?.brandHint
                    ? t('It looks like a {brand} product. Find it in our list and the scanner will recognise it next time.', { brand: unknown.brandHint })
                    : t('Find it in our list and the scanner will recognise it next time.')
                  : t('Check your connection and try again.')}
              </Text>
              {status === 'notFound' ? (
                <Button
                  title={t('Find it in our list')}
                  icon="search"
                  onPress={() => {
                    scanAgain()
                    navigation.navigate('Search', { linkBarcode: unknown.barcode, query: unknown.brandHint || '' })
                  }}
                  style={{ marginTop: SPACING.lg }}
                />
              ) : null}
              <Button title={t('Scan again')} variant="secondary" onPress={scanAgain} style={{ marginTop: SPACING.sm }} />
            </>
          )}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000000' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: '72%', height: 170, borderRadius: RADIUS.lg, borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)' },
  hint: { color: '#FFFFFF', marginTop: SPACING.lg, fontSize: 14, fontWeight: '500' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
})
