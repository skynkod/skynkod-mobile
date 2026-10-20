import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, Modal } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { Screen, LoadingView, useColors } from '../components/ui'
import { useAuth } from '../utils/AuthContext'
import { useLanguage } from '../utils/LanguageContext'
import { isPremiumUser } from '../utils/premium'
import { DEKOD_POINTS, hasDekodConsent, giveDekodConsent, runDekod, saveDekodResult, journalFrom, getDekodResults } from '../utils/dekod'
import { logError } from '../utils/errorLogger'
import { track } from '../utils/analytics'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const PLUM = '#33202E'
const MAUVE = '#E2C6DA'
// Lets the owner try Premium features before in-app purchase exists.
const TESTERS = ['djedidilita@gmail.com']

const LEVEL = { none: 'None', light: 'Light', visible: 'Visible' }
const RANK = { none: 0, light: 1, visible: 2 }
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()

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
  const [history, setHistory] = useState(null) // past scans, newest first
  const [viewing, setViewing] = useState(null) // a past scan opened from the history

  const loadHistory = useCallback(() => {
    if (!user?.id) return
    getDekodResults(user.id).then(setHistory).catch(() => setHistory([]))
  }, [user?.id])
  useFocusEffect(useCallback(() => { loadHistory() }, [loadHistory]))

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
      saveDekodResult(user.id, res).then(loadHistory).catch(error => logError('Dekod_save', error, {}, 'warn'))
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

  // ---------- Camera (full screen, over the tab bar) ----------
  if (stage === 'camera') {
    return (
      <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setStage('tips')}>
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
      </Modal>
    )
  }

  // ---------- Analysing ----------
  if (stage === 'analysing') {
    return (
      <Screen title="Dekod">
        <View style={{ alignItems: 'center', marginTop: SPACING.xxxl * 2, gap: SPACING.lg }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Decoding your skin…')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('Your photo is analysed, then deleted.')}</Text>
        </View>
      </Screen>
    )
  }

  const Points = ({ points }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {DEKOD_POINTS.map((p, i) => {
            const r = points?.[p.key] || { level: 'none' }
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
  )
  const Disclaimer = () => (
        <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.md, lineHeight: 17 }]}>
          {t('Dekod describes what is visible on your skin. It is not a medical diagnosis: for anything that worries you, see a dermatologist.')}
        </Text>
  )
  const toHub = () => { setStage('intro'); setViewing(null) }

  // ---------- A past scan ----------
  if (viewing) {
    return (
      <Screen back onBack={toHub} title="Dekod">
        <Text style={[TYPE.overline, { color: colors.primary }]}>{new Date(viewing.created_at).toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</Text>
        <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, lineHeight: 22 }]}>{viewing.result?.summary}</Text>
        <Points points={viewing.result?.points} />
        <Disclaimer />
      </Screen>
    )
  }

  // ---------- Result ----------
  if (stage === 'result' && result) {
    const next = journalFrom(result.points)
    return (
      <Screen back onBack={toHub} title="Dekod">
        <Text style={[TYPE.overline, { color: colors.primary }]}>{t('YOUR DEKOD · TODAY')}</Text>
        <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, lineHeight: 22 }]}>{result.summary}</Text>
        <Points points={result.points} />
        <Disclaimer />
        {next.tags.length ? (
          <Button label="Add to my journal" icon="create-outline" light
            onPress={() => navigation.navigate('Journal', { openNew: Date.now(), presetAt: Date.now(), presetTags: next.tags, presetMood: next.mood })} />
        ) : null}
        {next.issues.length ? (
          <Button label="Emergency mode" icon="medkit-outline"
            onPress={() => navigation.navigate('Emergency', { issues: next.issues, openedAt: Date.now() })} />
        ) : null}
        <Pressable onPress={toHub} style={{ alignSelf: 'center', padding: SPACING.lg }}>
          <Text style={[TYPE.bodyStrong, { color: colors.textSecondary }]}>{t('Done')}</Text>
        </Pressable>
      </Screen>
    )
  }

  // ---------- Consent (first time) ----------
  if (stage === 'consent') {
    return (
      <Screen back onBack={toHub} title="Dekod">
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
        <Pressable onPress={toHub} style={{ alignSelf: 'center', padding: SPACING.lg }}>
          <Text style={[TYPE.bodyStrong, { color: colors.textSecondary }]}>{t('Not now')}</Text>
        </Pressable>
      </Screen>
    )
  }

  // ---------- Photo tips ----------
  if (stage === 'tips') {
    return (
      <Screen back onBack={toHub} title="Dekod">
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

  // ---------- Dekod home: latest scan, evolution, history ----------
  if (premium && history?.length) {
    const latest = history[0]
    const scannedToday = sameDay(latest.created_at, new Date())
    const ordered = [...history].reverse().slice(-8) // oldest → newest, last 8
    const first = history[history.length - 1]
    return (
      <Screen title="Dekod" subtitle={t('Your skin scan')}>
        <Pressable onPress={begin} disabled={scannedToday}
          style={({ pressed }) => [styles.button, { backgroundColor: PLUM, opacity: scannedToday ? 0.45 : pressed ? 0.85 : 1, marginTop: 0 }]}>
          <Ionicons name="scan-outline" size={17} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>{t(scannedToday ? 'Next scan tomorrow' : 'New scan')}</Text>
        </Pressable>

        <Text style={[styles.section, { color: colors.muted }]}>{t('LATEST SCAN')} · {new Date(latest.created_at).toLocaleDateString(language, { day: 'numeric', month: 'short' })}</Text>
        <Text style={[TYPE.body, { color: colors.text, lineHeight: 22 }]}>{latest.result?.summary}</Text>
        <Points points={latest.result?.points} />

        {history.length > 1 ? (
          <>
            <Text style={[styles.section, { color: colors.muted }]}>{t('YOUR EVOLUTION')}</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 0 }]}>
              {DEKOD_POINTS.map((p, i) => {
                const from = first.result?.points?.[p.key]?.level || 'none'
                const to = latest.result?.points?.[p.key]?.level || 'none'
                const better = RANK[to] < RANK[from]
                const worse = RANK[to] > RANK[from]
                return (
                  <View key={p.key} style={[styles.point, i < DEKOD_POINTS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <View style={styles.pointHead}>
                      <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{t(p.label)}</Text>
                      <Text style={{ color: better ? colors.success : worse ? colors.primary : colors.muted, fontSize: 12, fontWeight: '700' }}>
                        {t(LEVEL[from])} → {t(LEVEL[to])}
                      </Text>
                    </View>
                    <View style={styles.dots}>
                      {ordered.map(h => {
                        const lvl = h.result?.points?.[p.key]?.level || 'none'
                        return <View key={h.id} style={[styles.dot, { height: 6 + RANK[lvl] * 7, backgroundColor: lvl === 'none' ? colors.success : lvl === 'light' ? colors.accent || colors.primary : colors.primary }]} />
                      })}
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        ) : null}

        <Text style={[styles.section, { color: colors.muted }]}>{t('HISTORY')}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 0 }]}>
          {history.map((h, i) => (
            <Pressable key={h.id} onPress={() => setViewing(h)} style={[styles.point, styles.pointHead, i < history.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <Text style={[TYPE.bodyStrong, { color: colors.text, width: 70 }]}>{new Date(h.created_at).toLocaleDateString(language, { day: 'numeric', month: 'short' })}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>{h.result?.summary}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          ))}
        </View>
        <Disclaimer />
      </Screen>
    )
  }

  // ---------- Intro (and locked view without Premium) ----------
  return (
    <Screen title="Dekod">
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
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.xxl, marginBottom: SPACING.sm },
  dots: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: SPACING.sm, height: 22 },
  dot: { width: 10, borderRadius: 3 },
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
