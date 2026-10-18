import React, { useEffect, useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, EmptyState, useColors } from '../components/ui'
import MatchBadge from '../components/MatchBadge'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { productsWithIngredient } from '../utils/catalog'
import { getIngredient, ingredientFit, productMatch, badgeText, isUnsuitable } from '../utils/ingredients-guide'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// An ingredient: whether it suits the user, what it does, and products with it.
export default function IngredientScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const entry = getIngredient(route?.params?.id)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!entry) return
    setLoading(true)
    productsWithIngredient(entry)
      .then(setProducts)
      .catch(error => logError('IngredientScreen_products', error, { id: entry.id }, 'warn'))
      .finally(() => setLoading(false))
  }, [entry?.id])

  if (!entry) return <Screen back><EmptyState icon="alert-circle-outline" title={t('Ingredient not found')} /></Screen>

  const fit = ingredientFit(entry, profile)
  const why = fit.warns.length
    ? `${t(fit.warns[0])}.`
    : fit.helps.length
      ? t('Good for your {list}.', { list: fit.helps.map(h => t(h).toLowerCase()).join(', ') })
      : null

  return (
    <Screen back>
      <Text style={[styles.name, { color: colors.text }]}>{t(entry.name)}</Text>
      <View style={{ marginTop: SPACING.sm }}>
        <MatchBadge tone={fit.tone} label={t(fit.label)} size="lg" />
      </View>
      {why ? <Text style={[TYPE.body, { color: colors.textSecondary, marginTop: SPACING.sm }]}>{why}</Text> : null}

      <Text style={[styles.section, { color: colors.muted }]}>{t('WHAT IT DOES')}</Text>
      <Text style={[TYPE.body, { color: colors.text }]}>{t(entry.what)}</Text>

      {entry.goodFor.length ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('GOOD FOR')}</Text>
          <View style={styles.chips}>
            {entry.goodFor.map(g => (
              <View key={g} style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
                <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '600' }]}>{t(g)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={[styles.section, { color: colors.muted }]}>{t('PRODUCTS WITH IT')}</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {!loading && !products.length ? <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('No products found yet.')}</Text> : null}
      {products
        .map(product => ({ product, match: productMatch(product, profile) }))
        .sort((a, b) => Number(isUnsuitable(a.match)) - Number(isUnsuitable(b.match)) || b.match.score - a.match.score)
        .map(({ product, match }) => {
        return (
          <Pressable
            key={product.id}
            onPress={() => navigation.navigate('Product', { id: product.id })}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {product.image_url ? (
              <Image source={{ uri: product.image_url }} style={styles.photo} resizeMode="contain" />
            ) : (
              <View style={[styles.photo, styles.noPhoto, { backgroundColor: colors.surface }]}>
                <Ionicons name="water-outline" size={18} color={colors.muted} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.caption, { color: colors.textSecondary }]} numberOfLines={1}>{product.brand}</Text>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={2}>{product.name}</Text>
            </View>
            <MatchBadge tone={match.tone} label={t(badgeText(match))} />
          </Pressable>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  name: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, marginBottom: SPACING.sm },
  photo: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#FFFFFF' },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
})
