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
import { HOWTO, PREGNANCY } from '../utils/encyclopedia/howto'
import { ARTICLES } from '../utils/encyclopedia'
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
  const howto = HOWTO[entry.id]
  const articles = ARTICLES.filter(a => a.ingredients?.includes(entry.id)).slice(0, 3)
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

      {howto ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('HOW TO USE')}</Text>
          <View style={[styles.howBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              ['time-outline', 'When', howto.when],
              ['speedometer-outline', 'Strength', howto.strength],
              ['repeat-outline', 'How often', howto.often],
            ].filter(r => r[2]).map(([icon, label, value]) => (
              <View key={label} style={styles.howRow}>
                <Ionicons name={icon} size={16} color={colors.primary} />
                <Text style={[TYPE.caption, { color: colors.textSecondary, width: 78 }]}>{t(label)}</Text>
                <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(value)}</Text>
              </View>
            ))}
            {howto.how ? <Text style={[TYPE.body, { color: colors.text, marginTop: SPACING.xs }]}>{t(howto.how)}</Text> : null}
          </View>
          {howto.pregnancy ? (
            <View style={{ marginTop: SPACING.sm }}>
              <MatchBadge tone={PREGNANCY[howto.pregnancy].tone} label={t(PREGNANCY[howto.pregnancy].label)} />
            </View>
          ) : null}
          {howto.tip ? <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm }]}>{t(howto.tip)}</Text> : null}
          {[['PAIRS WELL WITH', howto.pairs, colors.primarySoft, colors.primary], ['NOT IN THE SAME ROUTINE', howto.dontMix, colors.cautionSoft || colors.surface, colors.caution || colors.text]]
            .filter(([, ids]) => ids?.length)
            .map(([title, ids, bg, fg]) => (
              <View key={title}>
                <Text style={[styles.section, { color: colors.muted }]}>{t(title)}</Text>
                <View style={styles.chips}>
                  {ids.map(getIngredient).filter(Boolean).map(other => (
                    <Pressable key={other.id} onPress={() => navigation.navigate('Ingredient', { id: other.id })} style={[styles.chip, { backgroundColor: bg }]}>
                      <Text style={[TYPE.caption, { color: fg, fontWeight: '600' }]}>{t(other.name)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
        </>
      ) : null}

      {articles.length ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('LEARN MORE')}</Text>
          {articles.map(a => (
            <Pressable key={a.id} onPress={() => navigation.navigate('Article', { id: a.id, from: 'Ingredient' }, { merge: true })} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={a.icon} size={20} color={colors.primary} />
              <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]} numberOfLines={2}>{t(a.title)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          ))}
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
  howBox: { borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, gap: SPACING.sm },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
})
