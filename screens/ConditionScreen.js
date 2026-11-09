import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, useColors } from '../components/ui'
import ProductThumb from '../components/ProductThumb'
import ProductVerdict from '../components/ProductVerdict'
import FeatureIcon from '../components/FeatureIcon'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useSkinProfile } from '../utils/useSkinProfile'
import { getCondition, GUIDE_NOTE } from '../utils/encyclopedia/conditions'
import { CONDITION_IMAGES } from '../utils/encyclopedia/condition-images'
import { CONDITION_EXPLAIN } from '../utils/encyclopedia/condition-explain'
import { getArticle } from '../utils/encyclopedia'
import { getIngredient, productMatch, isUnsuitable } from '../utils/ingredients-guide'
import { productsWithIngredient } from '../utils/catalog'
import { SPACING, RADIUS } from '../utils/theme'
import { GTYPE, GFW, glassCard } from '../components/glossy'

// One skin issue (Lita, 2026-10-24): where it shows and what it looks like,
// what happens under the skin, what skincare can and can't do, what a
// dermatologist may prescribe, which clinic treatments are worth asking about,
// when to see a dermatologist, then products that fit her skin.
// Guidance, never a diagnosis.
const DERM_TONE = { check: 'primary', soon: 'warning', urgent: 'danger' }

export default function ConditionScreen({ route, navigation }) {
  const colors = useColors()
  const t = useT()
  // The whole square picture, edge to edge inside the page margins.
  const side = useWindowDimensions().width - SPACING.xl * 2
  const { user } = useAuth()
  const profile = useSkinProfile(user?.id)
  const c = getCondition(route?.params?.id)
  const [products, setProducts] = useState(null)

  // Products with the helpful ingredients that suit her skin (and her skin today).
  useEffect(() => {
    if (!c || !profile) return
    let active = true
    const entries = (c.ingredients || []).map(getIngredient).filter(Boolean).slice(0, 3)
    Promise.all(entries.map(e => productsWithIngredient(e, 30).catch(() => []))).then(lists => {
      if (!active) return
      const seen = new Set()
      const ranked = lists.flat()
        .filter(p => !seen.has(p.id) && seen.add(p.id) && !['body', 'hand care'].includes(p.category))
        .map(p => ({ p, m: productMatch(p, profile) }))
        .filter(({ m }) => !isUnsuitable(m) && !m.partial && !m.notNow)
        .sort((a, b) => b.m.score - a.m.score)
        .slice(0, 5)
        .map(({ p }) => p)
      setProducts(ranked)
    })
    return () => { active = false }
  }, [c?.id, profile])

  if (!c) return <Screen back title={t('Not found')} />
  const article = getArticle(c.id)
  const explain = CONDITION_EXPLAIN[c.id]
  const tone = c.derm ? colors[DERM_TONE[c.derm.level]] : colors.primary

  const List = ({ icon, color, title, items }) => (items?.length ? (
    <View style={{ marginTop: SPACING.lg }}>
      <Text style={[styles.section, { color }]}>{t(title)}</Text>
      {items.map((x, i) => (
        <View key={i} style={styles.item}>
          <FeatureIcon name={icon} size={16} color={color} style={{ marginTop: 2 }} />
          <Text style={[GTYPE.body, { color: colors.text, flex: 1, lineHeight: 21 }]}>{typeof x === 'string' ? t(x) : null}</Text>
        </View>
      ))}
    </View>
  ) : null)

  const Treatments = ({ title, items, icon, prescription }) => (items?.length ? (
    <View style={{ marginTop: SPACING.lg }}>
      <Text style={[styles.section, { color: colors.primary }]}>{t(title)}</Text>
      {items.map(x => (
        <View key={x.name} style={[styles.treat, { borderColor: colors.border, ...glassCard(colors) }]}>
          <FeatureIcon name={icon} size={18} color={colors.primary} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={[GTYPE.bodyStrong, { color: colors.text }]}>{t(x.name)}</Text>
            <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>{t(x.what)}</Text>
            {x.downtime && x.downtime !== '—' ? <Text style={[GTYPE.caption, { color: colors.muted, marginTop: 2 }]}>{t('Recovery')}: {t(x.downtime)}</Text> : null}
          </View>
        </View>
      ))}
      <Text style={[GTYPE.caption, { color: colors.muted, marginTop: 4, lineHeight: 17 }]}>
        {prescription ? t('Only a doctor can prescribe these. Never start one on your own.') : t('Ask a dermatologist or a qualified aesthetic doctor whether it suits you.')}
      </Text>
    </View>
  ) : null)

  return (
    <Screen back title={t(c.title)}>
      {CONDITION_IMAGES[c.id] ? <Image source={CONDITION_IMAGES[c.id]} style={[styles.hero, { width: side, height: side }]} resizeMode="contain" /> : null}

      {/* What it is and why it happens, before what it looks like */}
      {explain ? (
        <View style={{ marginTop: SPACING.lg }}>
          <Text style={[styles.section, { color: colors.primary }]}>{t('WHAT IS IT?')}</Text>
          <Text style={[GTYPE.body, { color: colors.text, lineHeight: 22 }]}>{t(explain.what)}</Text>
        </View>
      ) : null}
      <List icon="help-circle-outline" color={colors.primary} title="WHY IT HAPPENS" items={explain?.why} />

      <List icon="eye-outline" color={colors.primary} title="WHAT YOU MAY NOTICE" items={c.notice} />

      {explain?.course ? (
        <View style={[styles.course, { ...glassCard(colors), borderColor: colors.border }]}>
          <Ionicons name="time-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={[GTYPE.bodyStrong, { color: colors.text }]}>{t('Does it go away? How long does it last?')}</Text>
            <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>{t(explain.course)}</Text>
          </View>
        </View>
      ) : null}

      <List icon="checkmark-circle" color={colors.success} title="WHAT SKINCARE CAN DO" items={c.can} />
      <List icon="close-circle" color={colors.danger} title="WHAT SKINCARE CAN’T DO" items={c.cant} />
      <Treatments title="WHAT A DERMATOLOGIST MAY PRESCRIBE" items={c.rx} icon="medkit-outline" prescription />
      <Treatments title="CLINIC TREATMENTS WORTH ASKING ABOUT" items={c.clinic} icon="medical-outline" />

      {/* Always: Skynkod guides, a dermatologist confirms */}
      <View style={[styles.derm, { backgroundColor: c.derm?.level === 'urgent' ? colors.dangerSoft : c.derm?.level === 'soon' ? colors.warningSoft : colors.primarySoft }]}>
        <FeatureIcon name={c.derm?.level === 'urgent' ? 'alert-circle' : 'person-outline'} size={20} color={tone} />
        <View style={{ flex: 1 }}>
          {c.derm ? <Text style={[GTYPE.bodyStrong, { color: colors.text, lineHeight: 20 }]}>{t(c.derm.text)}</Text> : null}
          <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: c.derm ? 4 : 0, lineHeight: 18 }]}>{t(GUIDE_NOTE)}</Text>
        </View>
      </View>

      {products?.length ? (
        <>
          <Text style={[styles.section, { color: colors.primary, marginTop: SPACING.xl }]}>{t('PRODUCTS THAT FIT YOUR SKIN')}</Text>
          {products.map(p => (
            <Pressable key={p.id} onPress={() => navigation.navigate('Product', { id: p.id })} style={[styles.product, { ...glassCard(colors), borderColor: colors.border }]}>
              <ProductThumb product={p} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={[GTYPE.caption, { color: colors.textSecondary }]} numberOfLines={1}>{p.brand}</Text>
                <Text style={[GTYPE.bodyStrong, { color: colors.text }]} numberOfLines={2}>{p.name}</Text>
                <ProductVerdict product={p} profile={profile} />
              </View>
            </Pressable>
          ))}
        </>
      ) : null}

      <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xl }}>
        {article ? (
          <Pressable onPress={() => navigation.navigate('Article', { id: article.id })} style={[styles.btn, { borderColor: colors.border }]}>
            <FeatureIcon name="book-outline" size={16} color={colors.primary} />
            <Text style={[GTYPE.bodyStrong, { color: colors.primary }]}>{t('Read more')}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => navigation.navigate('Koda', { prefill: t('I think I might have {issue}. What should I do?', { issue: t(c.title).toLowerCase() }) })} style={[styles.btn, { borderColor: colors.border }]}>
          <FeatureIcon name="koda" size={16} color={colors.primary} />
          <Text style={[GTYPE.bodyStrong, { color: colors.primary }]}>{t('Ask Koda')}</Text>
        </Pressable>
      </View>

    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { borderRadius: RADIUS.lg, marginBottom: SPACING.sm },
  section: { fontSize: 12, ...GFW('700'), letterSpacing: 1.1, marginBottom: SPACING.sm },
  item: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start', marginBottom: 6 },
  treat: { flexDirection: 'row', gap: SPACING.md, borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  course: { flexDirection: 'row', gap: SPACING.md, borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.lg },
  derm: { flexDirection: 'row', gap: SPACING.md, borderRadius: RADIUS.md, padding: SPACING.lg, marginTop: SPACING.xl, alignItems: 'flex-start' },
  product: { flexDirection: 'row', gap: SPACING.md, borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  btn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 999, height: 44 },
})
