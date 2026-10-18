import React, { useCallback, useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Image, Alert, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, LoadingView, SegmentedControl, useColors } from '../components/ui'
import ProductVerdict from '../components/ProductVerdict'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { getMyProducts, setMyProductStatus, removeMyProduct, getProductsByIds, addToMyProducts } from '../utils/catalog'
import { getUserRoutines } from '../utils/routines-service'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// Filter chips, in routine order; only categories the user has are shown.
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'cleanser', label: 'Cleansers' },
  { value: 'toner', label: 'Toners' },
  { value: 'serum', label: 'Serums' },
  { value: 'eye care', label: 'Eye care' },
  { value: 'moisturizer', label: 'Moisturizers' },
  { value: 'sunscreen', label: 'SPF' },
  { value: 'exfoliant', label: 'Exfoliants' },
  { value: 'mask', label: 'Masks' },
  { value: 'other', label: 'Other' },
]

// The user's shelf ("I own") and wishlist ("To buy"), with how well each
// product suits their skin and whether it's already in a routine.
export default function ProductsScreen({ navigation }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const [rows, setRows] = useState([])
  const [inRoutine, setInRoutine] = useState(new Set())
  const [tab, setTab] = useState('owned')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      const [firstLoad, routines] = await Promise.all([getMyProducts(user.id), getUserRoutines(user.id)])
      const ids = [...new Set((routines.success ? routines.data : []).flatMap(r => (r.steps || []).map(s => s.product_id)).filter(Boolean))]
      setInRoutine(new Set(ids))

      // Every product in a routine belongs on the shelf: add any that's missing.
      const have = new Set(firstLoad.map(r => r.product_id))
      const missing = ids.filter(id => !have.has(id))
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
    Alert.alert(name, null, [
      move,
      { text: t('Remove'), style: 'destructive', onPress: () => remove(row) },
      { text: t('Cancel'), style: 'cancel' },
    ])
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
            {product?.image_url ? (
              <Image source={{ uri: product.image_url }} style={styles.photo} resizeMode="contain" />
            ) : (
              <View style={[styles.photo, styles.noPhoto, { backgroundColor: colors.surface }]}>
                <Ionicons name="water-outline" size={20} color={colors.muted} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.caption, { color: colors.textSecondary }]} numberOfLines={1}>{product?.brand || row.brand}</Text>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={2}>{product?.name || row.product_name}</Text>
              {product && inRoutine.has(product.id) ? (
                <View style={[styles.routineTag, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="water" size={11} color={colors.primary} />
                  <Text style={[styles.routineText, { color: colors.primary }]}>{t('In your routine')}</Text>
                </View>
              ) : null}
              {product ? <ProductVerdict product={product} profile={profile} /> : null}
            </View>
            <Pressable onPress={() => openActions(row)} hitSlop={12} accessibilityLabel={t('More options')}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} />
            </Pressable>
          </Pressable>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  filter: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, marginTop: SPACING.sm },
  photo: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#FFFFFF' },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  routineTag: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  routineText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: RADIUS.lg, padding: SPACING.xl, marginTop: SPACING.xl },
  emptyActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  emptyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
})
