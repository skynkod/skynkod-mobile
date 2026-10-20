import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator, Alert, Animated, ScrollView } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Screen, Card, Button, BottomSheet, useColors } from '../components/ui'
import { ItemArt, SpaceArt, BoxArt, SLOTS } from '../components/SpaceArt'
import { useAuth } from '../utils/AuthContext'
import { useLanguage } from '../utils/LanguageContext'
import { CHAPTERS, loadSpace, saveSpace, pendingBoxKey, buildBox, weekBounds } from '../utils/unbox'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const TESTERS = ['djedidilita@gmail.com']
const DAY = 86400000
const soft = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})

// One object coming out of the box, with a soft pop.
function Reveal({ item, colors, t }) {
  const pop = useRef(new Animated.Value(0)).current
  useEffect(() => {
    pop.setValue(0)
    Animated.spring(pop, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }).start()
  }, [item.id])
  return (
    <Animated.View style={{ alignItems: 'center', opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }, { translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
      <ItemArt id={item.art} tint={item.tint} size={130} />
      <Text style={[TYPE.heading, { color: colors.text, marginTop: SPACING.md, textAlign: 'center' }]}>{item.product ? item.title : t(item.title)}</Text>
      <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.sm, textAlign: 'center', lineHeight: 22 }]}>{item.product ? item.memory : t(item.memory)}</Text>
    </Animated.View>
  )
}

// My space: a box arrives each week with objects from her real week. She
// unpacks it, places each object, and every object keeps its memory.
export default function MySpaceScreen() {
  const colors = useColors()
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [state, setState] = useState(null)
  const [width, setWidth] = useState(0)
  const [opening, setOpening] = useState(null) // { box, step: -1 closed, 0..n items }
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState(null) // item id waiting for a spot
  const [viewing, setViewing] = useState(null) // placed item shown with its memory
  const [moving, setMoving] = useState(null)

  useFocusEffect(useCallback(() => {
    if (!user?.id) return
    loadSpace(user.id).then(setState)
  }, [user?.id]))

  if (!state) return <Screen back title={t('My space')}><ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.xxl }} /></Screen>

  const update = next => { setState(next); saveSpace(user.id, next) }
  const tester = TESTERS.includes(user?.email)
  const pending = pendingBoxKey(state)
  const chapter = CHAPTERS[Math.min(state.chapter, CHAPTERS.length - 1)]
  const slots = SLOTS[chapter.id].slice(0, chapter.slots)
  const items = state.boxes.flatMap(b => b.items)
  const itemOf = id => items.find(i => i.id === id)
  const placedIds = Object.values(state.placed)
  const toPutAway = items.filter(i => !placedIds.includes(i.id))
  const full = Object.keys(state.placed).length >= slots.length
  const scale = width / 360
  const piece = 50 * Math.max(scale, 0.6)
  const fmt = ms => new Date(ms).toLocaleDateString(language, { day: 'numeric', month: 'short' })

  const startOpening = async (test) => {
    setBusy(true)
    try {
      const { from, to } = test ? { from: Date.now() - 7 * DAY, to: Date.now() + DAY } : weekBounds()
      const box = await buildBox(user.id, from, to, test ? `test-${Date.now()}` : pending)
      setOpening({ box, step: -1 })
    } catch (error) {
      logError('Space_box', error, {}, 'warn')
      Alert.alert(t('The box is stuck'), t('Check your connection and try again.'))
    } finally {
      setBusy(false)
    }
  }
  const nextStep = () => {
    soft()
    if (opening.step < opening.box.items.length - 1) return setOpening({ ...opening, step: opening.step + 1 })
    update({ ...state, boxes: [...state.boxes, opening.box] })
    setOpening(null)
  }
  const placeAt = slot => {
    if (!selected) {
      const id = state.placed[slot]
      if (id) setViewing({ slot, item: itemOf(id) })
      return
    }
    if (state.placed[slot]) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    update({ ...state, placed: { ...state.placed, [slot]: selected } })
    setSelected(null)
  }
  const pickUp = () => {
    const placed = { ...state.placed }
    delete placed[viewing.slot]
    update({ ...state, placed })
    setSelected(viewing.item.id)
    setViewing(null)
  }
  const moveOn = () => {
    if (state.chapter >= CHAPTERS.length - 1) return
    update({ ...state, chapter: state.chapter + 1, placed: {} })
    setMoving(CHAPTERS[state.chapter + 1])
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  }

  const current = opening && opening.step >= 0 ? opening.box.items[opening.step] : null

  return (
    <Screen back title={t('My space')} subtitle={t(chapter.name)}>
      {/* The box of the week */}
      {pending ? (
        <Card style={{ marginTop: SPACING.md, alignItems: 'center' }}>
          <BoxArt size={130} />
          <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.sm }]}>{t('Your box of the week has arrived')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>{t('Inside: little things from your week.')}</Text>
          <Button title={t('Open it')} onPress={() => startOpening(false)} loading={busy} style={{ marginTop: SPACING.md, alignSelf: 'stretch' }} />
        </Card>
      ) : null}

      {/* The space */}
      <View style={{ marginTop: SPACING.lg }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {width ? (
          <View>
            <SpaceArt id={chapter.id} width={width} />
            {slots.map((s, i) => {
              const item = state.placed[i] ? itemOf(state.placed[i]) : null
              if (!item && !selected) return null
              return (
                <Pressable key={i} onPress={() => placeAt(i)} style={[styles.slot, { left: s.x * scale - piece / 2, top: s.y * scale - piece, width: piece, height: piece }]}>
                  {item ? <ItemArt id={item.art} tint={item.tint} size={piece} /> : (
                    <View style={[styles.emptySlot, { width: piece * 0.55, height: piece * 0.55, borderRadius: piece * 0.3, borderColor: colors.primary }]} />
                  )}
                </Pressable>
              )
            })}
          </View>
        ) : null}
      </View>
      <Text style={[TYPE.caption, { color: selected ? colors.primary : colors.muted, marginTop: SPACING.sm, textAlign: 'center', fontWeight: selected ? '700' : '400' }]}>
        {selected ? t('Now tap a spot to place it') : placedIds.length ? t('Tap an object to see its memory.') : t('Your space is waiting for your first box.')}
      </Text>

      {/* Objects to put away */}
      {toPutAway.length ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('TO PUT AWAY')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
            {toPutAway.map(item => (
              <Pressable key={item.id} onPress={() => { soft(); setSelected(selected === item.id ? null : item.id) }} style={[styles.tray, { backgroundColor: colors.card, borderColor: selected === item.id ? colors.primary : colors.border, borderWidth: selected === item.id ? 2 : 1 }]}>
                <ItemArt id={item.art} tint={item.tint} size={52} />
                <Text style={[TYPE.caption, { color: colors.text, fontSize: 11, textAlign: 'center' }]} numberOfLines={2}>{item.product ? item.title : t(item.title)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {full ? <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm }]}>{t('Your space is full. A bigger space comes with your next big moment, like finishing a Rekod. You can swap objects in the meantime.')}</Text> : null}
        </>
      ) : null}

      {/* Memories, newest box first */}
      {state.boxes.length ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('MY MEMORIES')}</Text>
          {[...state.boxes].reverse().map(box => (
            <Card key={box.key} style={{ marginBottom: SPACING.sm }}>
              <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '700' }]}>{t('Week of {date}', { date: fmt(box.from) })}</Text>
              {box.items.map(item => (
                <View key={item.id} style={styles.memory}>
                  <ItemArt id={item.art} tint={item.tint} size={34} />
                  <Text style={[TYPE.caption, { color: colors.text, flex: 1, lineHeight: 18 }]}>{item.product ? item.memory : t(item.memory)}</Text>
                </View>
              ))}
            </Card>
          ))}
        </>
      ) : null}

      {tester ? (
        <View style={{ marginTop: SPACING.xxl, gap: SPACING.sm }}>
          <Button title={t('Test: receive a box now')} variant="secondary" icon="cube-outline" onPress={() => startOpening(true)} loading={busy} />
          {state.chapter < CHAPTERS.length - 1 ? <Button title={t('Test: move to the next space')} variant="secondary" icon="home-outline" onPress={moveOn} /> : null}
          <Button
            title={t('Test: start again')}
            variant="ghost"
            onPress={() => Alert.alert(t('Start again?'), t('Your boxes and your space will be cleared.'), [
              { text: t('Cancel'), style: 'cancel' },
              { text: t('Start again'), style: 'destructive', onPress: () => { setSelected(null); update({ boxes: [], placed: {}, chapter: 0 }) } },
            ])}
          />
        </View>
      ) : null}

      {/* Unpacking */}
      <Modal visible={!!opening} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={[styles.back, { backgroundColor: colors.overlay }]}>
          <View style={[styles.unpack, { backgroundColor: colors.bg }]}>
            {opening && opening.step < 0 ? (
              <>
                <Text style={[TYPE.overline, { color: colors.primary }]}>{t('YOUR BOX OF THE WEEK')}</Text>
                <Pressable onPress={nextStep} style={{ marginTop: SPACING.lg }}><BoxArt size={190} /></Pressable>
                <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.md }]}>{t('{n} things inside', { n: opening.box.items.length })}</Text>
                <Button title={t('Open the box')} onPress={nextStep} style={{ marginTop: SPACING.lg, alignSelf: 'stretch' }} />
              </>
            ) : current ? (
              <>
                <View style={{ opacity: 0.35, marginBottom: -30 }}><BoxArt open size={110} /></View>
                <Reveal item={current} colors={colors} t={t} />
                <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.lg }]}>{opening.step + 1} / {opening.box.items.length}</Text>
                <Button title={opening.step < opening.box.items.length - 1 ? t('Next') : t('Put them away')} onPress={nextStep} style={{ marginTop: SPACING.md, alignSelf: 'stretch' }} />
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* A placed object and its memory */}
      <Modal visible={!!viewing} transparent animationType="slide" onRequestClose={() => setViewing(null)}>
        <BottomSheet title={viewing?.item ? (viewing.item.product ? viewing.item.title : t(viewing.item.title)) : ''} onClose={() => setViewing(null)}>
          {viewing?.item ? (
            <View style={{ alignItems: 'center' }}>
              <ItemArt id={viewing.item.art} tint={viewing.item.tint} size={100} />
              <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>{fmt(viewing.item.date)}</Text>
              <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.sm, textAlign: 'center', lineHeight: 22 }]}>{viewing.item.product ? viewing.item.memory : t(viewing.item.memory)}</Text>
              <Button title={t('Move it')} variant="secondary" icon="hand-left-outline" onPress={pickUp} style={{ marginTop: SPACING.lg, alignSelf: 'stretch' }} />
            </View>
          ) : null}
        </BottomSheet>
      </Modal>

      {/* Moving day */}
      <Modal visible={!!moving} transparent animationType="fade" onRequestClose={() => setMoving(null)}>
        <View style={[styles.back, { backgroundColor: colors.overlay }]}>
          <View style={[styles.unpack, { backgroundColor: colors.bg }]}>
            <Text style={[TYPE.overline, { color: colors.primary }]}>{t('MOVING DAY')}</Text>
            <Text style={[TYPE.heading, { color: colors.text, marginTop: 4 }]}>{moving ? t(moving.name) : ''}</Text>
            {moving ? <View style={{ marginTop: SPACING.lg }}><SpaceArt id={moving.id} width={240} /></View> : null}
            <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.md, textAlign: 'center' }]}>
              {t('Your skin story moves to a bigger place. Your things are packed: unpack them in your new space.')}
            </Text>
            <Button title={t('Unpack')} onPress={() => setMoving(null)} style={{ marginTop: SPACING.lg, alignSelf: 'stretch' }} />
          </View>
        </View>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginTop: SPACING.xxl, marginBottom: SPACING.sm },
  slot: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  emptySlot: { borderWidth: 2, borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  tray: { width: 86, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', gap: 4 },
  memory: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  back: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  unpack: { width: '100%', maxWidth: 340, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center' },
})
