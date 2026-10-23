import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, Modal, Image, Dimensions } from 'react-native'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { useFocusEffect } from '@react-navigation/native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { P, PremiumShell, PButton, PLoading, Carousel, tap, isIntroHidden, hideIntro } from '../components/PremiumSpace'
import { useAuth } from '../utils/AuthContext'
import { useLanguage } from '../utils/LanguageContext'
import { isPremiumUser } from '../utils/premium'
import { DEKOD_POINTS, hasDekodConsent, giveDekodConsent, runDekod, saveDekodResult, journalFrom, getDekodResults, deleteDekodResult } from '../utils/dekod'
import { logError } from '../utils/errorLogger'
import { syncSmartReminders } from '../utils/notifications'
import { track } from '../utils/analytics'
import { SPACING, TYPE } from '../utils/theme'

const LABEL = 'Dekod · Skin scan'

const LEVEL = { none: 'None', light: 'Light', visible: 'Visible' }
const RANK = { none: 0, light: 1, visible: 2 }
const LEVEL_COLOR = { none: P.success, light: P.primary, visible: P.warn }
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()

// Keeps only the face: the part of the photo under the on-screen oval (plus a
// small margin), resized so the analysis sees the skin, not the room.
// The preview fills the screen ("cover"), so screen points map to photo pixels
// with one scale and a centred offset.
const cropToOval = async (photo, oval) => {
  const { width: W, height: H } = Dimensions.get('screen')
  const scale = Math.max(W / photo.width, H / photo.height)
  const offX = (W - photo.width * scale) / 2
  const offY = (H - photo.height * scale) / 2
  const mx = oval.width * 0.12
  const my = oval.height * 0.08
  const x = Math.max(0, Math.round((oval.x - mx - offX) / scale))
  const y = Math.max(0, Math.round((oval.y - my - offY) / scale))
  const w = Math.min(photo.width - x, Math.round((oval.width + 2 * mx) / scale))
  const h = Math.min(photo.height - y, Math.round((oval.height + 2 * my) / scale))
  const context = ImageManipulator.manipulate(photo.uri)
  if (w > 50 && h > 50) context.crop({ originX: x, originY: y, width: w, height: h })
  context.resize({ width: 720 })
  const image = await context.renderAsync()
  return image.saveAsync({ format: SaveFormat.JPEG, compress: 0.75, base64: true })
}

const SLIDES = [
  { icon: 'scan-circle-outline', title: 'Dekod: read your skin in seconds', text: 'Dekod is Skynkod’s skin scan. Take one selfie, and Dekod reads what is visible on your skin.' },
  { icon: 'grid-outline', title: 'Five points, one tip each', text: 'Redness, shine, blemishes, dryness and tone, each with a simple tip, and your evolution scan after scan.' },
  { icon: 'shield-checkmark-outline', title: 'Private by design', text: 'Your photo is analysed, then deleted. Only the result is kept in your account.' },
]

// Dekod, Skynkod's skin scan, in the same plum space as Rekod:
// intro → consent (first time) → photo tips → camera → check → result,
// and once she has scans, a home with the latest one, evolution and history.
export default function DekodScreen({ navigation }) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [premium, setPremium] = useState(undefined)
  const [consent, setConsent] = useState(undefined)
  const [stage, setStage] = useState('home') // home | consent | tips | camera | analysing | result
  const [result, setResult] = useState(null)
  const [permission, requestPermission] = useCameraPermissions()
  const camera = useRef(null)
  const ovalRef = useRef(null)
  const ovalRect = useRef(null) // where the oval sits on screen
  const [history, setHistory] = useState(null) // past scans, newest first
  const [shot, setShot] = useState(null) // { uri, checks, ok, retake } right after the photo
  const [viewing, setViewing] = useState(null) // a past scan opened from the history
  const [introHidden, setIntroHidden] = useState(false) // she understood Dekod: no more slides

  const loadHistory = useCallback(() => {
    if (!user?.id) return
    getDekodResults(user.id).then(setHistory).catch(() => setHistory([]))
  }, [user?.id])
  useFocusEffect(useCallback(() => { loadHistory() }, [loadHistory]))

  // Re-read on each visit, so the team's Free / Premium switch applies at once.
  useFocusEffect(useCallback(() => { if (user?.id) isPremiumUser(user.id).then(setPremium).catch(() => setPremium(false)) }, [user?.id]))
  useEffect(() => {
    if (!user?.id) return
    hasDekodConsent(user.id).then(setConsent)
    isIntroHidden('dekod', user.id).then(setIntroHidden)
  }, [user?.id])

  if (premium === undefined || consent === undefined) return <PLoading />

  const toHome = () => { setStage('home'); setViewing(null); setShot(null) }
  const begin = () => { tap(); setStage(consent ? 'tips' : 'consent') }
  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission()
      if (!res.granted) return Alert.alert(t('Camera needed'), t('Allow the camera in your settings to use Dekod.'))
    }
    setStage('camera')
  }

  const shoot = async () => {
    try {
      const raw = await camera.current?.takePictureAsync({ quality: 0.8, shutterSound: false })
      if (!raw?.uri) return
      const photo = ovalRect.current ? await cropToOval(raw, ovalRect.current).catch(() => null) : null
      if (!photo?.base64) {
        // Cropping failed: fall back to the whole photo, resized.
        const ctx = ImageManipulator.manipulate(raw.uri)
        ctx.resize({ width: 720 })
        Object.assign(raw, await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true }))
      }
      const final = photo?.base64 ? photo : raw
      if (!final?.base64) return
      setShot({ uri: final.uri, checks: null })
      setStage('analysing')
      const res = await runDekod(final.base64, language)
      if (res.error === 'daily_limit') {
        toHome()
        return Alert.alert(t('See you tomorrow 🌸'), t('You’ve had your Dekod today. Come back tomorrow for a new scan.'))
      }
      if (res.error) {
        setStage('tips')
        return Alert.alert(t('Dekod is unavailable'), t('Please try again in a moment.'))
      }
      // The oval turns green (all good) or orange (what to change) on the photo.
      setShot({ uri: final.uri, checks: res.checks || null, ok: !!res.ok, retake: res.retake })
      if (!res.ok) return
      setResult(res)
      setTimeout(() => setStage('result'), 1400)
      track('dekod_done')
      saveDekodResult(user.id, res).then(() => { loadHistory(); syncSmartReminders(user.id) }).catch(error => logError('Dekod_save', error, {}, 'warn'))
    } catch (error) {
      setStage('tips')
      await logError('Dekod_shoot', error, {}, 'warn')
    }
  }

  // One compact row per point, like Rekod's routine steps.
  const Points = ({ points }) => (
    <View style={{ gap: SPACING.sm, marginTop: SPACING.lg }}>
      {DEKOD_POINTS.map(p => {
        const r = points?.[p.key] || { level: 'none' }
        return (
          <View key={p.key} style={styles.row}>
            <View style={styles.rowIcon}><Ionicons name={p.icon} size={18} color={P.primary} /></View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Text style={[TYPE.bodyStrong, { color: P.text, flex: 1 }]}>{t(p.label)}</Text>
                <Text style={[styles.chip, { color: LEVEL_COLOR[r.level], borderColor: LEVEL_COLOR[r.level] }]}>{t(LEVEL[r.level])}</Text>
              </View>
              {r.note ? <Text style={[TYPE.caption, { color: P.textSecondary, marginTop: 3, lineHeight: 18 }]}>{r.note}</Text> : null}
              {r.level !== 'none' && r.tip ? <Text style={[TYPE.caption, { color: P.primary, marginTop: 3, lineHeight: 18 }]}>{r.tip}</Text> : null}
            </View>
          </View>
        )
      })}
    </View>
  )
  const Disclaimer = () => (
    <Text style={[TYPE.caption, { color: P.muted, marginTop: SPACING.lg, lineHeight: 17 }]}>
      {t('Dekod describes what is visible on your skin. It is not a medical diagnosis: for anything that worries you, see a dermatologist.')}
    </Text>
  )
  const Line = ({ icon, text }) => (
    <View style={styles.line}>
      <View style={styles.rowIcon}><Ionicons name={icon} size={18} color={P.primary} /></View>
      <Text style={[TYPE.body, { color: P.text, flex: 1, lineHeight: 22 }]}>{t(text)}</Text>
    </View>
  )

  // ---------- Camera (full screen, over the tab bar) ----------
  if (stage === 'camera') {
    return (
      <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setStage('tips')}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="front" />
          <View pointerEvents="none" style={styles.ovalWrap}>
            <View ref={ovalRef} style={styles.oval}
              onLayout={() => ovalRef.current?.measureInWindow((x, y, width, height) => { ovalRect.current = { x, y, width, height } })} />
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

  // ---------- Checking the photo, then decoding ----------
  if (stage === 'analysing') {
    const c = shot?.checks
    const done = !!c
    const color = !done ? 'rgba(255,255,255,0.85)' : shot.ok ? '#5BD08A' : P.warn
    const lines = done ? [
      [c.light === 'ok', c.light === 'dark' ? 'A bit too dark: face a window' : c.light === 'bright' ? 'Too bright: avoid direct sun' : 'Light OK'],
      [c.position === 'ok', c.position === 'far' ? 'Come a little closer' : c.position === 'off' ? 'Face the camera, in the oval' : c.position === 'none' ? 'We can’t see your face' : 'Face well placed'],
      [c.sharp, c.sharp ? 'Sharp photo' : 'A little blurry: hold still'],
    ] : []
    return (
      <PremiumShell label={LABEL} scroll={false}
        footer={done && !shot.ok ? (
          <>
            <PButton title={t('Retake the photo')} icon="camera-outline" onPress={() => { setShot(null); setStage('camera') }} />
            <PButton title={t('See the tips again')} outline onPress={() => { setShot(null); setStage('tips') }} />
          </>
        ) : null}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[styles.ovalPhoto, { borderColor: color }]}>
            {shot?.uri ? <Image source={{ uri: shot.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
          </View>
          {!done ? (
            <View style={{ alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xl }}>
              <ActivityIndicator color={P.primary} />
              <Text style={[TYPE.bodyStrong, { color: P.text }]}>{t('Checking light and position…')}</Text>
              <Text style={[TYPE.caption, { color: P.muted }]}>{t('Your photo is analysed, then deleted.')}</Text>
            </View>
          ) : (
            <View style={{ marginTop: SPACING.xl, gap: SPACING.sm, alignSelf: 'stretch', paddingHorizontal: SPACING.lg }}>
              {lines.map(([ok, label]) => (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Ionicons name={ok ? 'checkmark-circle' : 'alert-circle'} size={20} color={ok ? '#5BD08A' : P.warn} />
                  <Text style={[TYPE.bodyStrong, { color: P.text }]}>{t(label)}</Text>
                </View>
              ))}
              {shot.ok
                ? <Text style={[TYPE.caption, { color: P.primary, marginTop: SPACING.md, textAlign: 'center' }]}>{t('Decoding your skin…')}</Text>
                : shot.retake ? <Text style={[TYPE.caption, { color: P.textSecondary, marginTop: SPACING.sm, lineHeight: 18 }]}>{shot.retake}</Text> : null}
            </View>
          )}
        </View>
      </PremiumShell>
    )
  }

  // ---------- A past scan ----------
  if (viewing) {
    return (
      <PremiumShell label={LABEL} onBack={toHome}
        overline={new Date(viewing.created_at).toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' })}
        title={t('Your Dekod')} subtitle={viewing.result?.summary}
        footer={<PButton title={t('Delete this scan')} icon="trash-outline" outline onPress={() => Alert.alert(t('Delete this scan?'), t('This result will be erased for good.'), [
          { text: t('Cancel'), style: 'cancel' },
          { text: t('Delete'), style: 'destructive', onPress: async () => {
            try { await deleteDekodResult(viewing.id); toHome(); loadHistory() } catch (error) { logError('Dekod_delete', error, {}, 'warn'); Alert.alert(t('Couldn’t delete'), t('Please try again.')) }
          } },
        ])} />}>
        <Points points={viewing.result?.points} />
        <Disclaimer />
      </PremiumShell>
    )
  }

  // ---------- Result ----------
  if (stage === 'result' && result) {
    const next = journalFrom(result.points)
    return (
      <PremiumShell label={LABEL} onBack={toHome} overline={t('Today')} title={t('Your Dekod')} subtitle={result.summary}
        footer={(
          <>
            {next.issues.length ? <PButton title={t('Emergency mode')} icon="medkit-outline" onPress={() => navigation.navigate('Emergency', { issues: next.issues, openedAt: Date.now() })} /> : null}
            {next.tags.length ? (
              <PButton title={t('Add to my journal')} icon="create-outline" outline={!!next.issues.length}
                onPress={() => navigation.navigate('Journal', { openNew: Date.now(), presetAt: Date.now(), presetTags: next.tags, presetMood: next.mood })} />
            ) : null}
            {!next.tags.length ? <PButton title={t('Done')} onPress={toHome} /> : null}
          </>
        )}>
        <Points points={result.points} />
        <Disclaimer />
      </PremiumShell>
    )
  }

  // ---------- Consent (first time) ----------
  if (stage === 'consent') {
    return (
      <PremiumShell label={LABEL} onBack={toHome} title={t('Before your first scan')}
        footer={(
          <>
            <PButton title={t('I agree')} onPress={async () => { tap(); await giveDekodConsent(user.id); setConsent(true); setStage('tips') }} />
            <PButton title={t('Not now')} outline onPress={toHome} />
          </>
        )}>
        <Line icon="camera-outline" text="Dekod looks at one photo of your face to describe what is visible on your skin." />
        <Line icon="trash-outline" text="Your photo is analysed, then deleted. It is never stored or shared." />
        <Line icon="document-text-outline" text="Only the result is saved in your account, and you can delete it anytime." />
        <Line icon="medical-outline" text="Dekod gives cosmetic observations, not a medical diagnosis." />
      </PremiumShell>
    )
  }

  // ---------- Photo tips ----------
  if (stage === 'tips') {
    return (
      <PremiumShell label={LABEL} onBack={toHome} title={t('For a good scan')}
        footer={<PButton title={t('Take my photo')} icon="camera-outline" onPress={openCamera} />}>
        <Line icon="sunny-outline" text="Daylight, facing a window" />
        <Line icon="sparkles-outline" text="No makeup, clean face" />
        <Line icon="person-outline" text="Face the camera, hair tied back" />
        <Line icon="phone-portrait-outline" text="Phone at eye level, no filter" />
      </PremiumShell>
    )
  }

  // ---------- Dekod home: latest scan, evolution, history ----------
  if (premium && history?.length) {
    const latest = history[0]
    const scannedToday = sameDay(latest.created_at, new Date())
    const ordered = [...history].reverse().slice(-8) // oldest → newest, last 8
    const first = history[history.length - 1]
    return (
      <PremiumShell label={LABEL}
        overline={`${t('Latest scan')} · ${new Date(latest.created_at).toLocaleDateString(language, { day: 'numeric', month: 'short' })}`}
        title={t('Your skin today')} subtitle={latest.result?.summary}
        footer={<PButton title={t(scannedToday ? 'Next scan tomorrow' : 'New scan')} icon="scan-outline" disabled={scannedToday} onPress={begin} />}>
        <Points points={latest.result?.points} />

        {history.length > 1 ? (
          <>
            <Text style={[styles.section, { color: P.primary }]}>{t('Your evolution')}</Text>
            <View style={{ gap: SPACING.sm }}>
              {DEKOD_POINTS.map(p => {
                const from = first.result?.points?.[p.key]?.level || 'none'
                const to = latest.result?.points?.[p.key]?.level || 'none'
                const better = RANK[to] < RANK[from]
                const worse = RANK[to] > RANK[from]
                return (
                  <View key={p.key} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={[TYPE.bodyStrong, { color: P.text }]}>{t(p.label)}</Text>
                      <Text style={{ color: better ? P.success : worse ? P.warn : P.muted, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                        {t(LEVEL[from])} → {t(LEVEL[to])}
                      </Text>
                    </View>
                    <View style={styles.bars}>
                      {ordered.map(h => {
                        const lvl = h.result?.points?.[p.key]?.level || 'none'
                        return <View key={h.id} style={[styles.bar, { height: 6 + RANK[lvl] * 8, backgroundColor: LEVEL_COLOR[lvl] }]} />
                      })}
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        ) : null}

        <Text style={[styles.section, { color: P.primary }]}>{t('History')}</Text>
        <View style={{ gap: SPACING.sm }}>
          {history.map(h => (
            <Pressable key={h.id} onPress={() => { tap(); setViewing(h) }} style={styles.row}>
              <Text style={[TYPE.bodyStrong, { color: P.text, width: 64 }]}>{new Date(h.created_at).toLocaleDateString(language, { day: 'numeric', month: 'short' })}</Text>
              <Text style={[TYPE.caption, { color: P.textSecondary, flex: 1 }]} numberOfLines={1}>{h.result?.summary}</Text>
              <Ionicons name="chevron-forward" size={16} color={P.muted} />
            </Pressable>
          ))}
        </View>
        <Disclaimer />
      </PremiumShell>
    )
  }

  const startButton = premium
    ? <PButton title={t('Start my Dekod')} icon="scan-outline" onPress={begin} />
    : <PButton title={t('Unlock with Premium')} icon="lock-open-outline" onPress={() => navigation.navigate('Premium')} />

  // ---------- Intro hidden: a short start screen ----------
  if (introHidden) {
    return (
      <PremiumShell label={LABEL} title="Dekod" subtitle={t('Your skin scan: one selfie, five points, one tip each.')}
        footer={(
          <>
            {startButton}
            <Pressable onPress={() => { tap(); setIntroHidden(false) }} hitSlop={8} style={{ alignSelf: 'center', paddingTop: SPACING.sm }}>
              <Text style={[TYPE.caption, { color: P.primary, fontWeight: '700' }]}>{t('What is Dekod?')}</Text>
            </Pressable>
          </>
        )}>
        <Line icon="sunny-outline" text="Daylight, no makeup, face the camera" />
        <Line icon="shield-checkmark-outline" text="Your photo is analysed, then deleted" />
      </PremiumShell>
    )
  }

  // ---------- Intro: a swipeable presentation (locked without Premium) ----------
  return (
    <PremiumShell label={LABEL} scroll={false}
      footer={(
        <>
          {startButton}
          <Pressable onPress={() => { tap(); hideIntro('dekod', user.id); setIntroHidden(true) }} hitSlop={8} style={{ alignSelf: 'center', paddingTop: SPACING.sm }}>
            <Text style={[TYPE.caption, { color: P.muted, fontWeight: '600' }]}>{t('Got it, don’t show this again')}</Text>
          </Pressable>
        </>
      )}>
      <Carousel slides={SLIDES.map(s => ({ ...s, title: t(s.title), text: t(s.text) }))} />
      <Text style={[TYPE.caption, { color: P.muted, textAlign: 'center', marginBottom: SPACING.sm }]}>{t('One scan a day with Premium')}</Text>
    </PremiumShell>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderColor: P.border, backgroundColor: P.card, borderRadius: 18, padding: SPACING.md },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: P.primarySoft },
  chip: { fontSize: 11, fontWeight: '700', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.lg },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: SPACING.xxl, marginBottom: SPACING.sm },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 24 },
  bar: { width: 8, borderRadius: 3 },
  // Centred a little below the middle, where the face sits when holding the phone at eye level.
  ovalWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingTop: 90 },
  oval: { width: 250, height: 340, borderRadius: 170, borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)' },
  ovalHint: { color: '#FFFFFF', marginTop: SPACING.lg, fontSize: 14, fontWeight: '600' },
  ovalPhoto: { width: 210, height: 286, borderRadius: 143, borderWidth: 5, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' },
  close: { position: 'absolute', top: 60, left: 20 },
  shutter: { position: 'absolute', bottom: 50, alignSelf: 'center', width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' },
})
