import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, useColors } from '../components/ui'
import MatchBadge from '../components/MatchBadge'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { productsWithIngredient, getMyProducts, photoOf } from '../utils/catalog'
import { getIngredient, findIngredients, productMatch, badgeText, badgeTone, isUnsuitable } from '../utils/ingredients-guide'
import { getSituation, NEEDS } from '../utils/emergency-plans'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// Product ideas for one day of an Emergency plan: what the user already owns
// first, then the best-suited options. Never a product that's wrong for them.
export default function SuggestionsScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const baseProfile = useSkinProfile(user?.id)
  const params = route?.params || {}
  const dayIndex = params.day ?? 0
  // Combined SOS plans pass the day's needs directly; older links a situation.
  const day = params.needs ? { needs: params.needs, title: params.title } : getSituation(params.situation)?.days[dayIndex]
  const ownedOnly = !!params.ownedOnly
  // The plan's extra cautions (fungal acne, rosacea…) also filter suggestions.
  const c = params.cautions
  const profile = baseProfile && c ? {
    ...baseProfile,
    acne_types: [...new Set([...(baseProfile.acne_types || []), ...(c.acne || [])])],
    skin_conditions: [...new Set([...(baseProfile.skin_conditions || []), ...(c.conditions || [])])],
    pregnancy: c.pregnant ? baseProfile.pregnancy || 'pregnant' : baseProfile.pregnancy,
  } : baseProfile
  const [sections, setSections] = useState(null)

  useEffect(() => {
    if (!day?.needs || !user?.id) return
    let active = true
    setSections(null)
    const run = async () => {
      try {
        const mine = await getMyProducts(user.id)
        const owned = mine.filter(r => r.status === 'owned' && r.product).map(r => r.product)
        const result = []
        for (const key of day.needs) {
          const need = NEEDS[key]
          if (!need) continue
          const fits = p => !need.categories || need.categories.includes(p.category)
          const hasNeed = p => findIngredients(p).some(f => need.ids.includes(f.entry.id))
          const fromShelf = owned.filter(p => fits(p) && hasNeed(p) && !isUnsuitable(productMatch(p, profile)))

          if (ownedOnly) { result.push({ key, label: need.label, fromShelf, options: [] }); continue }
          const lists = await Promise.all(need.ids.map(id => getIngredient(id)).filter(Boolean).map(e => productsWithIngredient(e, 25).catch(() => [])))
          const ownedIds = new Set(owned.map(p => p.id))
          const seen = new Set()
          const options = lists
            .flat()
            .filter(p => !seen.has(p.id) && seen.add(p.id) && fits(p) && !ownedIds.has(p.id))
            .map(p => ({ product: p, match: productMatch(p, profile) }))
            .filter(x => !isUnsuitable(x.match))
            .sort((a, b) => b.match.score - a.match.score || Number(!!b.product.image_url) - Number(!!a.product.image_url))
            .slice(0, 5)
          result.push({ key, label: need.label, fromShelf, options })
        }
        if (active) setSections(result)
      } catch (error) {
        await logError('Suggestions_load', error, {}, 'warn')
        if (active) setSections([])
      }
    }
    run()
    return () => { active = false }
  }, [params.situation, (params.needs || []).join(','), dayIndex, user?.id, !!baseProfile])

  if (!day) return <Screen back title={t('Suggestions')} />

  const Row = ({ product, match, owned }) => (
    <Pressable
      onPress={() => navigation.navigate('Product', { id: product.id })}
      style={[styles.row, { backgroundColor: colors.card, borderColor: owned ? colors.success : colors.border }]}
    >
      {photoOf(product) ? (
        <Image source={{ uri: photoOf(product) }} style={styles.photo} resizeMode="contain" />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[TYPE.caption, { color: colors.textSecondary }]} numberOfLines={1}>{product.brand}</Text>
        <Text style={[TYPE.bodyStrong, { color: colors.text }]} numberOfLines={2}>{product.name}</Text>
      </View>
      {owned ? (
        <Text style={[TYPE.caption, { color: colors.success, fontWeight: '700' }]}>{t('You have it')}</Text>
      ) : (
        <MatchBadge tone={badgeTone(match)} label={t(badgeText(match))} />
      )}
    </Pressable>
  )

  return (
    <Screen back title={t('Suggestions')} subtitle={`${t('Day {n}', { n: dayIndex + 1 })} · ${t(day.title)}`}>
      {!sections ? <ActivityIndicator color={colors.primary} style={{ marginTop: SPACING.xl }} /> : null}
      {sections?.map(section => (
        <View key={section.key} style={{ marginTop: SPACING.lg }}>
          <Text style={[styles.section, { color: colors.muted }]}>{t(section.label).toUpperCase()}</Text>
          {section.fromShelf.length ? (
            <>
              <Text style={[TYPE.caption, { color: colors.success, fontWeight: '700', marginBottom: 6 }]}>{t('From your shelf, no need to buy')}</Text>
              {section.fromShelf.slice(0, 2).map(p => <Row key={`own-${p.id}`} product={p} owned />)}
              {section.options.length ? <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.sm, marginBottom: 6 }]}>{t('Other good options')}</Text> : null}
            </>
          ) : null}
          {section.options.map(o => <Row key={o.product.id} product={o.product} match={o.match} />)}
          {!section.fromShelf.length && !section.options.length ? (
            <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t('No suitable product found in our catalogue yet.')}</Text>
          ) : null}
        </View>
      ))}
      {sections ? (
        <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.xl, lineHeight: 17 }]}>
          {t('Suggestions are picked for your skin profile only. No brand pays to appear here.')}
        </Text>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.sm },
  photo: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#FFFFFF' },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
})
