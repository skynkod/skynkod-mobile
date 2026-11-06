import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Screen, Card, Button, ProgressBar, Banner, Chip, SegmentedControl, useColors } from '../components/ui'
import { BadgeImage, LevelEmblem, TierPill, TIER_STYLE } from '../components/Badge'
import { BoxArt, TeaArt, StarArt } from '../components/KodaBox'
import { KODA_BOX_ON } from '../utils/journey-core'
import { useAuth } from '../utils/AuthContext'
import { useLanguage } from '../utils/LanguageContext'
import { syncJourney, openBox, makeBoxReadyForTest } from '../utils/journey'
import { CATEGORIES, TIERS, TIER_ORDER, LEVELS, LEVEL_TIERS } from '../utils/journey-core'
import { shareSkynkod } from '../utils/share'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS } from '../utils/theme'
import { GTYPE, GFW } from '../components/glossy'
import FeatureIcon from '../components/FeatureIcon'

const TESTERS = ['djedidilita@gmail.com']
const STATE_LABEL = { todo: 'To start', started: 'In progress', done: 'Done' }
const TIER_FILTERS = [{ id: 'all', label: 'All' }, ...TIER_ORDER.map(id => ({ id, label: TIERS[id].name }))]

// My Skin Journey: level and XP, then three tabs: the badge collection,
// the weekly challenges (with the Monday Koda box), and stats. Free for everyone.
export default function MySkinJourneyScreen() {
  const colors = useColors()
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const { width } = useWindowDimensions()
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState('badges')
  const [filter, setFilter] = useState('all')
  const [detail, setDetail] = useState(null)
  const [levelsOpen, setLevelsOpen] = useState(false)
  const [box, setBox] = useState(null) // { contents, open } while opening
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

  const { level, streak } = data
  const fmt = ts => new Date(ts).toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' })
  const fmtDay = key => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString(language, { day: 'numeric', month: 'short' }) }
  const col = (Math.min(width, 600) - SPACING.lg * 2) / 4

  const startBox = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    try {
      const contents = await openBox(user.id)
      setBox({ contents, open: false })
    } catch (e) {
      logError('Journey_box', e, {}, 'warn')
    }
  }
  const openIt = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    setBox({ ...box, open: true })
  }
  // Closing the box syncs: the Welcome Back badge then shows its own screen.
  const closeBox = () => { setBox(null); load() }

  const badgeTile = b => (
    <Pressable key={b.id} onPress={() => setDetail(b)} style={({ pressed }) => [styles.tile, { width: col, opacity: pressed ? 0.7 : 1 }]} accessibilityLabel={t(b.name)}>
      <BadgeImage badge={b} size={col * 0.86} locked={!b.earned} />
      <Text numberOfLines={2} style={[styles.tileName, { color: b.earned ? colors.text : colors.textSecondary }]}>{t(b.name)}</Text>
      <Text numberOfLines={2} style={[styles.tileSub, { color: b.soon ? colors.primary : colors.muted }]}>{b.soon ? t('Coming soon') : t(b.condition)}</Text>
    </Pressable>
  )

  return (
    <Screen back title={t('My Skin Journey')} subtitle={t('Your progress, your way.')}>
      {/* Level and XP */}
      <Card style={{ marginTop: SPACING.md }} onPress={() => setLevelsOpen(true)}>
        <View style={styles.levelRow}>
          <LevelEmblem level={level.level} size={78} />
          <View style={{ flex: 1 }}>
            <View style={styles.rowBetween}>
              <Text style={[GTYPE.overline, { color: colors.primary }]}>{t(level.tier.name).toUpperCase()}</Text>
              {data.stars ? (
                <View style={styles.stars}>
                  <Ionicons name="star" size={13} color="#C99A45" />
                  <Text style={[GTYPE.caption, { color: colors.text, ...GFW('700') }]}>{data.stars}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[GTYPE.bodyStrong, { color: colors.text, fontSize: 17, marginTop: 2 }]}>{t('Level {n}', { n: level.level })} · {t(level.name)}</Text>
            <View style={[styles.rowBetween, { marginTop: 4 }]}>
              <Text style={[GTYPE.caption, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>{t(level.description)}</Text>
              <Text style={[GTYPE.caption, { color: colors.muted }]}>{level.next ? `${data.xp} / ${level.next.xp} XP` : `${data.xp} XP`}</Text>
            </View>
            <ProgressBar value={level.progress} style={{ marginTop: 6 }} />
          </View>
        </View>
        {streak.active ? (
          <View style={[styles.streak, { borderTopColor: colors.border }]}>
            <Ionicons name="flame" size={16} color={colors.primary} />
            <Text style={[GTYPE.caption, { color: colors.text, flex: 1 }]}>
              {t('{n}-day series', { n: streak.current })} · {streak.doneToday ? t('done today') : t('tick a routine today to keep it')}
            </Text>
          </View>
        ) : null}
      </Card>

      <View style={{ marginTop: SPACING.lg }}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'badges', label: `${t('Badges')} ${data.earnedCount}/${data.earnableCount}` },
            { value: 'challenges', label: t('Challenges') },
            { value: 'stats', label: t('Stats') },
          ]}
        />
      </View>

      {tab === 'badges' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingVertical: SPACING.md }}>
            {TIER_FILTERS.map(f => <Chip key={f.id} label={t(f.label)} selected={filter === f.id} onPress={() => setFilter(f.id)} />)}
          </ScrollView>
          {CATEGORIES.map(cat => {
            const list = data.badges.filter(b => b.category === cat.id && (filter === 'all' || b.tier === filter))
            if (!list.length) return null
            return (
              <View key={cat.id} style={{ marginBottom: SPACING.lg }}>
                <Text style={[styles.section, { color: colors.text }]}>{t(cat.title).toUpperCase()}</Text>
                <Text style={[GTYPE.caption, { color: colors.muted, fontStyle: 'italic', marginBottom: SPACING.sm }]}>{t(cat.subtitle)}</Text>
                <View style={styles.grid}>{list.map(badgeTile)}</View>
              </View>
            )
          })}
        </>
      ) : null}

      {tab === 'challenges' ? (
        <>
          {/* The Koda box */}
          {KODA_BOX_ON && (data.box.ready || tester) ? (
            <Card style={{ marginTop: SPACING.lg, alignItems: 'center' }}>
              <BoxArt size={110} />
              <Text style={[GTYPE.bodyStrong, { color: colors.text, marginTop: SPACING.sm }]}>{data.box.ready ? t('Your Koda box has arrived') : t('Your next Koda box comes on Monday')}</Text>
              <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>{t('Every active week earns you a seniority star.')}</Text>
              {data.box.ready ? <Button title={t('Open my box')} onPress={startBox} style={{ marginTop: SPACING.md, alignSelf: 'stretch' }} /> : null}
              {tester && !data.box.ready ? <Button title={t('Test: get my box now')} variant="secondary" icon="cube-outline" onPress={() => makeBoxReadyForTest(user.id).then(load)} style={{ marginTop: SPACING.md, alignSelf: 'stretch' }} /> : null}
            </Card>
          ) : null}

          <Text style={[styles.section, { color: colors.text, marginTop: SPACING.xl }]}>{t('THIS WEEK’S CHALLENGES')}</Text>
          {data.challenges.length ? (
            <>
              <Text style={[GTYPE.caption, { color: colors.muted, marginBottom: SPACING.sm }]}>
                {t('From {from} to {to} · +{xp} XP each', { from: fmtDay(data.challenges[0].from), to: fmtDay(data.challenges[0].to), xp: data.challenges[0].xp })}
              </Text>
              <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
                {data.challenges.map((c, i) => (
                  <View key={c.id} style={[styles.row, i < data.challenges.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <FeatureIcon name={c.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={c.done ? colors.success : colors.muted} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.rowBetween}>
                        <Text style={[GTYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{t(c.title)}</Text>
                        <Text style={[GTYPE.caption, { color: c.done ? colors.success : colors.textSecondary, ...GFW('600') }]}>{t(STATE_LABEL[c.state])}</Text>
                      </View>
                      <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t(c.description)}</Text>
                      <View style={styles.progressRow}>
                        <ProgressBar value={c.value / c.target} height={6} style={{ flex: 1 }} color={c.done ? colors.success : undefined} />
                        <Text style={[GTYPE.caption, { color: colors.textSecondary, minWidth: 34, textAlign: 'right' }]}>{c.value}/{c.target}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          {data.nextSteps.length ? (
            <>
              <Text style={[styles.section, { color: colors.text, marginTop: SPACING.xl }]}>{t('NEXT STEPS')}</Text>
              <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.sm }}>
                {data.nextSteps.map((s, i) => (
                  <Pressable key={s.badge.id} onPress={() => setDetail(data.badges.find(b => b.id === s.badge.id))} style={[styles.row, i < data.nextSteps.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <BadgeImage badge={s.badge} size={40} locked />
                    <View style={{ flex: 1 }}>
                      <Text style={[GTYPE.bodyStrong, { color: colors.text }]}>{t(s.badge.name)}</Text>
                      <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t(s.badge.condition)}</Text>
                      {s.target > 1 ? (
                        <View style={styles.progressRow}>
                          <ProgressBar value={s.value / s.target} height={6} style={{ flex: 1 }} />
                          <Text style={[GTYPE.caption, { color: colors.textSecondary, minWidth: 34, textAlign: 'right' }]}>{s.value}/{s.target}</Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </Card>
            </>
          ) : null}
        </>
      ) : null}

      {tab === 'stats' ? (
        <>
          <View style={[styles.statGrid, { marginTop: SPACING.lg }]}>
            {[
              { icon: 'sparkles-outline', value: data.xp, label: 'XP earned' },
              { icon: 'ribbon-outline', value: `${data.earnedCount}/${data.earnableCount}`, label: 'Badges' },
              { icon: 'star-outline', value: data.stars, label: 'Seniority stars' },
              { icon: streak.active ? 'flame' : 'flame-outline', value: streak.current, label: 'Current series' },
              { icon: 'trophy-outline', value: streak.best, label: 'Best series' },
              { icon: 'water-outline', value: data.stats.routineDays, label: 'Days with a routine' },
              { icon: 'create-outline', value: data.stats.journalDays, label: 'Journal days' },
              { icon: 'book-outline', value: data.stats.ingredientViews, label: 'Ingredients discovered' },
              { icon: 'flask-outline', value: data.stats.productsOwned, label: 'Products in your collection' },
            ].map(s => (
              <Card key={s.label} style={styles.statCard}>
                <FeatureIcon name={s.icon} size={18} color={colors.primary} />
                <Text style={[GTYPE.heading, { color: colors.text, marginTop: 6 }]}>{s.value}</Text>
                <Text style={[GTYPE.caption, { color: colors.textSecondary }]}>{t(s.label)}</Text>
              </Card>
            ))}
          </View>
          <Text style={[GTYPE.caption, { color: colors.muted, marginTop: SPACING.sm, lineHeight: 18 }]}>
            {t('A series counts the days in a row with a ticked routine. Missing a day never takes away your badges or XP.')}
          </Text>
          <Button title={t('Share Skynkod with a friend')} variant="secondary" icon="share-outline" onPress={() => shareSkynkod(user.id, t)} style={{ marginTop: SPACING.xl }} />
        </>
      ) : null}

      {/* All 15 levels, by tier; the ones not reached yet stay silhouettes */}
      <Modal visible={levelsOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setLevelsOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.solid || colors.bg }}>
          <View style={[styles.sheetHead, { borderBottomColor: colors.border }]}>
            <Text style={[GTYPE.heading, { color: colors.text }]}>{t('Your levels')}</Text>
            <Pressable onPress={() => setLevelsOpen(false)} hitSlop={10} accessibilityLabel={t('Close')}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxxl }}>
            {LEVEL_TIERS.map(tier => (
              <View key={tier.id} style={{ marginBottom: SPACING.xl }}>
                <Text style={[styles.section, { color: colors.text }]}>{t(tier.name).toUpperCase()}</Text>
                <Text style={[GTYPE.caption, { color: colors.muted, fontStyle: 'italic', marginBottom: SPACING.sm }]}>{t('Levels {a}–{b}', { a: tier.levels[0], b: tier.levels[1] })} · {t(tier.description)}</Text>
                {LEVELS.filter(l => l.level >= tier.levels[0] && l.level <= tier.levels[1]).map(l => {
                  const reached = level.level >= l.level
                  const current = level.level === l.level
                  return (
                    <View key={l.level} style={[styles.levelItem, { backgroundColor: current ? colors.primarySoft : colors.card, borderColor: current ? colors.primary : colors.border }]}>
                      <LevelEmblem level={l.level} size={64} locked={!reached} />
                      <View style={{ flex: 1 }}>
                        <Text style={[GTYPE.caption, { color: colors.primary, ...GFW('700') }]}>{t('LEVEL {n}', { n: String(l.level).padStart(2, '0') })}{current ? ` · ${t('YOU ARE HERE')}` : ''}</Text>
                        <Text style={[GTYPE.bodyStrong, { color: reached ? colors.text : colors.textSecondary, marginTop: 2 }]}>{t(l.name)}</Text>
                        <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t(l.description)}</Text>
                      </View>
                      <Text style={[GTYPE.caption, { color: colors.muted }]}>{reached ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : `${l.xp} XP`}</Text>
                    </View>
                  )
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Badge detail card */}
      <Modal visible={!!detail} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <Pressable style={[styles.back, { backgroundColor: 'rgba(30,20,30,0.55)' }]} onPress={() => setDetail(null)}>
          {detail ? (() => {
            const ts = TIER_STYLE[detail.tier]
            const status = detail.earned ? 'Obtained' : detail.soon ? 'Coming soon' : detail.mystery ? 'Secret' : detail.value > 0 ? 'In progress' : 'Locked'
            return (
              <Pressable style={[styles.detail, { backgroundColor: ts.card }]} onPress={() => {}}>
                <BadgeImage badge={detail} size={150} locked={!detail.earned} />
                <TierPill tier={detail.tier} style={{ marginTop: SPACING.sm }} />
                <Text style={[styles.detailName, { color: ts.ink }]}>{t(detail.name)}</Text>
                <Text style={[styles.detailText, { color: ts.soft }]}>{detail.mystery ? t('A secret badge. Keep exploring Skynkod to discover it…') : detail.soon ? t('This badge arrives with a future feature of Skynkod.') : t(detail.earned ? detail.description : detail.condition)}</Text>
                {!detail.soon && !detail.mystery ? <View style={{ alignSelf: 'stretch', marginTop: SPACING.md }}>
                  <Text style={[styles.detailCount, { color: ts.soft }]}>{detail.earned ? detail.target : detail.value}/{detail.target}</Text>
                  <View style={[styles.bar, { backgroundColor: detail.tier === 'legendary' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]}>
                    <View style={{ width: `${(detail.earned ? 1 : detail.value / detail.target) * 100}%`, height: '100%', borderRadius: 4, backgroundColor: ts.bar }} />
                  </View>
                </View> : null}
                <View style={[styles.status, detail.earned || detail.value > 0 ? { backgroundColor: ts.bar } : { borderWidth: 1, borderColor: ts.soft }]}>
                  <Text style={[styles.statusText, { color: detail.earned || detail.value > 0 ? '#FFFFFF' : ts.ink }]}>{t(status).toUpperCase()}</Text>
                </View>
                <Text style={[styles.detailDate, { color: ts.soft }]}>
                  {detail.earned ? fmt(detail.earned.at) : detail.soon || detail.mystery ? '' : t('Keep going to unlock this badge.')}
                </Text>
                {detail.earned ? <Text style={[styles.detailKoda, { color: ts.ink }]}>“{t(detail.koda)}” · Koda</Text> : null}
              </Pressable>
            )
          })() : null}
        </Pressable>
      </Modal>

      {/* Opening the Koda box: a seniority star, or a cup of tea */}
      <Modal visible={!!box} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={[styles.back, { backgroundColor: '#1E141D' }]}>
          {box && !box.open ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.kicker}>{t('YOUR KODA BOX')}</Text>
              <Pressable onPress={openIt} style={{ marginTop: SPACING.lg }}><BoxArt size={210} /></Pressable>
              <Button title={t('Open it')} onPress={openIt} style={{ marginTop: SPACING.lg, minWidth: 220 }} />
            </View>
          ) : box ? (
            <View style={{ alignItems: 'center', maxWidth: 320 }}>
              {box.contents.kind === 'star' ? <StarArt n={box.contents.star} size={190} /> : <TeaArt size={170} />}
              <Text style={styles.boxTitle}>
                {box.contents.kind === 'star' ? t('Star n°{n}', { n: box.contents.star }) : t('So nice to see you again')}
              </Text>
              <Text style={styles.boxText}>
                {box.contents.kind === 'star'
                  ? (box.contents.star === 1 ? t('Your first week with Skynkod. Thank you for being here ✨') : t('{n} active weeks with Skynkod. Thank you for being here ✨', { n: box.contents.star }))
                  : t('Here’s a cup of tea to start this week gently, together.')}
              </Text>
              <Button title={t('Let’s go')} onPress={closeBox} style={{ marginTop: SPACING.lg, minWidth: 220 }} />
            </View>
          ) : null}
        </View>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: StyleSheet.hairlineWidth },
  section: { fontSize: 13, ...GFW('600'), letterSpacing: 2.2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { alignItems: 'center', paddingBottom: SPACING.md },
  tileName: { fontSize: 12, ...GFW('600'), textAlign: 'center', marginTop: 4, paddingHorizontal: 2 },
  tileSub: { fontSize: 10, textAlign: 'center', marginTop: 2, paddingHorizontal: 2, lineHeight: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: { width: '48.5%' },
  back: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  detail: { width: '100%', maxWidth: 320, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center' },
  detailName: { fontSize: 22, ...GFW('600'), marginTop: SPACING.md, textAlign: 'center' },
  detailText: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  detailCount: { fontSize: 11, textAlign: 'right', marginBottom: 4 },
  bar: { height: 7, borderRadius: 4, overflow: 'hidden' },
  status: { alignSelf: 'stretch', marginTop: SPACING.lg, paddingVertical: 11, borderRadius: 999, alignItems: 'center' },
  statusText: { fontSize: 12, ...GFW('700'), letterSpacing: 1.6 },
  detailDate: { fontSize: 12, marginTop: SPACING.md, textAlign: 'center' },
  detailKoda: { fontSize: 13, fontStyle: 'italic', marginTop: SPACING.sm, textAlign: 'center', lineHeight: 19 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  levelItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.sm },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(201,154,69,0.14)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  kicker: { color: '#E9CF9A', fontSize: 12, letterSpacing: 2.4, ...GFW('600') },
  boxTitle: { color: '#FFFFFF', fontSize: 22, ...GFW('600'), marginTop: SPACING.lg, textAlign: 'center' },
  boxText: { color: '#D8C8D3', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: SPACING.sm },
})
