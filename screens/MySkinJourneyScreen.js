import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator, Animated, useWindowDimensions } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Screen, Card, Button, ProgressBar, Banner, useColors } from '../components/ui'
import BadgeCard, { TIER_LOOK } from '../components/BadgeCard'
import { BoxArt, TeaArt } from '../components/KodaBox'
import { useAuth } from '../utils/AuthContext'
import { useLanguage } from '../utils/LanguageContext'
import { syncJourney, openBox, makeBoxReadyForTest } from '../utils/journey'
import { TIERS } from '../utils/journey-core'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const TESTERS = ['djedidilita@gmail.com']
const STATE_LABEL = { todo: 'To start', started: 'In progress', done: 'Done' }

// A card that flips in from the box.
function Reveal({ children, k }) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    v.setValue(0)
    Animated.spring(v, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }).start()
  }, [k])
  return (
    <Animated.View style={{ opacity: v, transform: [{ perspective: 800 }, { rotateY: v.interpolate({ inputRange: [0, 1], outputRange: ['90deg', '0deg'] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
      {children}
    </Animated.View>
  )
}

// My Skin Journey: level, XP, streak, the Koda box of the week, challenges,
// next steps and the badge collection. Free for everyone.
export default function MySkinJourneyScreen() {
  const colors = useColors()
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const { width } = useWindowDimensions()
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [detail, setDetail] = useState(null)
  const [box, setBox] = useState(null) // { items, step } while opening
  const tester = TESTERS.includes(user?.email)

  const load = useCallback(() => {
    if (!user?.id) return
    syncJourney(user.id).then(d => { setData(d); setError(false) }).catch(e => { logError('Journey_load', e, {}, 'warn'); setError(true) })
  }, [user?.id])
  useFocusEffect(load)

  if (!data) {
    return (
      <Screen back title={t('My Skin Journey')} subtitle={t('Your progress, your way.')}>
        {error ? <Banner message={t('Your journey could not load. Check your connection.')} actionLabel={t('Retry')} onAction={load} style={{ marginTop: SPACING.md }} /> : <ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.xxl }} />}
      </Screen>
    )
  }

  const fmt = ts => new Date(ts).toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' })
  const fmtDay = key => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(language, { day: 'numeric', month: 'short' }) }
  const cardW = (Math.min(width, 600) - SPACING.lg * 2 - SPACING.md) / 2
  const { level, streak } = data

  const startBox = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    const items = await openBox(user.id).catch(() => [])
    setBox({ items, step: -1 })
  }
  const nextInBox = () => {
    const next = box.step + 1
    const item = box.items[next]
    if (next < Math.max(box.items.length, 1)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      if (item?.tier === 'prism' || item?.tier === 'gold') setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 350)
      return setBox({ ...box, step: next })
    }
    setBox(null)
    load()
  }
  const boxItem = box && box.step >= 0 ? box.items[box.step] : null
  const isLast = box && box.step >= Math.max(box.items.length, 1) - 1

  return (
    <Screen back title={t('My Skin Journey')} subtitle={t('Your progress, your way.')}>
      {/* Level, XP, badges, streak */}
      <Card style={{ marginTop: SPACING.md }}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={[TYPE.overline, { color: colors.primary }]}>{t('LEVEL {n}', { n: level.level })}</Text>
            <Text style={[TYPE.heading, { color: colors.text, marginTop: 2 }]}>{t(level.name)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[TYPE.heading, { color: colors.text }]}>{data.xp}</Text>
            <Text style={[TYPE.caption, { color: colors.textSecondary }]}>XP</Text>
          </View>
        </View>
        <ProgressBar value={level.progress} style={{ marginTop: SPACING.md }} />
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 6 }]}>
          {level.next ? t('{n} XP to {name}', { n: level.toNext, name: t(level.next.name) }) : t('You reached the highest level ✨')}
        </Text>
        <View style={[styles.stats, { borderTopColor: colors.border }]}>
          <View style={styles.stat}>
            <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{data.earnedCount}/{data.badges.length}</Text>
            <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('badges')}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name={streak.active ? 'flame' : 'flame-outline'} size={18} color={streak.active ? colors.primary : colors.muted} />
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{streak.active ? t('{n} days', { n: streak.current }) : '–'}</Text>
            <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('Best: {n}', { n: streak.best })}</Text>
          </View>
        </View>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm, lineHeight: 18 }]}>
          {streak.active
            ? (streak.doneToday ? t('Your routine is ticked today. See you tomorrow 🌙') : t('Tick a routine today to keep your series going.'))
            : t('A new series starts with your next ticked routine. No pressure.')}
        </Text>
      </Card>

      {/* The Koda box */}
      {data.box.ready || tester ? (
        <Card style={{ marginTop: SPACING.lg, alignItems: 'center' }}>
          <BoxArt size={120} />
          <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.sm }]}>{data.box.ready ? t('Your Koda box has arrived') : t('Your next Koda box comes on Monday')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
            {data.box.inside.length ? t('{n} badges are waiting inside.', { n: data.box.inside.length }) : t('Something for you is inside.')}
          </Text>
          {data.box.ready ? <Button title={t('Open my box')} onPress={startBox} style={{ marginTop: SPACING.md, alignSelf: 'stretch' }} /> : null}
          {tester && !data.box.ready ? (
            <Button title={t('Test: get my box now')} variant="secondary" icon="cube-outline" onPress={() => makeBoxReadyForTest(user.id).then(load)} style={{ marginTop: SPACING.md, alignSelf: 'stretch' }} />
          ) : null}
        </Card>
      ) : null}

      {/* Weekly challenges */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('THIS WEEK’S CHALLENGES')}</Text>
      {data.challenges.length ? (
        <>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: -4, marginBottom: SPACING.sm }]}>
            {t('From {from} to {to} · +{xp} XP each', { from: fmtDay(data.challenges[0].from), to: fmtDay(data.challenges[0].to), xp: data.challenges[0].xp })}
          </Text>
          <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
            {data.challenges.map((c, i) => (
              <View key={c.id} style={[styles.challenge, i < data.challenges.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <Ionicons name={c.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={c.done ? colors.success : colors.muted} />
                <View style={{ flex: 1 }}>
                  <View style={styles.rowBetween}>
                    <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{t(c.title)}</Text>
                    <Text style={[TYPE.caption, { color: c.done ? colors.success : colors.textSecondary, fontWeight: '600' }]}>{t(STATE_LABEL[c.state])}</Text>
                  </View>
                  <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t(c.description)}</Text>
                  <View style={styles.progressRow}>
                    <ProgressBar value={c.value / c.target} height={6} style={{ flex: 1 }} color={c.done ? colors.success : undefined} />
                    <Text style={[TYPE.caption, { color: colors.textSecondary, minWidth: 34, textAlign: 'right' }]}>{c.value}/{c.target}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {/* Next steps */}
      {data.nextSteps.length ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('NEXT STEPS')}</Text>
          <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
            {data.nextSteps.map((s, i) => (
              <Pressable key={s.badge.id} onPress={() => setDetail(data.badges.find(b => b.id === s.badge.id))} style={[styles.challenge, i < data.nextSteps.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View style={[styles.stepIcon, { backgroundColor: TIER_LOOK[s.badge.tier].well[1] }]}>
                  <Ionicons name={s.badge.icon} size={18} color={TIER_LOOK[s.badge.tier].accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(s.badge.name)}</Text>
                  <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t(s.badge.condition)}</Text>
                  {s.target > 1 ? (
                    <View style={styles.progressRow}>
                      <ProgressBar value={s.value / s.target} height={6} style={{ flex: 1 }} />
                      <Text style={[TYPE.caption, { color: colors.textSecondary, minWidth: 34, textAlign: 'right' }]}>{s.value}/{s.target}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}

      {/* The collection */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('MY COLLECTION')}</Text>
      <View style={styles.grid}>
        {data.badges.map(b => {
          const state = !b.earned ? 'locked' : b.earned.revealed ? 'earned' : 'mystery'
          return (
            <Pressable key={b.id} onPress={() => setDetail(b)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : state === 'locked' ? 0.75 : 1 })} accessibilityLabel={t(b.name)}>
              <BadgeCard badge={{ ...b, name: t(b.name) }} state={state} width={cardW} />
            </Pressable>
          )
        })}
      </View>

      {/* Badge detail */}
      <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <Pressable style={[styles.back, { backgroundColor: 'rgba(12,8,12,0.82)' }]} onPress={() => setDetail(null)}>
          {detail ? (() => {
            const state = !detail.earned ? 'locked' : detail.earned.revealed ? 'earned' : 'mystery'
            return (
              <View style={{ alignItems: 'center', maxWidth: 320 }}>
                <BadgeCard badge={{ ...detail, name: t(detail.name) }} state={state} width={230} shine={state === 'earned'} />
                {state === 'earned' ? (
                  <>
                    <Text style={styles.quote}>“{t(detail.koda)}”</Text>
                    <Text style={styles.sig}>KODA</Text>
                    <Text style={styles.detailText}>{t(detail.description)}</Text>
                    <Text style={styles.detailSub}>{t('Earned on {date}', { date: fmt(detail.earned.at) })} · {t(TIERS[detail.tier].name)}</Text>
                  </>
                ) : state === 'mystery' ? (
                  <Text style={styles.detailText}>{t('You earned this one! It will be revealed in your Koda box on Monday.')}</Text>
                ) : (
                  <>
                    <Text style={styles.detailText}>{t(detail.condition)}</Text>
                    <Text style={styles.detailSub}>{t(TIERS[detail.tier].name)}</Text>
                  </>
                )}
              </View>
            )
          })() : null}
        </Pressable>
      </Modal>

      {/* Opening the box */}
      <Modal visible={!!box} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={[styles.back, { backgroundColor: 'rgba(12,8,12,0.88)' }]}>
          {box && box.step < 0 ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.boxKicker}>{t('YOUR KODA BOX')}</Text>
              <Pressable onPress={nextInBox} style={{ marginTop: SPACING.lg }}><BoxArt size={210} /></Pressable>
              <Button title={t('Open it')} onPress={nextInBox} style={{ marginTop: SPACING.lg, minWidth: 220 }} />
            </View>
          ) : box ? (
            <View style={{ alignItems: 'center', maxWidth: 320 }}>
              {boxItem ? (
                <Reveal k={boxItem.id}>
                  <BadgeCard badge={{ ...boxItem, name: t(boxItem.name) }} state="earned" width={230} shine />
                </Reveal>
              ) : (
                <Reveal k="tea"><TeaArt size={170} /></Reveal>
              )}
              <Text style={styles.quote}>
                {boxItem ? `“${t(boxItem.koda)}”` : t('A cup of tea for you ☕ Last week was a quiet one, and that’s okay. Let’s start this week together.')}
              </Text>
              <Text style={styles.sig}>KODA</Text>
              {box.items.length > 1 ? <Text style={styles.detailSub}>{box.step + 1} / {box.items.length}</Text> : null}
              <Button title={isLast ? (boxItem ? t('Add to my collection') : t('Let’s go')) : t('Next')} onPress={nextInBox} style={{ marginTop: SPACING.lg, minWidth: 220 }} />
            </View>
          ) : null}
        </View>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  stats: { flexDirection: 'row', marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: StyleSheet.hairlineWidth },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginTop: SPACING.xxl, marginBottom: SPACING.sm },
  challenge: { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.md },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  stepIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  back: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  boxKicker: { color: '#E9CF9A', fontSize: 12, letterSpacing: 2.4, fontWeight: '600' },
  quote: { color: '#F6EEF2', fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: SPACING.lg, fontStyle: 'italic' },
  sig: { color: '#E9CF9A', fontSize: 11, letterSpacing: 2.4, marginTop: SPACING.sm },
  detailText: { color: '#F6EEF2', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: SPACING.md },
  detailSub: { color: '#BFA9B7', fontSize: 12, marginTop: SPACING.sm, textAlign: 'center' },
})
