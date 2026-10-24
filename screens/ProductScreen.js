import React, { useEffect, useState } from 'react'
import { trackProductPage, trackBuyCheck } from '../utils/journey'
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, LoadingView, EmptyState, useColors } from '../components/ui'
import { usePremium, PremiumBlur } from '../components/PremiumLock'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import StopAdvice, { useStopAdvice } from '../components/StopAdvice'
import BuyAdvice from '../components/BuyAdvice'
import AskKodaLink from '../components/AskKodaLink'
import { buyVerdict } from '../utils/buy-advice'
import { getProduct, addToMyProducts, myProductStatus, getMyProducts } from '../utils/catalog'
import ProductThumb from '../components/ProductThumb'
import { CONCERN_CONDITIONS } from '../utils/encyclopedia/conditions'
import { retailersFor, openRetailer, SHOP_LINKS_ENABLED } from '../utils/shop'
import { getPriceStats } from '../utils/community-data'
import { formatMAD } from '../utils/skynbudget'
import { productMatch, getIngredient } from '../utils/ingredients-guide'
import { logError } from '../utils/errorLogger'
import { safeAlternativeFor } from '../utils/rekod'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// A product: its match with the user's skin first, the why underneath, then
// key ingredients. The full INCI list stays folded away.
export default function ProductScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const stopAdvice = useStopAdvice(user?.id, profile)
  // Free: the verdict and every safety warning. Premium: what each ingredient
  // does, and the better alternatives.
  const premium = usePremium()
  const lockedDetail = premium === false
  const [product, setProduct] = useState(route?.params?.product || null)
  const [loading, setLoading] = useState(!product)
  const [showAll, setShowAll] = useState(false)
  const [adding, setAdding] = useState(false)
  const [status, setStatus] = useState(null) // null | 'owned' | 'to_buy'
  // What she owns, for "Should I buy this?"
  const [owned, setOwned] = useState(null)
  const [prices, setPrices] = useState(null)
  const [alt, setAlt] = useState(null) // { safe, alternative } for her skin
  // Product details studied count once for My Skin Journey.
  useEffect(() => { if (user?.id && product?.id) trackProductPage(user.id, product.id) }, [user?.id, product?.id])
  // Smart Shopper: "Should I buy this?" seen on a product she doesn't own.
  useEffect(() => { if (user?.id && product?.id && owned && !owned.some(p => p.id === product.id)) trackBuyCheck(user.id, String(product.id)) }, [user?.id, product?.id, owned])
  useEffect(() => {
    if (!user?.id || !product?.id) return
    setAlt(null)
    safeAlternativeFor(user.id, product).then(setAlt).catch(() => setAlt(null))
  }, [user?.id, product?.id])
  useEffect(() => {
    if (!product?.id) return
    getPriceStats(product.id).then(setPrices).catch(() => setPrices(null))
  }, [product?.id])

  // Is it already on the user's shelf or wishlist?
  useEffect(() => {
    if (!user?.id || !product?.id) return
    myProductStatus(user.id, product.id).then(setStatus).catch(() => {})
    getMyProducts(user.id).then(rows => setOwned(rows.filter(r => r.status === 'owned' && r.product).map(r => r.product))).catch(() => setOwned([]))
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
        <ProductThumb product={product} style={styles.image} />
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

      {/* Her skin today can make a good product wait: "not right for you right now", with the why */}
      {match.notNow && match.tone !== 'danger' ? (
        <View style={[styles.matchCard, { backgroundColor: colors.warningSoft, marginBottom: SPACING.md }]}>
          <View style={styles.matchHead}>
            <Ionicons name="time-outline" size={36} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(match.notNow.title)}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>{t(match.notNow.text)}.</Text>
            </View>
          </View>
          <Text style={[TYPE.caption, { color: colors.text, lineHeight: 18, marginTop: SPACING.sm }]}>
            <Text style={{ fontWeight: '700' }}>{t('Why?')} </Text>{t(match.notNow.detail)}
          </Text>
        </View>
      ) : null}

      {/* Not hers yet: is it worth buying, given her skin and what she owns? */}
      {product && owned && status !== 'owned' ? (
        <BuyAdvice verdict={buyVerdict({ product, profile, owned })} premium={stopAdvice.premium} />
      ) : null}

      {/* In her routine but worth stopping: the one most important reason */}
      {product && stopAdvice.inRoutine(product.id) ? (
        <StopAdvice advice={stopAdvice.adviceFor(product)} product={product} inRoutine premium={stopAdvice.premium}
          onStop={() => stopAdvice.stop(product)} onKeep={() => stopAdvice.keep(product, stopAdvice.adviceFor(product)?.kind)} style={{ marginTop: 0, marginBottom: SPACING.md }} />
      ) : null}

      {product ? (
        <AskKodaLink label="Ask Koda about this product" returnTo="Product" style={{ marginBottom: SPACING.md }}
          prefill={t('Should I use {product} with my routine? How and when?', { product: product.name })} />
      ) : null}

      {/* Her main concern: what skincare can and can't do for it, and the treatments */}
      {profile?.priority && CONCERN_CONDITIONS[profile.priority] ? (
        <Pressable onPress={() => navigation.navigate('Condition', { id: CONCERN_CONDITIONS[profile.priority][0] })} style={{ marginBottom: SPACING.md }} hitSlop={4}>
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700' }]}>{t('What skincare can and can’t do for your {concern}', { concern: t(profile.priority).toLowerCase() })} ›</Text>
        </Pressable>
      ) : null}

      {/* No full ingredient list: say it plainly instead of a score we can't stand behind */}
      {match.partial && !['danger', 'warning'].includes(match.tone) ? (
        <View style={[styles.matchCard, { backgroundColor: colors.surface }]}>
          <View style={styles.matchHead}>
            <Ionicons name="help-circle" size={40} color={colors.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t('Not checked yet')}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
                {t('We don’t have this product’s full ingredient list yet, so we can’t check it against your skin.')}
              </Text>
            </View>
          </View>
        </View>
      ) : (
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
            {t('Based on its key ingredients only: we don’t have the full list yet.')}
          </Text>
        ) : null}
      </View>
      )}

      {/* Not 100% safe for her: the closest product that is */}
      {alt && !alt.safe && alt.alternative && lockedDetail ? (
        <PremiumBlur locked title="A better product for your skin" text="Premium shows the closest product that is 100% safe for you." style={{ marginTop: SPACING.lg, minHeight: 150 }}>
          <View style={[styles.altCard, { backgroundColor: '#33202E', marginTop: 0 }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#A8E2BC" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#E2C6DA', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>{t('100% SAFE FOR YOUR SKIN')}</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginTop: 2 }}>{alt.alternative.brand} {alt.alternative.name}</Text>
            </View>
          </View>
        </PremiumBlur>
      ) : alt && !alt.safe ? (
        alt.alternative ? (
          <Pressable onPress={() => navigation.navigate('Product', { id: alt.alternative.id, product: undefined })} style={[styles.altCard, { backgroundColor: '#33202E' }]}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#A8E2BC" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#E2C6DA', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>{t('100% SAFE FOR YOUR SKIN')}</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginTop: 2 }}>{alt.alternative.brand} {alt.alternative.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 }}>{alt.active ? t('Also with {active}, without the ingredients that bother your skin.', { active: alt.active.toLowerCase() }) : t('A similar product without the ingredients that bother your skin.')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#E2C6DA" />
          </Pressable>
        ) : (
          <View style={[styles.altCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="search-outline" size={20} color={colors.muted} />
            <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1 }]}>{alt.active ? t("We couldn't find another product with {active} that is 100% safe for your skin yet.", { active: alt.active.toLowerCase() }) : t("We couldn't find a similar product that is 100% safe for your skin in our catalogue yet.")}</Text>
          </View>
        )
      ) : null}

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
              {a.alternatives.length && lockedDetail ? (
                <Text style={[TYPE.caption, { color: colors.text, fontWeight: '700', marginTop: SPACING.md }]} onPress={() => navigation.navigate('Premium')}>
                  {t('Safer alternatives')} · <Text style={{ color: '#33202E' }}>{t('with Premium')} ◆</Text>
                </Text>
              ) : a.alternatives.length ? (
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

      {match.found.length && lockedDetail ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('KEY INGREDIENTS')}</Text>
          <PremiumBlur locked title="Every ingredient explained" text="What each ingredient of this product does for your skin.">
            {match.found.slice(0, 3).map(entry => (
              <View key={entry.id} style={[styles.ingredient, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(entry.name)}</Text>
                  <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={2}>{t(entry.what)}</Text>
                </View>
              </View>
            ))}
          </PremiumBlur>
        </>
      ) : match.found.length ? (
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
  altCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: 20, padding: SPACING.lg, marginTop: SPACING.md },
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
