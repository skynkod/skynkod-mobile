import React, { useEffect, useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, LoadingView, EmptyState, useColors } from '../components/ui'
import MatchBadge from '../components/MatchBadge'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { getProduct, addToMyProducts, myProductStatus } from '../utils/catalog'
import { retailersFor, openRetailer, SHOP_LINKS_ENABLED } from '../utils/shop'
import { getPriceStats } from '../utils/community-data'
import { formatMAD } from '../utils/skynbudget'
import { productMatch, getIngredient } from '../utils/ingredients-guide'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// A product: its match with the user's skin first, the why underneath, then
// key ingredients. The full INCI list stays folded away.
export default function ProductScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const [product, setProduct] = useState(route?.params?.product || null)
  const [loading, setLoading] = useState(!product)
  const [showAll, setShowAll] = useState(false)
  const [adding, setAdding] = useState(false)
  const [status, setStatus] = useState(null) // null | 'owned' | 'to_buy'
  const [prices, setPrices] = useState(null)
  useEffect(() => {
    if (!product?.id) return
    getPriceStats(product.id).then(setPrices).catch(() => setPrices(null))
  }, [product?.id])

  // Is it already on the user's shelf or wishlist?
  useEffect(() => {
    if (!user?.id || !product?.id) return
    myProductStatus(user.id, product.id).then(setStatus).catch(() => {})
  }, [user?.id, product?.id])

  useEffect(() => {
    const id = route?.params?.id
    if (!id || route?.params?.product) return
    setLoading(true)
    getProduct(id)
      .then(setProduct)
      .catch(error => logError('ProductScreen_load', error, { id }, 'warn'))
      .finally(() => setLoading(false))
  }, [route?.params?.id])

  if (loading) return <LoadingView />
  if (!product) return <Screen back><EmptyState icon="alert-circle-outline" title={t('Product not found')} /></Screen>

  const match = productMatch(product, profile)

  // Adding a product the user should avoid needs a clear, explained warning.
  const confirmAdd = (nextStatus) => {
    if (!match.avoid.length && !match.triggered.length) return add(nextStatus)
    const first = match.avoid[0] || match.triggered[0]
    Alert.alert(match.avoid.length ? t('Not recommended for you') : t('Not for your skin'), `${t(first.text)}.${first.detail ? `\n\n${t(first.detail)}` : ''}`, [
      { text: t('Add anyway'), style: 'destructive', onPress: () => add(nextStatus) },
      { text: t("Don't add"), style: 'cancel' },
    ])
  }

  const add = async (nextStatus) => {
    setAdding(true)
    try {
      await addToMyProducts(user.id, product, nextStatus)
      setStatus(nextStatus)
    } catch (error) {
      await logError('ProductScreen_add', error, { id: product.id }, 'warn')
      Alert.alert(t('Error'), t("Couldn't add this product. Try again."))
    } finally {
      setAdding(false)
    }
  }

  return (
    <Screen back>
      <View style={styles.hero}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="contain" />
        ) : (
          <View style={[styles.image, styles.noImage, { backgroundColor: colors.surface }]}>
            <Ionicons name="water-outline" size={36} color={colors.muted} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{product.brand}</Text>
          <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>
          <Text style={[TYPE.caption, { color: colors.muted, marginTop: 4, textTransform: 'capitalize' }]}>{t(product.category)}</Text>
          {prices ? (
            <Text style={[TYPE.caption, { color: colors.text, marginTop: 6 }]}>
              <Text style={{ fontWeight: '700' }}>~{formatMAD(prices.typical)}</Text>
              <Text style={{ color: colors.textSecondary }}> {t('in Morocco')} · {t('{n} purchases', { n: prices.purchases })}{prices.top_store ? ` · ${t('often at {store}', { store: t(prices.top_store) })}` : ''}</Text>
            </Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.matchCard, { backgroundColor: { danger: colors.dangerSoft, warning: colors.warningSoft, watch: colors.cautionSoft, neutral: colors.surface }[match.tone] || colors.successSoft }]}>
        <View style={styles.matchHead}>
          {match.tone === 'success' ? (
            <Text style={[styles.matchScore, { color: colors.success }]}>{match.score}%</Text>
          ) : (
            <Ionicons
              name={{ danger: 'close-circle', warning: 'flask', watch: 'eye' }[match.tone] || 'help-circle'}
              size={40}
              color={{ danger: colors.danger, warning: colors.warning, watch: colors.caution }[match.tone] || colors.muted}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(match.label)}</Text>
            <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {profile?.skin_type ? t('Compared with your skin profile') : t('Add your skin type for a personal match')}
            </Text>
          </View>
        </View>
        {match.good.map((r, idx) => (
          <View key={`g${idx}`} style={styles.reason}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[TYPE.caption, { color: colors.text, flex: 1 }]}>{t(r.text)}</Text>
          </View>
        ))}
        {match.unverified.map((r, idx) => (
          <View key={`u${idx}`} style={styles.reason}>
            <Ionicons name="help-circle" size={16} color={colors.muted} />
            <Text style={[TYPE.caption, { color: colors.text, flex: 1 }]}>{t(r.text)}</Text>
          </View>
        ))}
        {match.partial ? (
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm }]}>
            {t('Based on key ingredients. The full list is coming soon.')}
          </Text>
        ) : null}
      </View>

      {match.avoid.length ? (
        <View style={[styles.avoidCard, { backgroundColor: colors.dangerSoft }]}>
          <View style={styles.avoidHead}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
            <Text style={[TYPE.bodyStrong, { color: colors.danger }]}>{t('Why we say avoid')}</Text>
          </View>
          {match.avoid.map((a, idx) => (
            <View key={idx} style={{ marginTop: SPACING.sm }}>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(a.text)}</Text>
              {a.detail ? <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>{t(a.detail)}</Text> : null}
              {a.alternatives.length ? (
                <>
                  <Text style={[TYPE.caption, { color: colors.text, fontWeight: '700', marginTop: SPACING.md }]}>{t('Safer alternatives')}</Text>
                  <View style={styles.altRow}>
                    {a.alternatives.map(id => (
                      <Pressable
                        key={id}
                        onPress={() => navigation.navigate('Ingredient', { id })}
                        style={[styles.altChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                      >
                        <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t(getIngredient(id)?.name || id)}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {match.triggers.length ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('INGREDIENTS TO KNOW')}</Text>
          {match.triggers.map((tr, idx) => {
            const lv = {
              avoid: { label: 'Avoid', bg: colors.dangerSoft, fg: colors.danger, icon: 'close-circle' },
              patch: { label: 'Patch test first', bg: colors.warningSoft, fg: colors.warning, icon: 'flask' },
              watch: { label: 'Keep an eye', bg: colors.cautionSoft, fg: colors.caution, icon: 'eye' },
            }[tr.level]
            return (
              <View key={idx} style={[styles.triggerCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <View style={[styles.levelChip, { backgroundColor: lv.bg }]}>
                  <Ionicons name={lv.icon} size={13} color={lv.fg} />
                  <Text style={[styles.levelText, { color: lv.fg }]}>{t(lv.label)}</Text>
                </View>
                <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.sm }]}>{t(tr.text)}</Text>
                <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>{t(tr.detail)}</Text>
                {tr.about ? (
                  <Text style={[TYPE.caption, { color: colors.muted, marginTop: 6, lineHeight: 17 }]}>{t('What it is:')} {t(tr.about)}</Text>
                ) : null}
              </View>
            )
          })}
        </>
      ) : null}

      {match.found.length ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('KEY INGREDIENTS')}</Text>
          {match.found.map(entry => (
            <Pressable
              key={entry.id}
              onPress={() => navigation.navigate('Ingredient', { id: entry.id })}
              style={[styles.ingredient, { borderBottomColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(entry.name)}</Text>
                <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={2}>{t(entry.what)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          ))}
        </>
      ) : null}

      {product.ingredients_text ? (
        <Pressable onPress={() => setShowAll(!showAll)} style={{ marginTop: SPACING.lg }}>
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>
            {showAll ? t('Hide full ingredient list') : t('See full ingredient list')}
          </Text>
          {showAll ? <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm, lineHeight: 18 }]}>{product.ingredients_text}</Text> : null}
        </Pressable>
      ) : null}

      {status === 'owned' ? (
        <Pressable onPress={() => navigation.navigate('Products')} style={[styles.statusBar, { backgroundColor: colors.successSoft }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[TYPE.bodyStrong, { color: colors.success, flex: 1 }]}>{t('In my products')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.success} />
        </Pressable>
      ) : (
        <>
          {status === 'to_buy' ? (
            <View style={[styles.statusBar, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="bag-handle" size={18} color={colors.primary} />
              <Text style={[TYPE.bodyStrong, { color: colors.primary, flex: 1 }]}>{t('In your To buy list')}</Text>
            </View>
          ) : null}
          <Pressable
            onPress={() => confirmAdd('owned')}
            disabled={adding}
            style={({ pressed }) => [styles.addButton, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.addText}>{adding ? t('Adding…') : status === 'to_buy' ? t('I bought it') : t('I have it')}</Text>
          </Pressable>
          {status !== 'to_buy' ? (
            <Pressable
              onPress={() => confirmAdd('to_buy')}
              disabled={adding}
              style={({ pressed }) => [styles.secondaryButton, { backgroundColor: colors.primarySoft, opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="bag-add-outline" size={20} color={colors.primary} />
              <Text style={[styles.addText, { color: colors.primary }]}>{t('Add to To buy')}</Text>
            </Pressable>
          ) : null}
        </>
      )}
      {/* Where to buy: never shown for products the user should avoid */}
      {SHOP_LINKS_ENABLED && !match.avoid.length && !match.triggered.length ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('WHERE TO BUY')}</Text>
          <View style={styles.shops}>
            {retailersFor(product).map(r => (
              <Pressable
                key={r.id}
                onPress={() => openRetailer(r, product)}
                style={({ pressed }) => [styles.shop, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={[TYPE.caption, { color: colors.text, fontWeight: '700' }]}>{r.name}</Text>
                <Ionicons name="open-outline" size={13} color={colors.muted} />
              </Pressable>
            ))}
          </View>
          <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm, lineHeight: 17 }]}>
            {t('Skynkod may earn a small commission when you buy through these links. It never changes our verdicts.')}
          </Text>
        </>
      ) : null}

      <View style={{ height: SPACING.lg }} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: SPACING.lg, alignItems: 'center' },
  image: { width: 96, height: 96, borderRadius: RADIUS.md, backgroundColor: '#FFFFFF' },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginTop: 2 },
  matchCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.xl, gap: SPACING.sm },
  matchHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: 4 },
  matchScore: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  reason: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  avoidCard: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.md },
  avoidHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  altRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm },
  altChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  triggerCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.sm },
  levelChip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  levelText: { fontSize: 11, fontWeight: '700' },
  shops: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  shop: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.xl, marginBottom: SPACING.xs },
  ingredient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, height: 52, borderRadius: RADIUS.md, marginTop: SPACING.md },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, height: 52, borderRadius: RADIUS.md, marginTop: SPACING.sm },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.lg, marginTop: SPACING.xl },
  addText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})
