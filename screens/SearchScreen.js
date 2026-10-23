import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Button, useColors } from '../components/ui'
import { usePremium, UnlockButton } from '../components/PremiumLock'
import MatchBadge from '../components/MatchBadge'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { searchProducts, linkBarcode } from '../utils/catalog'
import ProductThumb from '../components/ProductThumb'
import { requestProduct } from '../utils/community-data'
import { track } from '../utils/analytics'
import { searchIngredients, ingredientFit, productMatch, badgeText, badgeTone, isUnsuitable } from '../utils/ingredients-guide'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// What each product is, in plain English, next to names that may be in French.
const CATEGORY_LABEL = { cleanser: 'Cleanser', toner: 'Toner', serum: 'Serum', moisturizer: 'Moisturizer', sunscreen: 'Sunscreen', exfoliant: 'Exfoliant', mask: 'Mask', 'eye care': 'Eye care' }
const POPULAR = ['Niacinamide', 'Retinol', 'Vitamin C', 'Hyaluronic acid', 'Centella', 'Salicylic acid']

// One search box for products and ingredients; each result shows how well it
// suits the user's skin. Scanning is one tap away.
export default function SearchScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const premium = usePremium()
  const [query, setQuery] = useState(route?.params?.query || '')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)
  // Coming from an unknown scan: picking a product attaches the barcode to it.
  const pendingBarcode = route?.params?.linkBarcode || null

  // A new search from the scanner replaces what was typed before.
  useEffect(() => {
    if (route?.params?.query !== undefined) setQuery(route.params.query)
  }, [route?.params?.query, route?.params?.linkBarcode])

  const openProduct = (product) => {
    if (!pendingBarcode) return navigation.navigate('Product', { id: product.id })
    Alert.alert(t('Is this your product?'), `${product.brand} · ${product.name}`, [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Yes, link it'),
        onPress: async () => {
          const result = await linkBarcode(pendingBarcode, product.id)
          navigation.setParams({ linkBarcode: undefined })
          if (result.error && result.error !== 'barcode_taken') {
            Alert.alert(t('Error'), t("Couldn't save this barcode. Try again."))
            return
          }
          navigation.navigate('Product', { id: product.id })
        },
      },
    ])
  }

  const ingredients = searchIngredients(query).slice(0, 3)

  // Searches 300 ms after the user stops typing; ignores stale answers.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setProducts([])
      return
    }
    const id = ++requestId.current
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const rows = await searchProducts(q)
        if (id === requestId.current) setProducts(rows)
        // Nothing found for a real-looking name: note it as a wanted product.
        if (!rows.length && q.length >= 4 && !searchIngredients(q).length) {
          requestProduct('name', q).catch(() => {})
          track('search_no_result', { q: q.slice(0, 60) })
        }
      } catch (error) {
        await logError('SearchScreen_search', error, { q }, 'warn')
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const hasQuery = query.trim().length >= 2

  // Searching without the product in hand is Premium, like Yuka; scanning stays
  // free, and so does finding a product to teach the scanner an unknown barcode.
  if (premium === false && !pendingBarcode) {
    return (
      <Screen back>
        <View style={styles.locked}>
          <View style={[styles.lockIcon, { backgroundColor: colors.primarySoft }]}><Ionicons name="search" size={28} color={colors.primary} /></View>
          <Text style={[TYPE.overline, { color: colors.primary, marginTop: SPACING.lg }]}>{t('PREMIUM')}</Text>
          <Text style={[TYPE.title, { color: colors.text, textAlign: 'center', marginTop: SPACING.xs }]}>{t('Search any product or ingredient')}</Text>
          <Text style={[TYPE.body, { color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 22 }]}>
            {t('Check a product before you buy it, or learn what an ingredient does, without needing the bottle in your hands.')}
          </Text>
          <UnlockButton style={{ marginTop: SPACING.xl, alignSelf: 'stretch' }} />
          <Button title={t('Scan a product, it’s free')} icon="scan-outline" variant="secondary" onPress={() => navigation.navigate('Scanner')} style={{ marginTop: SPACING.sm, alignSelf: 'stretch' }} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen back keyboard>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('Search a product or ingredient')}
          placeholderTextColor={colors.muted}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: colors.text }]}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel={t('Clear')}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
        <Pressable onPress={() => navigation.navigate('Scanner')} hitSlop={10} accessibilityLabel={t('Scan a product')}>
          <Ionicons name="scan-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {pendingBarcode ? (
        <View style={[styles.linkBanner, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="barcode-outline" size={18} color={colors.primary} />
          <Text style={[TYPE.caption, { color: colors.text, flex: 1 }]}>{t('Tap your product to teach the scanner its barcode.')}</Text>
        </View>
      ) : null}

      {!hasQuery ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('POPULAR INGREDIENTS')}</Text>
          <View style={styles.chips}>
            {POPULAR.map(p => (
              <Pressable key={p} onPress={() => setQuery(p)} style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[TYPE.caption, { color: colors.text, fontWeight: '600' }]}>{t(p)}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => navigation.navigate('Scanner')} style={[styles.scanCard, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="barcode-outline" size={28} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Scan a product')}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t('Point your camera at the barcode')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        </>
      ) : null}

      {hasQuery && ingredients.length ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('INGREDIENTS')}</Text>
          {ingredients.map(entry => {
            const fit = ingredientFit(entry, profile)
            return (
              <Pressable
                key={entry.id}
                onPress={() => navigation.navigate('Ingredient', { id: entry.id })}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.thumb, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="flask-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(entry.name)}</Text>
                  <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>{t(entry.what)}</Text>
                </View>
                <MatchBadge tone={fit.tone} label={t(fit.label)} />
              </Pressable>
            )
          })}
        </>
      ) : null}

      {hasQuery ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('PRODUCTS')}</Text>
          {loading && !products.length ? <ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.lg }} /> : null}
          {!loading && !products.length ? (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Text style={[TYPE.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                {t("We couldn't find this product yet. Try scanning its barcode.")}
              </Text>
            </View>
          ) : null}
          {products
            .map(product => ({ product, match: productMatch(product, profile) }))
            .sort((a, b) => Number(isUnsuitable(a.match)) - Number(isUnsuitable(b.match)))
            .map(({ product, match }) => {
            return (
              <Pressable
                key={product.id}
                onPress={() => openProduct(product)}
                style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <ProductThumb product={product} style={styles.photo} />
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.caption, { color: colors.textSecondary }]} numberOfLines={1}>{product.brand}{product.category ? ` · ${t(CATEGORY_LABEL[product.category] || product.category)}` : ''}</Text>
                  <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={2}>{product.name}</Text>
                </View>
                <MatchBadge tone={badgeTone(match)} label={t(badgeText(match))} />
              </Pressable>
            )
          })}
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  locked: { alignItems: 'center', paddingTop: SPACING.xxl, paddingHorizontal: SPACING.md },
  lockIcon: { width: 72, height: 72, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, height: 50, borderRadius: 999, borderWidth: 1, paddingHorizontal: SPACING.lg },
  input: { flex: 1, fontSize: 16, height: '100%' },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  scanCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, marginBottom: SPACING.sm },
  thumb: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  photo: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#FFFFFF' },
  linkBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: RADIUS.md, padding: SPACING.xl },
})
