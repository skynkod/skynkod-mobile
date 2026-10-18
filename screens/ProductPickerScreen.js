import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, useColors } from '../components/ui'
import MatchBadge from '../components/MatchBadge'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { productsByCategory, searchProducts } from '../utils/catalog'
import { productMatch } from '../utils/ingredients-guide'
import { STEP_TYPES } from '../utils/routine-steps'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// "Which one do you have?" for a routine step: best matches for the user's
// skin in that category first, a search box and the scanner for the rest.
export default function ProductPickerScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const stepKey = route?.params?.stepKey
  const uid = route?.params?.uid || stepKey // which slot of the routine this fills
  const step = STEP_TYPES[stepKey] || STEP_TYPES.cleanser
  const [query, setQuery] = useState('')
  const [picks, setPicks] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)

  useEffect(() => {
    setQuery('')
    setLoading(true)
    productsByCategory(step.category)
      .then(setPicks)
      .catch(error => logError('ProductPicker_picks', error, { stepKey }, 'warn'))
      .finally(() => setLoading(false))
  }, [stepKey])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return setResults([])
    const id = ++requestId.current
    const timer = setTimeout(async () => {
      try {
        const rows = await searchProducts(q)
        if (id === requestId.current) setResults(rows)
      } catch (error) {
        await logError('ProductPicker_search', error, { q }, 'warn')
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Best matches first; products with a photo win ties.
  const topPicks = useMemo(
    () =>
      picks
        .map(p => ({ product: p, match: productMatch(p, profile) }))
        .sort((a, b) => b.match.score - a.match.score || Number(!!b.product.image_url) - Number(!!a.product.image_url))
        .slice(0, 12),
    [picks, profile]
  )

  // merge keeps the builder's period and progress; a plain navigate would wipe them.
  const choose = product => navigation.navigate({ name: 'RoutineBuilder', params: { picked: { stepKey, uid, product } }, merge: true })
  const searching = query.trim().length >= 2
  const list = searching ? results.map(p => ({ product: p, match: productMatch(p, profile) })) : topPicks

  return (
    <Screen back keyboard title={t(step.title)} subtitle={t('Which one do you use?')}>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('Search by name or brand')}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: colors.text }]}
        />
        <Pressable
          onPress={() => navigation.navigate('Scanner', { pickFor: { stepKey, uid } })}
          hitSlop={10}
          accessibilityLabel={t('Scan a product')}
        >
          <Ionicons name="scan-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={[styles.section, { color: colors.muted }]}>
        {searching ? t('RESULTS') : t('TOP PICKS FOR YOUR SKIN')}
      </Text>
      {loading && !searching ? <ActivityIndicator color={colors.primary} /> : null}
      {searching && !results.length ? (
        <Text style={[TYPE.caption, { color: colors.textSecondary }]}>{t("We couldn't find this product yet. Try scanning its barcode.")}</Text>
      ) : null}

      {list.map(({ product, match }) => (
        <Pressable
          key={product.id}
          onPress={() => choose(product)}
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
          <MatchBadge tone={match.tone} label={`${match.score}%`} />
        </Pressable>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, height: 50, borderRadius: 999, borderWidth: 1, paddingHorizontal: SPACING.lg, marginTop: SPACING.sm },
  input: { flex: 1, fontSize: 16, height: '100%' },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderRadius: RADIUS.md, borderWidth: StyleSheet.hairlineWidth, padding: SPACING.md, marginBottom: SPACING.sm },
  photo: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#FFFFFF' },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
})
