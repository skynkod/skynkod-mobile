import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, Modal, Image, Dimensions } from 'react-native'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { useFocusEffect } from '@react-navigation/native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Ionicons } from '@expo/vector-icons'
import { P, PremiumShell, PButton, PLoading, tap } from '../components/PremiumSpace'
import { useAuth } from '../utils/AuthContext'
import { useLanguage } from '../utils/LanguageContext'
import { isPremiumUser } from '../utils/premium'
import { DEKOD_POINTS, OLD_POINTS, hasDekodConsent, giveDekodConsent, runDekod, journalFrom, getDekodResults, deleteDekodResult, scoreOf, levelFor, splitScans, compareScans } from '../utils/dekod'
import { File } from 'expo-file-system'
import { syncSoon } from '../utils/journey'
import { getActivePlan } from '../utils/emergency-state'
import { useSkinProfile } from '../utils/useSkinProfile'
import { logError } from '../utils/errorLogger'
import { syncSmartReminders } from '../utils/notifications'
import { track } from '../utils/analytics'
import { SPACING, TYPE, liveStyles } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

const LABEL = 'Dekod · Premium'

const LEVEL = { none: 'None', light: 'Light', visible: 'Visible' }
const LEVEL_COLOR = { none: P.success, light: P.primary, visible: P.warn }
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()
// We promise the photo is deleted (audit 2, 2026-10-25): the copies the camera
// and the crop leave on the phone go too, as soon as they're no longer shown.
const deletePhotos = uris => uris.forEach(uri => { try { if (uri) new File(uri).delete() } catch { /* already gone */ } })

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
  // Sharp enough for blackheads and texture (Dekod v2, 2026-10-25).
  context.resize({ width: 1200 })
  const image = await context.renderAsync()
  return image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true })
}


// Dekod, Skynkod's skin scan, in the same plum space as Rekod:
// intro → consent (first time) → photo tips → camera → check → result,
// and once she has scans, a home with the latest one, evolution and history.
export default function DekodScreen({ navigation }) {
  useTheme() // redraws in the colours of the mode on screen
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const [premium, setPremium] = useState(undefined)
  const [consent, setConsent] = useState(undefined)
  const [stage, setStage] = useState('home') // home | consent | tips | camera | analysing | result
  const [result, setResult] = useState(null)
  const [permission, requestPermission] = useCameraPermissions()
  const camera = useRef(null)
  const photos = useRef([]) // the photo files on the phone, deleted once used
  // A 7-day plan already running: Dekod doesn't offer to start another (integration audit).
  const [sosOn, setSosOn] = useState(false)
  useFocusEffect(useCallback(() => { if (user?.id) getActivePlan(user.id).then(p => setSosOn(!!p)).catch(() => {}) }, [user?.id]))
  const ovalRef = useRef(null)
  const ovalRect = useRef(null) // where the oval sits on screen
  const [history, setHistory] = useState(null) // past scans, newest first
  const [shot, setShot] = useState(null) // { uri, checks, ok, retake } right after the photo
  const [viewing, setViewing] = useState(null) // a past scan opened from the history

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
  }, [user?.id])
  // Leaving Dekod at any moment (even mid-analysis): the photos on the phone go at once.
  const focused = useRef(true)
  useFocusEffect(useCallback(() => {
    focused.current = true
    return () => {
      focused.current = false
      deletePhotos(photos.current)
      photos.current = []
      setShot(null)
      setStage(s => (s === 'analysing' || s === 'camera' ? 'home' : s))
    }
  }, []))

  if (premium === undefined || consent === undefined) return <PLoading />
  // Free users get one Dekod to try, once (Lita, 2026-10-23); following the
  // evolution and new scans are Premium.
  const canScan = premium || (history !== null && history.length === 0)

  const forgetPhotos = () => { deletePhotos(photos.current); photos.current = [] }
  const toHome = () => { forgetPhotos(); setStage('home'); setViewing(null); setShot(null) }
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
      photos.current.push(raw.uri)
      const photo = ovalRect.current ? await cropToOval(raw, ovalRect.current).catch(() => null) : null
      if (!photo?.base64) {
        // Cropping failed: fall back to the whole photo, resized.
        const ctx = ImageManipulator.manipulate(raw.uri)
        ctx.resize({ width: 1200 })
        Object.assign(raw, await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true }))
      }
      const final = photo?.base64 ? photo : raw
      photos.current.push(final.uri)
      if (!final?.base64) return
      setShot({ uri: final.uri, checks: null })
      setStage('analysing')
      // Her skin type and known issues make the notes and tips kinder; the scores never use them.
      const res = await runDekod(final.base64, language, profile ? { skinType: profile.skin_type, issues: profile.skin_concerns } : null)
      // She left during the analysis: nothing to show, and no copy stays behind.
      if (!focused.current) {
        forgetPhotos()
        if (res.ok) { loadHistory(); syncSmartReminders(user.id); syncSoon(user.id) }
        return
      }
      if (res.error === 'consent_required') {
        forgetPhotos()
        setConsent(false)
        return setStage('consent')
      }
      if (res.error === 'daily_limit') {
        toHome()
        return Alert.alert(t('See you tomorrow 🌸'), t('You’ve had your Dekod today. Come back tomorrow for a new scan.'))
      }
      if (res.error) {
        forgetPhotos()
        setStage('tips')
        return Alert.alert(t('Dekod is unavailable'), t('Please try again in a moment.'))
      }
      // The oval turns green (all good) or orange (what to change) on the photo.
      setShot({ uri: final.uri, checks: res.checks || null, ok: !!res.ok, retake: res.retake })
      if (!res.ok) return
      // Saved by the server (audit 2): the app only shows it.
      setResult(res)
      setTimeout(() => { setStage('result'); forgetPhotos() }, 1400)
      track('dekod_done')
      loadHistory()
      syncSmartReminders(user.id)
      syncSoon(user.id)
    } catch (error) {
      forgetPhotos()
      setStage('tips')
      await logError('Dekod_shoot', error, {}, 'warn')
    }
  }

  // One compact row per point, like Rekod's routine steps.
  // Scans from before Dekod v2 keep their own five points (audit 2).
  const Points = ({ points, version }) => (
    <View style={{ gap: SPACING.sm, marginTop: SPACING.lg }}>
      {(version === 2 ? DEKOD_POINTS : OLD_POINTS).map(p => {
        const r = points?.[p.key] || {}
        const score = version === 2 ? scoreOf(points, p.key) : (r.level ? scoreOf({ [p.key]: { level: r.level } }, p.key) : null)
        const level = levelFor(score)
        return (
          <View key={p.key} style={styles.row}>
            <View style={styles.rowIcon}><Ionicons name={p.icon} size={18} color={P.primary} /></View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Text style={[TYPE.bodyStrong, { color: P.text, flex: 1 }]}>{t(p.label)}</Text>
                {/* A point the photo didn't show is "Not read", never "None" */}
                <Text style={[styles.chip, { color: level ? LEVEL_COLOR[level] : P.muted, borderColor: level ? LEVEL_COLOR[level] : P.border }]}>
                  {level ? `${t(LEVEL[level])}${typeof r.score === 'number' ? ` · ${r.score}/10` : ''}` : t('Not read')}
                </Text>
              </View>
              {r.note ? <Text style={[TYPE.caption, { color: P.textSecondary, marginTop: 3, lineHeight: 18 }]}>{r.note}</Text> : null}
              {level && level !== 'none' && r.tip ? <Text style={[TYPE.caption, { color: P.primary, marginTop: 3, lineHeight: 18 }]}>{r.tip}</Text> : null}
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
    const color = !done ? P.border : shot.ok ? P.success : P.warn
    const lines = done ? [
      [c.light === 'ok', c.light === 'dark' ? 'A bit too dark: face a window' : c.light === 'bright' ? 'Too bright: avoid direct sun' : c.light === 'warm' ? 'Lamp light: face a window' : 'Light OK'],
      [c.position === 'ok', c.position === 'far' ? 'Come a little closer' : c.position === 'off' ? 'Face the camera, in the oval' : c.position === 'none' ? 'We can’t see your face' : 'Face well placed'],
      [c.sharp, c.sharp ? 'Sharp photo' : 'A little blurry: hold still'],
    ] : []
    return (
      <PremiumShell label={LABEL} scroll={false}
        footer={done && !shot.ok ? (
          <>
            <PButton title={t('Retake the photo')} icon="camera-outline" onPress={() => { forgetPhotos(); setShot(null); setStage('camera') }} />
            <PButton title={t('See the tips again')} outline onPress={() => { forgetPhotos(); setShot(null); setStage('tips') }} />
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
              <Text style={[TYPE.caption, { color: P.muted }]}>{t('Your photo is analysed by our AI provider. Skynkod doesn\'t keep it.')}</Text>
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
        <Points points={viewing.result?.points} version={viewing.result?.version} />
        <Disclaimer />
      </PremiumShell>
    )
  }

  // ---------- Result ----------
  if (stage === 'result' && result) {
    // Her usual: the scans before this one (not this one).
    const next = journalFrom(result.points, (history || []).filter(h => h.id !== result.id))
    return (
      <PremiumShell label={LABEL} onBack={toHome} overline={t('Today')} title={t('Your Dekod')} subtitle={result.summary}
        footer={(
          <>
            {next.issues.length && !sosOn ? <PButton title={t('Emergency mode')} icon="medkit-outline" onPress={() => navigation.navigate('Emergency', { issues: next.issues, openedAt: Date.now() })} /> : null}
            {next.tags.length ? (
              <PButton title={t('Add to my journal')} icon="create-outline" outline={!!next.issues.length && !sosOn}
                onPress={() => navigation.navigate('Journal', { openNew: Date.now(), presetAt: Date.now(), presetTags: next.tags, presetMood: next.mood })} />
            ) : null}
            {!next.tags.length ? <PButton title={t('Done')} onPress={toHome} /> : null}
          </>
        )}>
        <Points points={result.points} version={result.version} />
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
        <Line icon="trash-outline" text="Your photo is sent to Anthropic, our AI provider in the United States, to read your skin. Skynkod doesn't keep your photo." />
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
        {/* Shine and redness change through the day and after products: same conditions, comparable scans */}
        <Line icon="time-outline" text="Same time each day, before your skincare" />
      </PremiumShell>
    )
  }

  // ---------- Dekod home: latest scan, evolution, history ----------
  if (history?.length) {
    const latest = history[0]
    const scannedToday = sameDay(latest.created_at, new Date())
    const ordered = [...history].reverse().slice(-8) // oldest → newest, last 8
    return (
      <PremiumShell label={LABEL}
        overline={`${t('Latest scan')} · ${new Date(latest.created_at).toLocaleDateString(language, { day: 'numeric', month: 'short' })}`}
        title={t('Your skin today')} subtitle={latest.result?.summary}
        footer={premium
          ? <PButton title={t(scannedToday ? 'Next scan tomorrow' : 'New scan')} icon="dekod" disabled={scannedToday} onPress={begin} />
          : (
            <>
              <PButton title={t('Follow my skin with Premium')} icon="diamond-outline" onPress={() => navigation.navigate('Premium')} />
              <Text style={[TYPE.caption, { color: P.muted, textAlign: 'center', marginTop: SPACING.sm }]}>{t('Your free scan is done. Premium: a scan a day and your evolution.')}</Text>
            </>
          )}>
        <Points points={latest.result?.points} version={latest.result?.version} />

        {history.length > 1 ? (
          <>
            <Text style={[styles.section, { color: P.primary }]}>{t('Your evolution')}</Text>
            <View style={{ gap: SPACING.sm }}>
              {compareScans(splitScans(history).from, splitScans(history).to).map(row => {
                const p = DEKOD_POINTS.find(x => x.key === row.key)
                const { from, to } = row
                const better = row.trend === 'better'
                const worse = row.trend === 'worse'
                return (
                  <View key={p.key} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={[TYPE.bodyStrong, { color: P.text }]}>{t(p.label)}</Text>
                      <Text style={{ color: better ? P.success : worse ? P.warn : P.muted, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                        {from ? t(LEVEL[from]) : t('Not read')} → {to ? t(LEVEL[to]) : t('Not read')}
                      </Text>
                    </View>
                    <View style={styles.bars}>
                      {ordered.map(h => {
                        const sc = scoreOf(h.result?.points, p.key)
                        return <View key={h.id} style={[styles.bar, { height: 4 + (sc ?? 0) * 2, backgroundColor: sc === null ? P.border : LEVEL_COLOR[levelFor(sc)] }]} />
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

  const startButton = canScan
    ? <PButton title={t(premium ? 'Start my Dekod' : 'Try my free scan')} icon="dekod" onPress={begin} />
    : <PButton title={t('Unlock with Premium')} icon="diamond-outline" onPress={() => navigation.navigate('Premium')} />

  // ---------- Dekod: one clear screen, Premium said from the start ----------
  return (
    <PremiumShell label={LABEL}
      footer={(
        <>
          {startButton}
          <Text style={[TYPE.caption, { color: P.muted, textAlign: 'center', marginTop: SPACING.sm }]}>
            {premium ? t('One scan a day with your Premium.') : t('Your first scan is free. Then a scan a day with Premium.')}
          </Text>
        </>
      )}>
      <Text style={[styles.landingTitle, { color: P.text }]}>{t('See what your skin shows today')}</Text>
      <Text style={[TYPE.body, { color: P.textSecondary, marginTop: SPACING.sm, lineHeight: 22 }]}>{t('One selfie reads 7 points of your skin, with one tip for each.')}</Text>
      <View style={{ gap: SPACING.lg, marginTop: SPACING.xxl }}>
        {[
          ['grid-outline', 'Redness, shine, spots, blackheads, dryness, dark spots and dullness'],
          ['trending-up-outline', 'Follow how they change, scan after scan'],
          ['shield-checkmark-outline', 'Skynkod doesn\'t keep your photo'],
        ].map(([icon, text]) => (
          <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}>
            <View style={styles.rowIcon}><Ionicons name={icon} size={18} color={P.primary} /></View>
            <Text style={[TYPE.body, { color: P.text, flex: 1 }]}>{t(text)}</Text>
          </View>
        ))}
      </View>
      <Disclaimer />
    </PremiumShell>
  )
}

const styles = liveStyles(() => StyleSheet.create({
  landingTitle: { fontWeight: '700', letterSpacing: -0.4, fontSize: 30, lineHeight: 36, marginTop: SPACING.md },
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
  ovalPhoto: { width: 210, height: 286, borderRadius: 143, borderWidth: 5, overflow: 'hidden', backgroundColor: P.primarySoft },
  close: { position: 'absolute', top: 60, left: 20 },
  shutter: { position: 'absolute', bottom: 50, alignSelf: 'center', width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' },
}))
