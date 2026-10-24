import React, { useCallback, useMemo, useState } from 'react'
import { trackOpened, trackFinished } from '../utils/journey'
import { View, Text, Pressable, StyleSheet, Alert, RefreshControl, Modal } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, LoadingView, SegmentedControl, BottomSheet, useColors } from '../components/ui'
import ProductVerdict from '../components/ProductVerdict'
import { useAuth } from '../utils/AuthContext'
import { useT, useLanguage } from '../utils/LanguageContext'
import { shelfLife, setOpened, setExpiry, setPao } from '../utils/shelf-life'
import { useSkinProfile } from '../utils/useSkinProfile'
import StopAdvice, { useStopAdvice } from '../components/StopAdvice'
import { getMyProducts, setMyProductStatus, removeMyProduct, getProductsByIds, addToMyProducts, BODY_CARE_ENABLED } from '../utils/catalog'
import ProductThumb from '../components/ProductThumb'
import { getUserRoutines } from '../utils/routines-service'
import { SHOP_LINKS_ENABLED } from '../utils/shop'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// Filter chips, in routine order; only categories the user has are shown.
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'cleanser', label: 'Cleansers' },
  { value: 'toner', label: 'Toners' },
  { value: 'serum', label: 'Serums' },
  { value: 'eye care', label: 'Eye care' },
  { value: 'lip care', label: 'Lip care' },
  { value: 'moisturizer', label: 'Moisturizers' },
  { value: 'sunscreen', label: 'SPF' },
  { value: 'exfoliant', label: 'Exfoliants' },
  { value: 'mask', label: 'Masks' },
  { value: 'other', label: 'Other' },
  // Shown once body care opens (BODY_CARE_ENABLED in utils/catalog.js).
  ...(BODY_CARE_ENABLED ? [{ value: 'body', label: 'Body' }, { value: 'hand care', label: 'Hand care' }] : []),
]

// The user's shelf ("I own") and wishlist ("To buy"), with how well each
// product suits their skin and whether it's already in a routine.
export default function ProductsScreen({ navigation }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const stopAdvice = useStopAdvice(user?.id, profile)
  const [rows, setRows] = useState([])
  const [inRoutine, setInRoutine] = useState(new Set())
  const [tab, setTab] = useState('owned')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { language } = useLanguage()
  // Shelf-life sheet: opened date, months after opening, printed expiry.
  const [lifeRow, setLifeRow] = useState(null)
  const [openedDraft, setOpenedDraft] = useState(null)
  const [paoDraft, setPaoDraft] = useState(12)
  const [expiryDraft, setExpiryDraft] = useState(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      const [firstLoad, routines] = await Promise.all([getMyProducts(user.id), getUserRoutines(user.id)])
      const ids = [...new Set((routines.success ? routines.data : []).flatMap(r => (r.steps || []).map(s => s.product_id)).filter(Boolean))]
      setInRoutine(new Set(ids))

      // Every product in a routine belongs on the shelf: add any that's missing.
      const have = new Set(firstLoad.map(r => r.product_id))
      const missing = ids.filter(id => !have.has(id))
      if (__DEV__) console.log('[MyProducts] routine products:', ids.length, '| on shelf:', firstLoad.length, '| missing:', missing.length)
      let mine = firstLoad
      if (missing.length) {
        const products = await getProductsByIds(missing)
        await Promise.all(products.map(p => addToMyProducts(user.id, p, 'owned').catch(error => logError('ProductsScreen_sync', error, { id: p.id }, 'warn'))))
        mine = await getMyProducts(user.id)
      }
      setRows(mine)
    } catch (error) {
      await logError('ProductsScreen_load', error, {}, 'warn')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const inTab = rows.filter(r => r.status === tab)
  const categoryOf = r => r.product?.category || r.category || 'other'
  const available = useMemo(() => new Set(inTab.map(categoryOf)), [rows, tab])
  const shown = filter === 'all' ? inTab : inTab.filter(r => categoryOf(r) === filter)
  const counts = { owned: rows.filter(r => r.status === 'owned').length, to_buy: rows.filter(r => r.status === 'to_buy').length }

  const openActions = (row) => {
    const name = row.product?.name || row.product_name
    const move = row.status === 'owned'
      ? { text: t('Move to To buy'), onPress: () => update(row, 'to_buy') }
      : { text: t('I bought it'), onPress: () => update(row, 'owned') }
    const owned = row.status === 'owned' && row.product
    Alert.alert(name, null, [
      ...(owned && !row.opened_at ? [{ text: t('I opened it today'), onPress: () => openedToday(row) }] : []),
      ...(owned ? [{ text: t('Opening & expiry dates'), onPress: () => openLife(row) }] : []),
      ...(row.status === 'owned' ? [{ text: t('I used it up'), onPress: () => usedUp(row) }] : []),
      move,
      { text: t('Remove'), style: 'destructive', onPress: () => remove(row) },
      { text: t('Cancel'), style: 'cancel' },
    ])
  }

  // Finished to the last drop: counts for My Skin Journey, then she decides
  // whether it leaves her shelf.
  const usedUp = (row) => {
    trackFinished(user.id, row.id)
    Alert.alert(t('Not a drop wasted 🌿'), t('Remove it from your shelf?'), [
      { text: t('Keep it'), style: 'cancel' },
      { text: t('Remove'), style: 'destructive', onPress: () => remove(row) },
    ])
  }

  const openedToday = async (row) => {
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, opened_at: new Date().toISOString().slice(0, 10) } : r)))
    await setOpened(row.id).then(() => trackOpened(user.id, row.id)).catch(error => logError('ProductsScreen_opened', error, {}, 'warn'))
  }

  const openLife = (row) => {
    const life = shelfLife(row)
    setOpenedDraft(row.opened_at ? new Date(row.opened_at) : null)
    setPaoDraft(life.pao)
    setExpiryDraft(row.expires_at ? new Date(row.expires_at) : null)
    setLifeRow(row)
  }

  const shiftMonth = (date, n) => {
    const d = new Date(date || new Date())
    d.setMonth(d.getMonth() + n)
    return d
  }

  const saveLife = async () => {
    const row = lifeRow
    // A second tap on Save (the sheet is already closing) has nothing to save.
    if (!row) return
    setLifeRow(null)
    const iso = d => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : null)
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, opened_at: iso(openedDraft), expires_at: iso(expiryDraft), pao_months: paoDraft } : r)))
    try {
      if (openedDraft) { await setOpened(row.id, openedDraft); if (!row.opened_at) trackOpened(user.id, row.id) }
      await setExpiry(row.id, expiryDraft)
      await setPao(row.id, paoDraft)
    } catch (error) {
      await logError('ProductsScreen_saveLife', error, {}, 'warn')
      load()
    }
  }

  const update = async (row, status) => {
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, status } : r)))
    try {
      await setMyProductStatus(row.id, status)
    } catch (error) {
      await logError('ProductsScreen_status', error, {}, 'warn')
      load()
    }
  }

  const remove = async (row) => {
    setRows(prev => prev.filter(r => r.id !== row.id))
    try {
      await removeMyProduct(row.id)
    } catch (error) {
      await logError('ProductsScreen_remove', error, {}, 'warn')
      load()
    }
  }

  if (loading) return <LoadingView />

  return (
    <Screen
      back
      title={t('My products')}
      right={
        <Pressable onPress={() => navigation.navigate('Search')} hitSlop={10} accessibilityLabel={t('Add a product')}>
          <Ionicons name="add-circle" size={30} color={colors.primary} />
        </Pressable>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <SegmentedControl
        value={tab}
        onChange={value => { setTab(value); setFilter('all') }}
        options={[
          { value: 'owned', label: `${t('I own')} · ${counts.owned}` },
          { value: 'to_buy', label: `${t('To buy')} · ${counts.to_buy}` },
        ]}
      />

      {inTab.length ? (
        <View style={styles.filters}>
          {FILTERS.filter(f => f.value === 'all' || available.has(f.value)).map(f => {
            const on = filter === f.value
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[styles.filter, { backgroundColor: on ? colors.primarySoft : colors.card, borderColor: on ? colors.primary : colors.border }]}
              >
                <Text style={[TYPE.caption, { color: on ? colors.primary : colors.text, fontWeight: '600' }]}>{t(f.label)}</Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      {!inTab.length ? (
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Ionicons name={tab === 'owned' ? 'flask-outline' : 'bag-handle-outline'} size={34} color={colors.primary} />
          <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.md, textAlign: 'center' }]}>
            {tab === 'owned' ? t('Add the products you use') : t('Your To buy list is empty')}
          </Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
            {tab === 'owned'
              ? t('Scan or search them to see how well each one suits your skin.')
              : t("Products you'd like to try, or that Koda recommends, will land here.")}
          </Text>
          <View style={styles.emptyActions}>
            <Pressable onPress={() => navigation.navigate('Scanner')} style={[styles.emptyButton, { backgroundColor: colors.primary }]}>
              <Ionicons name="scan-outline" size={18} color={colors.onPrimary} />
              <Text style={{ color: colors.onPrimary, fontWeight: '600' }}>{t('Scan')}</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Search')} style={[styles.emptyButton, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="search" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('Search')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {shown.map(row => {
        const product = row.product
        return (
          <Pressable
            key={row.id}
            onPress={() => (product ? navigation.navigate('Product', { id: product.id }) : openActions(row))}
            onLongPress={() => openActions(row)}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <ProductThumb product={product} style={styles.photo} />
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.caption, { color: colors.textSecondary }]} numberOfLines={1}>{product?.brand || row.brand}</Text>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={2}>{product?.name || row.product_name}</Text>
              {product && inRoutine.has(product.id) ? (
                <View style={[styles.routineTag, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="water" size={11} color={colors.primary} />
                  <Text style={[styles.routineText, { color: colors.primary }]}>{t('In your routine')}</Text>
                </View>
              ) : null}
              {row.status === 'owned' ? (() => {
                const life = shelfLife(row)
                const tone = { expired: colors.danger, soon: colors.warning }[life.status] || colors.textSecondary
                const text = life.status === 'expired'
                  ? t('Expired: time to replace it')
                  : life.status === 'soon'
                    ? t('Replace soon: {n} days left', { n: life.daysLeft })
                    : life.status === 'ok'
                      ? `${life.openedMonths !== null ? `${t('Opened {n} mo ago', { n: life.openedMonths })} · ` : ''}${t('replace by {date}', { date: life.replaceBy.toLocaleDateString(language, { month: 'short', year: 'numeric' }) })}`
                      : t('Not opened yet')
                return (
                  <Pressable onPress={() => openLife(row)} style={styles.lifeTag} hitSlop={6}>
                    <Ionicons name={life.status === 'expired' ? 'alert-circle' : life.status === 'soon' ? 'time' : 'time-outline'} size={12} color={tone} />
                    <Text style={[styles.lifeText, { color: tone }]}>{text}</Text>
                  </Pressable>
                )
              })() : null}
              {product ? <ProductVerdict product={product} profile={profile} /> : null}
              {product && row.status === 'owned' ? (() => {
                const advice = stopAdvice.adviceFor(product, { life: shelfLife(row) })
                return <StopAdvice advice={advice} product={product} inRoutine={stopAdvice.inRoutine(product.id)} premium={stopAdvice.premium}
                  onStop={() => stopAdvice.stop(product)} onKeep={() => stopAdvice.keep(product, advice?.kind)} />
              })() : null}
            </View>
            {SHOP_LINKS_ENABLED && row.status === 'to_buy' && product ? (
              <Pressable
                onPress={() => navigation.navigate('Product', { id: product.id })}
                style={[styles.buyPill, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: colors.onPrimary, fontSize: 12, fontWeight: '700' }}>{t('Buy')}</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => openActions(row)} hitSlop={12} accessibilityLabel={t('More options')}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
            </Pressable>
          </Pressable>
        )
      })}
      <Modal visible={!!lifeRow} transparent animationType="fade" onRequestClose={() => setLifeRow(null)}>
        <BottomSheet title={t('Opening & expiry')} onClose={() => setLifeRow(null)}>
          <Text style={[TYPE.body, { color: colors.textSecondary }]} numberOfLines={2}>{lifeRow?.product?.name || lifeRow?.product_name}</Text>

          <Text style={[styles.sheetLabel, { color: colors.text }]}>{t('Opened')}</Text>
          <View style={styles.stepper}>
            <Pressable onPress={() => setOpenedDraft(d => shiftMonth(d, -1))} style={[styles.stepBtn, { borderColor: colors.border }]}><Ionicons name="chevron-back" size={16} color={colors.text} /></Pressable>
            <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1, textAlign: 'center', textTransform: 'capitalize' }]}>
              {openedDraft ? openedDraft.toLocaleDateString(language, { month: 'long', year: 'numeric' }) : t('Not opened yet')}
            </Text>
            <Pressable onPress={() => setOpenedDraft(d => { const x = shiftMonth(d, 1); return x > new Date() ? new Date() : x })} style={[styles.stepBtn, { borderColor: colors.border }]}><Ionicons name="chevron-forward" size={16} color={colors.text} /></Pressable>
          </View>
          <Pressable onPress={() => setOpenedDraft(new Date())} hitSlop={6} style={{ alignSelf: 'center', marginTop: 6 }}>
            <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('I opened it today')}</Text>
          </Pressable>

          <Text style={[styles.sheetLabel, { color: colors.text }]}>{t('Keeps after opening')}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('The open-jar symbol on the pack, like "12M".')}</Text>
          <View style={styles.paoRow}>
            {[3, 6, 9, 12, 18, 24].map(m => {
              const on = paoDraft === m
              return (
                <Pressable key={m} onPress={() => setPaoDraft(m)} style={[styles.paoChip, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.card }]}>
                  <Text style={{ color: on ? colors.primary : colors.text, fontWeight: '700', fontSize: 13 }}>{m}M</Text>
                </Pressable>
              )
            })}
          </View>

          <Text style={[styles.sheetLabel, { color: colors.text }]}>{t('Expiry date on the box (optional)')}</Text>
          <View style={styles.stepper}>
            <Pressable onPress={() => setExpiryDraft(d => shiftMonth(d, -1))} style={[styles.stepBtn, { borderColor: colors.border }]}><Ionicons name="chevron-back" size={16} color={colors.text} /></Pressable>
            <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1, textAlign: 'center', textTransform: 'capitalize' }]}>
              {expiryDraft ? expiryDraft.toLocaleDateString(language, { month: 'long', year: 'numeric' }) : t('Not set')}
            </Text>
            <Pressable onPress={() => setExpiryDraft(d => shiftMonth(d || shiftMonth(new Date(), 11), 1))} style={[styles.stepBtn, { borderColor: colors.border }]}><Ionicons name="chevron-forward" size={16} color={colors.text} /></Pressable>
          </View>
          {expiryDraft ? (
            <Pressable onPress={() => setExpiryDraft(null)} hitSlop={6} style={{ alignSelf: 'center', marginTop: 6 }}>
              <Text style={[TYPE.caption, { color: colors.textSecondary, fontWeight: '700' }]}>{t('Remove expiry date')}</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={saveLife} style={[styles.saveLife, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.onPrimary, fontWeight: '600' }}>{t('Save')}</Text>
          </Pressable>
        </BottomSheet>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  filter: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, marginTop: SPACING.sm },
  photo: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#FFFFFF' },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  lifeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  lifeText: { fontSize: 11, fontWeight: '600' },
  sheetLabel: { fontSize: 15, fontWeight: '700', marginTop: SPACING.xl },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm },
  stepBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  paoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  paoChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  saveLife: { height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xl },
  buyPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  routineTag: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  routineText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: RADIUS.lg, padding: SPACING.xl, marginTop: SPACING.xl },
  emptyActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
})
