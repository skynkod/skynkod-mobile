import React, { useEffect, useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, LoadingView, EmptyState, useColors } from '../components/ui'
import MatchBadge from '../components/MatchBadge'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { getProduct, addToMyProducts } from '../utils/catalog'
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
  const [added, setAdded] = useState(false)

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
  const confirmAdd = () => {
    if (!match.avoid.length) return add()
    const first = match.avoid[0]
    Alert.alert(t('Not recommended for you'), `${t(first.text)}.\n\n${t(first.detail || '')}`, [
      { text: t('Add anyway'), style: 'destructive', onPress: add },
      { text: t("Don't add"), style: 'cancel' },
    ])
  }

  const add = async () => {
    setAdding(true)
    try {
      await addToMyProducts(user.id, product)
      setAdded(true)
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
        </View>
      </View>

      <View style={[styles.matchCard, { backgroundColor: { danger: colors.dangerSoft, warning: colors.warningSoft, neutral: colors.surface }[match.tone] || colors.successSoft }]}>
        <View style={styles.matchHead}>
          <Text style={[styles.matchScore, { color: { danger: colors.danger, warning: colors.warning, neutral: colors.textSecondary }[match.tone] || colors.success }]}>{match.score}%</Text>
          <View style={{ flex: 1 }}>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(match.label)}</Text>
            <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {profile?.skin_type ? t('Compared with your skin profile') : t('Add your skin type for a personal match')}
            </Text>
          </View>
        </View>
        {[...match.good.map(g => ({ ...g, ok: true })), ...match.care.map(c => ({ ...c, ok: false }))].map((r, idx) => (
          <View key={idx} style={styles.reason}>
            <Ionicons name={r.ok ? 'checkmark-circle' : 'alert-circle'} size={16} color={r.ok ? colors.success : match.avoid.length ? colors.danger : colors.warning} />
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

      <Pressable
        onPress={confirmAdd}
        disabled={adding || added}
        style={({ pressed }) => [styles.addButton, { backgroundColor: colors.accent, opacity: added ? 0.6 : pressed ? 0.85 : 1 }]}
      >
        <Ionicons name={added ? 'checkmark' : 'add'} size={20} color="#FFFFFF" />
        <Text style={styles.addText}>{added ? t('Added to my products') : adding ? t('Adding…') : t('Add to my products')}</Text>
      </Pressable>
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
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.xl, marginBottom: SPACING.xs },
  ingredient: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, height: 52, borderRadius: RADIUS.md, marginTop: SPACING.xl, marginBottom: SPACING.md },
  addText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
})
