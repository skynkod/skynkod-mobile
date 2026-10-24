import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { Card, useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { shelfReview, SHELF_GROUPS } from '../utils/shelf-review'
import { weekAudit } from '../utils/week-audit'
import { shelfLife } from '../utils/shelf-life'
import { SPACING, TYPE } from '../utils/theme'

// "Your shelf" at the top of My products: the counts and the one-line verdict
// for everyone, each group's products for Premium.
export default function ShelfReview({ rows = [], profile, stop, style }) {
  const colors = useColors()
  const t = useT()
  const navigation = useNavigation()
  const [open, setOpen] = useState(null)
  const owned = rows.filter(r => r.status === 'owned' && r.product).map(r => ({ product: r.product, life: shelfLife(r) }))
  if (owned.length < 3) return null

  const byId = Object.fromEntries((stop.routineProducts || []).map(p => [p.id, p]))
  const routine = type => (stop.routines || []).find(r => r.type === type)?.steps || []
  const audit = weekAudit({ morning: routine('morning'), evening: routine('evening'), productsById: byId, profile })
  const { groups, total } = shelfReview({ owned, profile, reactions: stop.reactions, routineProducts: stop.routineProducts, tooManyExfoliations: audit.exfoliations > 3, verdicts: stop.verdicts })
  const missing = groups.missing.length
  const verdict = missing === 0
    ? t('You have everything you need. No need to buy more.')
    : missing === 1 ? t('You don’t need to buy lots of new products. You only need one.') : t('You don’t need to buy lots of new products. You only need {n}.', { n: missing })

  const tapGroup = key => {
    if (stop.premium === false) return navigation.navigate('Premium')
    setOpen(o => (o === key ? null : key))
  }

  return (
    <Card style={style}>
      <Text style={[TYPE.overline, { color: colors.primary }]}>{t('YOUR SKYN SHELF')} · {t('{n} products', { n: total })}</Text>
      <Text style={[TYPE.bodyStrong, { color: colors.text, marginTop: SPACING.sm, lineHeight: 21 }]}>{verdict}</Text>
      <View style={{ marginTop: SPACING.md }}>
        {SHELF_GROUPS.map(g => {
          const list = groups[g.key]
          if (!list.length) return null
          return (
            <View key={g.key}>
              <Pressable onPress={() => tapGroup(g.key)} style={[styles.row, { borderTopColor: colors.border }]} accessibilityRole="button">
                <View style={[styles.dot, { backgroundColor: colors[g.color] }]} />
                <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(g.label)}</Text>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{list.length}</Text>
                <Ionicons name={stop.premium === false ? 'diamond' : open === g.key ? 'chevron-up' : 'chevron-down'} size={stop.premium === false ? 12 : 16} color={stop.premium === false ? colors.primary : colors.muted} />
              </Pressable>
              {open === g.key && stop.premium ? list.map((x, i) => (
                <Pressable key={x.product?.id || i} disabled={!x.product} onPress={() => navigation.navigate('Product', { id: x.product.id })} style={styles.item}>
                  <Text style={[TYPE.caption, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>{x.product ? x.product.name : t(x.label, x.params)}</Text>
                  {x.why ? <Text style={[TYPE.caption, { color: colors.textSecondary, lineHeight: 17 }]}>{t(x.why.text, x.why.params)}</Text> : null}
                </Pressable>
              )) : null}
            </View>
          )
        })}
      </View>
      {stop.premium === false ? <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>{t('See which products, and why, with Premium.')}</Text> : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  dot: { width: 10, height: 10, borderRadius: 5 },
  item: { paddingLeft: 18, paddingBottom: SPACING.sm },
})
