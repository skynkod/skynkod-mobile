import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Modal, Image, ActivityIndicator, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Screen, Card, Button, ProgressBar, BottomSheet, useColors } from '../components/ui'
import { ItemArt, SpaceArt, SLOTS, SPARKLE_COLOR } from '../components/VanityArt'
import { useAuth } from '../utils/AuthContext'
import { useLanguage } from '../utils/LanguageContext'
import { SPACES, ITEMS, itemOf, loadVanity, saveVanity, earnedSparkles, spaceFor, nextSpace } from '../utils/vanity'
import { getMyProducts, photoOf } from '../utils/catalog'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const TESTERS = ['djedidilita@gmail.com']
const SHOP = ITEMS.filter(i => !i.rare)
const RARES = ITEMS.filter(i => i.rare)

// One of her own products standing in the space: its photo, or a soft bottle
// with the brand's first letter.
function ProductPiece({ row, size }) {
  const photo = photoOf(row.product)
  if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: 8 }} resizeMode="contain" />
  return (
    <View style={{ width: size * 0.6, height: size * 0.9, borderRadius: size * 0.16, backgroundColor: '#E9D6E2', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#5E3F56', fontWeight: '800', fontSize: size * 0.3 }}>{(row.brand || row.product_name || '?').charAt(0).toUpperCase()}</Text>
    </View>
  )
}

// My vanity: the collection game, free for everyone. Routines and journal days
// earn sparkles; sparkles buy decor; the space grows with her habits.
export default function VanityScreen() {
  const colors = useColors()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [state, setState] = useState(null)
  const [earned, setEarned] = useState(null)
  const [products, setProducts] = useState([])
  const [width, setWidth] = useState(0)
  const [slotOpen, setSlotOpen] = useState(null)
  const [levelUp, setLevelUp] = useState(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      const s = await loadVanity(user.id)
      const [e, mine] = await Promise.all([earnedSparkles(user.id, s), getMyProducts(user.id).catch(() => [])])
      setProducts(mine.filter(p => p.status === 'owned'))
      setEarned(e)
      // A new space reached since last time: celebrate it once.
      const reached = SPACES.indexOf(spaceFor(e.total))
      if (s.seenSpace === undefined) s.seenSpace = reached
      else if (reached > s.seenSpace) {
        s.seenSpace = reached
        setLevelUp(SPACES[reached])
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      }
      setState(s)
      saveVanity(user.id, s)
    } catch (error) {
      logError('Vanity_load', error, {}, 'warn')
      setState(await loadVanity(user.id))
      setEarned({ total: 0, routines: 0, journal: 0 })
    }
  }, [user?.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  if (!state || !earned) return <Screen back title={t('My vanity')}><ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.xxl }} /></Screen>

  const update = next => { setState(next); saveVanity(user.id, next) }
  const sparkles = Math.max(0, earned.total - state.spent)
  const space = spaceFor(earned.total)
  const next = nextSpace(earned.total)
  const slots = SLOTS[space.id].slice(0, space.slots)
  const placed = Object.values(state.slots)
  const scale = width / 360
  const piece = 46 * Math.max(scale, 0.6)

  const buy = item => {
    if (sparkles < item.price) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    update({ ...state, spent: state.spent + item.price, owned: [...state.owned, item.id] })
  }
  const place = value => {
    Haptics.selectionAsync().catch(() => {})
    const slotsNext = { ...state.slots }
    if (value) slotsNext[slotOpen] = value
    else delete slotsNext[slotOpen]
    update({ ...state, slots: slotsNext })
    setSlotOpen(null)
  }
  const addTestSparkles = () => {
    const s = { ...state, bonus: (state.bonus || 0) + 100 }
    update(s)
    setEarned(e => ({ ...e, total: e.total + 100 }))
    const reached = SPACES.indexOf(spaceFor(earned.total + 100))
    if (reached > (s.seenSpace ?? 0)) {
      update({ ...s, seenSpace: reached })
      setLevelUp(SPACES[reached])
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    }
  }

  const renderSlot = (value) => {
    if (!value) return null
    const [kind, id] = value.split(':')
    if (kind === 'item') return <ItemArt id={id} size={piece} />
    const row = products.find(p => p.id === id)
    return row ? <ProductPiece row={row} size={piece} /> : null
  }

  // What can go in the open slot: her decor not placed yet, her products not placed yet.
  const freeItems = [...new Set(state.owned)].filter(id => !placed.includes(`item:${id}`))
  const freeProducts = products.filter(p => !placed.includes(`product:${p.id}`))

  return (
    <Screen back title={t('My vanity')} subtitle={t('Your habits make it grow')}>
      {/* Sparkles and level */}
      <Card style={{ marginTop: SPACING.md }}>
        <View style={styles.rowBetween}>
          <View style={styles.sparkleRow}>
            <Ionicons name="sparkles" size={22} color={SPARKLE_COLOR} />
            <Text style={[TYPE.heading, { color: colors.text }]}>{sparkles}</Text>
            <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('sparkles')}</Text>
          </View>
          <Text style={[TYPE.bodyStrong, { color: colors.primary }]}>{t(space.name)}</Text>
        </View>
        {next ? (
          <>
            <ProgressBar value={(earned.total - space.from) / (next.from - space.from)} color={SPARKLE_COLOR} style={{ marginTop: SPACING.md }} />
            <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 6 }]}>
              {t('{n} more to unlock {space}', { n: next.from - earned.total, space: t(next.name) })}
            </Text>
          </>
        ) : <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 6 }]}>{t('You reached the dream bathroom ✨')}</Text>}
      </Card>

      {/* The space */}
      <View style={{ marginTop: SPACING.lg }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
        {width ? (
          <View>
            <SpaceArt id={space.id} width={width} />
            {slots.map((s, i) => {
              const value = state.slots[i]
              return (
                <Pressable
                  key={i}
                  onPress={() => setSlotOpen(i)}
                  style={[styles.slot, { left: s.x * scale - piece / 2, top: s.y * scale - piece, width: piece, height: piece }]}
                  accessibilityLabel={t('Decorate this spot')}
                >
                  {value ? renderSlot(value) : (
                    <View style={[styles.emptySlot, { width: piece * 0.6, height: piece * 0.6, borderRadius: piece * 0.3 }]}>
                      <Ionicons name="add" size={16} color="#B08AA5" />
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>
        ) : null}
      </View>
      <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm, textAlign: 'center' }]}>{t('Tap a spot to place your products or your decor.')}</Text>

      {/* How to earn */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('HOW TO EARN SPARKLES')}</Text>
      <Card>
        <Text style={[TYPE.body, { color: colors.text }]}>{t('A routine done: +10')}</Text>
        <Text style={[TYPE.body, { color: colors.text, marginTop: 4 }]}>{t('A day in your journal: +5')}</Text>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
          {t('So far: {r} routines and {j} journal days.', { r: earned.routines, j: earned.journal })}
        </Text>
      </Card>

      {/* Shop */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('THE SHOP')}</Text>
      <View style={styles.shop}>
        {SHOP.map(item => {
          const count = state.owned.filter(id => id === item.id).length
          const short = sparkles < item.price
          return (
            <Pressable key={item.id} onPress={() => buy(item)} disabled={short} style={[styles.shopItem, { backgroundColor: colors.card, borderColor: colors.border, opacity: short ? 0.5 : 1 }]}>
              <ItemArt id={item.id} size={54} />
              <Text style={[TYPE.caption, { color: colors.text, textAlign: 'center', fontWeight: '600' }]} numberOfLines={2}>{t(item.name)}</Text>
              <View style={styles.sparkleRow}>
                <Ionicons name="sparkles" size={12} color={SPARKLE_COLOR} />
                <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{item.price}</Text>
              </View>
              {count ? <Text style={[styles.owned, { color: colors.primary }]}>{t('Owned ×{n}', { n: count })}</Text> : null}
            </Pressable>
          )
        })}
      </View>

      {/* Rare pieces */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('RARE PIECES')}</Text>
      <View style={styles.shop}>
        {RARES.map(item => {
          const has = state.rares.includes(item.id)
          return (
            <View key={item.id} style={[styles.shopItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ opacity: has ? 1 : 0.25 }}><ItemArt id={item.id} size={54} /></View>
              {!has ? <Ionicons name="lock-closed" size={14} color={colors.muted} style={{ position: 'absolute', top: 10, right: 10 }} /> : null}
              <Text style={[TYPE.caption, { color: colors.text, textAlign: 'center', fontWeight: '600' }]}>{t(item.name)}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, textAlign: 'center', fontSize: 11 }]}>{t(item.rare)}</Text>
            </View>
          )
        })}
      </View>

      {TESTERS.includes(user?.email) ? (
        <Button title={t('Test: +100 sparkles')} variant="secondary" icon="sparkles-outline" onPress={addTestSparkles} style={{ marginTop: SPACING.xxl }} />
      ) : null}
      {TESTERS.includes(user?.email) ? (
        <Button
          title={t('Test: start again')}
          variant="ghost"
          onPress={() => Alert.alert(t('Start again?'), t('Your decor and test sparkles will be cleared.'), [
            { text: t('Cancel'), style: 'cancel' },
            { text: t('Start again'), style: 'destructive', onPress: () => { update({ spent: 0, owned: [], slots: {}, bonus: 0, rares: [], seenSpace: 0 }); load() } },
          ])}
          style={{ marginTop: SPACING.sm }}
        />
      ) : null}

      {/* Pick what goes in a spot */}
      <Modal visible={slotOpen !== null} transparent animationType="slide" onRequestClose={() => setSlotOpen(null)}>
        <BottomSheet title={t('Place here')} onClose={() => setSlotOpen(null)}>
          {slotOpen !== null && state.slots[slotOpen] ? (
            <Button title={t('Empty this spot')} variant="secondary" icon="close-circle-outline" onPress={() => place(null)} style={{ marginBottom: SPACING.lg }} />
          ) : null}
          <Text style={[styles.sheetTitle, { color: colors.muted }]}>{t('MY PRODUCTS')}</Text>
          {freeProducts.length ? (
            <View style={styles.pickGrid}>
              {freeProducts.map(p => (
                <Pressable key={p.id} onPress={() => place(`product:${p.id}`)} style={[styles.pick, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <ProductPiece row={p} size={48} />
                  <Text style={[TYPE.caption, { color: colors.text, textAlign: 'center', fontSize: 11 }]} numberOfLines={2}>{p.product_name}</Text>
                </Pressable>
              ))}
            </View>
          ) : <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('Add products you own in My products to place them here.')}</Text>}
          <Text style={[styles.sheetTitle, { color: colors.muted, marginTop: SPACING.lg }]}>{t('MY DECOR')}</Text>
          {freeItems.length ? (
            <View style={styles.pickGrid}>
              {freeItems.map(id => (
                <Pressable key={id} onPress={() => place(`item:${id}`)} style={[styles.pick, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <ItemArt id={id} size={48} />
                  <Text style={[TYPE.caption, { color: colors.text, textAlign: 'center', fontSize: 11 }]} numberOfLines={2}>{t(itemOf(id)?.name)}</Text>
                </Pressable>
              ))}
            </View>
          ) : <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('Buy decor in the shop with your sparkles.')}</Text>}
        </BottomSheet>
      </Modal>

      {/* A new space unlocked */}
      <Modal visible={!!levelUp} transparent animationType="fade" onRequestClose={() => setLevelUp(null)}>
        <View style={[styles.levelBack, { backgroundColor: colors.overlay }]}>
          <View style={[styles.levelCard, { backgroundColor: colors.bg }]}>
            <Ionicons name="sparkles" size={34} color={SPARKLE_COLOR} />
            <Text style={[TYPE.overline, { color: colors.primary, marginTop: SPACING.sm }]}>{t('NEW SPACE UNLOCKED')}</Text>
            <Text style={[TYPE.heading, { color: colors.text, marginTop: 4, textAlign: 'center' }]}>{levelUp ? t(levelUp.name) : ''}</Text>
            {levelUp ? <View style={{ marginTop: SPACING.lg }}><SpaceArt id={levelUp.id} width={240} /></View> : null}
            <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.md, textAlign: 'center' }]}>
              {t('Your habits made it happen. More room for your products and decor.')}
            </Text>
            <Button title={t('Decorate it')} onPress={() => setLevelUp(null)} style={{ marginTop: SPACING.lg, alignSelf: 'stretch' }} />
          </View>
        </View>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sparkleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginTop: SPACING.xxl, marginBottom: SPACING.sm },
  slot: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-end' },
  emptySlot: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C5A8BB', backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  shop: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  shopItem: { width: '31.5%', borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', gap: 4 },
  owned: { fontSize: 10, fontWeight: '700' },
  sheetTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginBottom: SPACING.sm },
  pickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  pick: { width: 84, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', gap: 4 },
  levelBack: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  levelCard: { width: '100%', maxWidth: 340, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center' },
})
