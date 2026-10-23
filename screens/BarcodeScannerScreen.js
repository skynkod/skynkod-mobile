import React, { useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image, Alert } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useIsFocused } from '@react-navigation/native'
import { Screen, Button, EmptyState, useColors } from '../components/ui'
import { useT } from '../utils/LanguageContext'
import { lookupBarcode } from '../utils/catalog'
import { useAuth } from '../utils/AuthContext'
import { proposeProduct, takeProductPhoto, addProposalPhotos } from '../utils/contributions'
import { logError } from '../utils/errorLogger'
import { requestProduct } from '../utils/community-data'
import { track } from '../utils/analytics'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// Full-screen camera that reads a product barcode and opens its page.
export default function BarcodeScannerScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const insets = useSafeAreaInsets()
  const isFocused = useIsFocused()
  const [permission, requestPermission] = useCameraPermissions()
  const { user } = useAuth()
  const [status, setStatus] = useState('scanning') // scanning | looking | notFound | error | propose | thanks
  const busy = useRef(false)
  const [unknown, setUnknown] = useState(null) // { barcode, brandHint, suggestion }
  // Her proposal for an unknown product: the barcode, and optional photos.
  const [photos, setPhotos] = useState({ front: null, back: null })
  const [sending, setSending] = useState(false)

  const onScanned = async ({ data }) => {
    if (busy.current) return
    busy.current = true
    setStatus('looking')
    const result = await lookupBarcode(data)
    if (result.product || result.notFound) track('scan', { found: !!result.product })
    if (result.product) {
      setStatus('scanning')
      busy.current = false
      // Opened from the routine builder: the product goes straight into the step.
      const pickFor = route?.params?.pickFor
      if (pickFor) {
        navigation.setParams({ pickFor: undefined })
        navigation.navigate('RoutineBuilder', { picked: { ...pickFor, product: result.product } }, { merge: true })
      } else {
        navigation.navigate('Product', { id: result.product.id, product: result.product })
      }
      return
    }
    if (result.notFound) {
      setUnknown({ barcode: data, brandHint: result.brandHint, suggestion: result.suggestion })
      requestProduct('barcode', data).catch(() => {})
    }
    setStatus(result.notFound ? 'notFound' : 'error')
  }

  const scanAgain = () => {
    busy.current = false
    setPhotos({ front: null, back: null })
    setStatus('scanning')
  }

  const snap = async (side) => {
    try {
      const photo = await takeProductPhoto()
      if (photo?.denied) return Alert.alert(t('Allow the camera'), t('Allow camera access in your settings to add photos.'))
      if (photo) setPhotos(p => ({ ...p, [side]: photo }))
    } catch (error) {
      await logError('Scanner_photo', error, {}, 'warn')
    }
  }

  // The barcode is always sent; the photos only if she took them.
  const sendProposal = async () => {
    setSending(true)
    try {
      const id = await proposeProduct({ userId: user.id, barcode: unknown.barcode, suggestion: unknown.suggestion })
      if (id && (photos.front || photos.back)) await addProposalPhotos(user.id, id, photos)
      track('product_proposed', { photos: [photos.front, photos.back].filter(Boolean).length })
      setStatus('thanks')
    } catch (error) {
      await logError('Scanner_propose', error, {}, 'warn')
      Alert.alert(t('Couldn’t send'), t('Check your connection and try again.'))
    } finally {
      setSending(false)
    }
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
          ) : status === 'propose' ? (
            <>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Help us add this product')}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
                {t('Photos are optional: the front, and the ingredient list on the back. We check every product before it joins Skynkod.')}
              </Text>
              <View style={styles.photoRow}>
                {[['front', 'Front'], ['back', 'Ingredients']].map(([side, label]) => (
                  <Pressable key={side} onPress={() => snap(side)} style={[styles.photoSlot, { borderColor: colors.border, backgroundColor: colors.card }]} accessibilityRole="button" accessibilityLabel={t(label)}>
                    {photos[side] ? (
                      <Image source={{ uri: photos[side].uri }} style={styles.photoImg} />
                    ) : (
                      <>
                        <Ionicons name="camera-outline" size={22} color={colors.muted} />
                        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4 }]}>{t(label)}</Text>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>
              <Button title={t('Send')} icon="send" loading={sending} onPress={sendProposal} style={{ marginTop: SPACING.lg }} />
              <Button title={t('Cancel')} variant="secondary" onPress={() => setStatus('notFound')} style={{ marginTop: SPACING.sm }} />
            </>
          ) : status === 'thanks' ? (
            <>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Thank you! 🌿')}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>
                {t('We’ll check this product and add it to Skynkod. Each product accepted earns you points towards the Official Contributor badge.')}
              </Text>
              <Button title={t('Scan again')} onPress={scanAgain} style={{ marginTop: SPACING.lg }} />
            </>
          ) : (
            <>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>
                {status === 'notFound' ? t("We don't know this product yet") : t("Couldn't look up this product")}
              </Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                {status === 'notFound'
                  ? unknown?.suggestion?.name
                    ? t('It looks like {product}. Help us add it, or find it in our list.', { product: [unknown.suggestion.brand, unknown.suggestion.name].filter(Boolean).join(' ') })
                    : unknown?.brandHint
                    ? t('It looks like a {brand} product. Find it in our list and the scanner will recognise it next time.', { brand: unknown.brandHint })
                    : t('Find it in our list and the scanner will recognise it next time.')
                  : t('Check your connection and try again.')}
              </Text>
              {status === 'notFound' ? (
                <Button title={t('Help us add it')} icon="add-circle-outline" onPress={() => setStatus('propose')} style={{ marginTop: SPACING.lg }} />
              ) : null}
              {status === 'notFound' ? (
                <Button
                  title={t('Find it in our list')}
                  variant="secondary"
                  icon="search"
                  onPress={() => {
                    scanAgain()
                    navigation.navigate('Search', { linkBarcode: unknown.barcode, query: unknown.brandHint || '' })
                  }}
                  style={{ marginTop: SPACING.sm }}
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
  photoRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  photoSlot: { flex: 1, height: 110, borderRadius: RADIUS.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
})
