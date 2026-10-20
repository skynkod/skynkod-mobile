import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { Screen, LoadingView, useColors } from '../components/ui'
import { useAuth } from '../utils/AuthContext'
import { useLanguage } from '../utils/LanguageContext'
import { isPremiumUser } from '../utils/premium'
import { DEKOD_POINTS, hasDekodConsent, giveDekodConsent, runDekod, saveDekodResult, journalFrom } from '../utils/dekod'
import { logError } from '../utils/errorLogger'
import { track } from '../utils/analytics'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const PLUM = '#33202E'
const MAUVE = '#E2C6DA'
// Lets the owner try Premium features before in-app purchase exists.
const TESTERS = ['djedidilita@gmail.com']

const LEVEL = { none: 'None', light: 'Light', visible: 'Visible' }

// Dekod, Skynkod's skin scan: intro → consent (first time) → photo tips →
// front camera with an oval → analysis → what's visible, point by point.
export default function DekodScreen({ navigation }) {
  const colors = useColors()
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [premium, setPremium] = useState(undefined)
  const [consent, setConsent] = useState(undefined)
  const [stage, setStage] = useState('intro') // intro | consent | tips | camera | analysing | result
  const [result, setResult] = useState(null)
  const [permission, requestPermission] = useCameraPermissions()
  const camera = useRef(null)

  useEffect(() => {
    if (!user?.id) return
    isPremiumUser(user.id).then(p => setPremium(p || TESTERS.includes(user.email))).catch(() => setPremium(TESTERS.includes(user.email)))
    hasDekodConsent(user.id).then(setConsent)
  }, [user?.id])

  if (premium === undefined || consent === undefined) return <LoadingView />

  const begin = () => setStage(consent ? 'tips' : 'consent')
  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission()
      if (!res.granted) return Alert.alert(t('Camera needed'), t('Allow the camera in your settings to use Dekod.'))
    }
    setStage('camera')
  }

  const shoot = async () => {
    try {
      const photo = await camera.current?.takePictureAsync({ base64: true, quality: 0.35, shutterSound: false })
      if (!photo?.base64) return
      setStage('analysing')
      const res = await runDekod(photo.base64, language)
      if (res.error === 'daily_limit') {
        setStage('intro')
        return Alert.alert(t('See you tomorrow 🌸'), t('You’ve had your Dekod today. Come back tomorrow for a new scan.'))
      }
      if (res.error) {
        setStage('tips')
        return Alert.alert(t('Dekod is unavailable'), t('Please try again in a moment.'))
      }
      if (!res.ok) {
        setStage('tips')
        return Alert.alert(t('Let’s retake it'), res.retake || t('We couldn’t see your skin clearly. Try daylight, facing the camera.'))
      }
      setResult(res)
      setStage('result')
      track('dekod_done')
      saveDekodResult(user.id, res).catch(error => logError('Dekod_save', error, {}, 'warn'))
    } catch (error) {
      setStage('tips')
      await logError('Dekod_shoot', error, {}, 'warn')
    }
  }

  const Button = ({ label, icon, onPress, light }) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: light ? colors.primarySoft : PLUM, opacity: pressed ? 0.85 : 1 }]}>
      {icon ? <Ionicons name={icon} size={17} color={light ? colors.primary : '#FFFFFF'} /> : null}
      <Text style={{ color: light ? colors.primary : '#FFFFFF', fontWeight: '700', fontSize: 15 }}>{t(label)}</Text>
    </Pressable>
  )

  const Hero = ({ children }) => (
    <View style={[styles.hero, { backgroundColor: PLUM }]}>
      <View style={styles.badge}>
        <Ionicons name="diamond" size={13} color={MAUVE} />
        <Text style={styles.badgeText}>{t('PREMIUM · SKIN SCAN')}</Text>
      </View>
      <Text style={styles.heroTitle}>Dekod</Text>
      {children}
    </View>
  )

  // ---------- Camera ----------
  if (stage === 'camera') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" />
        <View pointerEvents="none" style={styles.ovalWrap}>
          <View style={styles.oval} />
          <Text style={styles.ovalHint}>{t('Place your face in the oval')}</Text>
        </View>
        <Pressable onPress={() => setStage('tips')} hitSlop={12} style={styles.close} accessibilityLabel={t('Close')}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={shoot} accessibilityLabel={t('Take the photo')} style={({ pressed }) => [styles.shutter, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
          <View style={styles.shutterInner} />
        </Pressable>
      </View>
    )
  }

  // ---------- Analysing ----------
  if (stage === 'analysing') {
    return (
      <Screen back title="Dekod">
        <View style={{ alignItems: 'center', marginTop: SPACING.xxxl * 2, gap: SPACING.lg }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Decoding your skin…')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('Your photo is analysed, then deleted.')}</Text>
        </View>
      </Screen>
    )
  }

  // ---------- Result ----------
  if (stage === 'result' && result) {
    const next = journalFrom(result.points)
    return (
      <Screen back title="Dekod">
        <Text style={[TYPE.overline, { color: colors.primary }]}>{t('YOUR DEKOD · TODAY')}</Text>
        <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, lineHeight: 22 }]}>{result.summary}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {DEKOD_POINTS.map((p, i) => {
            const r = result.points?.[p.key] || { level: 'none' }
            const tone = r.level === 'visible' ? colors.primary : r.level === 'light' ? colors.accent || colors.primary : colors.success
            return (
              <View key={p.key} style={[styles.point, i < DEKOD_POINTS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View style={styles.pointHead}>
                  <Ionicons name={p.icon} size={18} color={colors.textSecondary} />
                  <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{t(p.label)}</Text>
                  <View style={[styles.level, { borderColor: tone }]}>
                    <Text style={{ color: tone, fontSize: 12, fontWeight: '700' }}>{t(LEVEL[r.level])}</Text>
                  </View>
                </View>
                {r.note ? <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>{r.note}</Text> : null}
                {r.level !== 'none' && r.tip ? <Text style={[TYPE.caption, { color: colors.primary, marginTop: 4, lineHeight: 18 }]}>{r.tip}</Text> : null}
              </View>
            )
          })}
        </View>
        <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.md, lineHeight: 17 }]}>
          {t('Dekod describes what is visible on your skin. It is not a medical diagnosis: for anything that worries you, see a dermatologist.')}
        </Text>
        {next.tags.length ? (
          <Button label="Add to my journal" icon="create-outline" light
            onPress={() => navigation.navigate('Journal', { openNew: Date.now(), presetAt: Date.now(), presetTags: next.tags, presetMood: next.mood })} />
        ) : null}
        {next.issues.length ? (
          <Button label="Emergency mode" icon="medkit-outline"
            onPress={() => navigation.navigate('Emergency', { issues: next.issues, openedAt: Date.now() })} />
        ) : null}
        <Pressable onPress={() => navigation.navigate('Home')} style={{ alignSelf: 'center', padding: SPACING.lg }}>
          <Text style={[TYPE.bodyStrong, { color: colors.textSecondary }]}>{t('Done')}</Text>
        </Pressable>
      </Screen>
    )
  }

  // ---------- Consent (first time) ----------
  if (stage === 'consent') {
    return (
      <Screen back title="Dekod">
        <Text style={[TYPE.heading, { color: colors.text }]}>{t('Before your first scan')}</Text>
        {[
          ['camera-outline', 'Dekod looks at one photo of your face to describe what is visible on your skin.'],
          ['trash-outline', 'Your photo is analysed, then deleted. It is never stored or shared.'],
          ['document-text-outline', 'Only the result is saved in your account, and you can delete it anytime.'],
          ['medical-outline', 'Dekod gives cosmetic observations, not a medical diagnosis.'],
        ].map(([icon, line]) => (
          <View key={line} style={styles.consentLine}>
            <Ionicons name={icon} size={20} color={colors.primary} />
            <Text style={[TYPE.body, { color: colors.text, flex: 1, lineHeight: 22 }]}>{t(line)}</Text>
          </View>
        ))}
        <Button label="I agree" onPress={async () => { await giveDekodConsent(user.id); setConsent(true); setStage('tips') }} />
        <Pressable onPress={() => navigation.goBack()} style={{ alignSelf: 'center', padding: SPACING.lg }}>
          <Text style={[TYPE.bodyStrong, { color: colors.textSecondary }]}>{t('Not now')}</Text>
        </Pressable>
      </Screen>
    )
  }

  // ---------- Photo tips ----------
  if (stage === 'tips') {
    return (
      <Screen back title="Dekod">
        <Text style={[TYPE.heading, { color: colors.text }]}>{t('For a good scan')}</Text>
        {[
          ['sunny-outline', 'Daylight, facing a window'],
          ['sparkles-outline', 'No makeup, clean face'],
          ['person-outline', 'Face the camera, hair tied back'],
          ['phone-portrait-outline', 'Phone at eye level, no filter'],
        ].map(([icon, line]) => (
          <View key={line} style={styles.consentLine}>
            <Ionicons name={icon} size={20} color={colors.primary} />
            <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(line)}</Text>
          </View>
        ))}
        <Button label="Take my photo" icon="camera-outline" onPress={openCamera} />
      </Screen>
    )
  }

  // ---------- Intro (and locked view without Premium) ----------
  return (
    <Screen back title="Dekod">
      <Hero>
        <Text style={styles.heroText}>
          {t('Dekod is Skynkod’s skin scan. Take one selfie, and in a few seconds Dekod reads what is visible on your skin.')}
        </Text>
        {['Redness, shine, blemishes, dryness and tone', 'A simple tip for each point', 'Adds what it sees to your journal', 'Your photo is never stored'].map(line => (
          <View key={line} style={styles.heroLine}>
            <Ionicons name="checkmark" size={15} color={MAUVE} />
            <Text style={{ color: '#FFFFFF', fontSize: 13, lineHeight: 18, flex: 1 }}>{t(line)}</Text>
          </View>
        ))}
      </Hero>
      {premium ? (
        <Button label="Start my Dekod" icon="scan-outline" onPress={begin} />
      ) : (
        <Button label="Unlock with Premium" icon="lock-open-outline"
          onPress={() => Alert.alert(t('Premium is coming soon'), t('You’ll be able to unlock Dekod very soon.'))} />
      )}
      <Text style={[TYPE.caption, { color: colors.muted, textAlign: 'center', marginTop: SPACING.sm }]}>{t('One scan a day with Premium')}</Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { borderRadius: RADIUS.xl, padding: SPACING.xl, marginTop: SPACING.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { color: MAUVE, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: SPACING.md },
  heroText: { color: MAUVE, fontSize: 14, lineHeight: 20, marginTop: SPACING.sm },
  heroLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: SPACING.md },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 999, marginTop: SPACING.lg },
  consentLine: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginTop: SPACING.lg },
  card: { borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, marginTop: SPACING.lg, overflow: 'hidden' },
  point: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  pointHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  level: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  ovalWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  oval: { width: 250, height: 340, borderRadius: 170, borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)' },
  ovalHint: { color: '#FFFFFF', marginTop: SPACING.lg, fontSize: 14, fontWeight: '600' },
  close: { position: 'absolute', top: 60, left: 20 },
  shutter: { position: 'absolute', bottom: 50, alignSelf: 'center', width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' },
})
