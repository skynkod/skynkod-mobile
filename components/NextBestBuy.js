import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { Card, useColors } from './ui'
import { useT } from '../utils/LanguageContext'
import { nextBestBuys } from '../utils/next-buy'
import { shelfLife } from '../utils/shelf-life'
import { SPACING } from '../utils/theme'
import { GTYPE, GFW } from './glossy'

// "My next best buy" at the top of the To buy tab (Lita, 2026-10-24):
// #1 for everyone, the full ranking and "Don't buy these yet" for Premium.
export default function NextBestBuy({ rows = [], profile, premium, style }) {
  const colors = useColors()
  const t = useT()
  const navigation = useNavigation()
  const owned = rows.filter(r => r.status === 'owned' && r.product).map(r => ({ product: r.product, life: shelfLife(r) }))
  const toBuy = rows.filter(r => r.status === 'to_buy' && r.product).map(r => r.product)
  const { ranked, skip } = nextBestBuys({ owned, toBuy, profile })
  if (!ranked.length && !skip.length) return null
  const shown = premium ? ranked.slice(0, 5) : ranked.slice(0, 1)

  return (
    <Card style={style}>
      <Text style={[GTYPE.overline, { color: colors.primary }]}>{t('MY NEXT BEST BUY')}</Text>
      {shown.map((x, i) => (
        <Pressable key={`${x.kind}-${x.product?.id || x.label}`} disabled={!x.product} onPress={() => navigation.navigate('Product', { id: x.product.id })} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
          <Text style={[styles.rank, { color: colors.primary }]}>#{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[GTYPE.bodyStrong, { color: colors.text }]} numberOfLines={2}>
              {x.product ? x.product.name : t(x.label, x.params)}{x.kind === 'list' ? <Text style={[GTYPE.caption, { color: colors.muted, ...GFW('400') }]}> · {t('in your list')}</Text> : null}
            </Text>
            <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>{t(x.text, x.params)}</Text>
            {x.query ? (
              <Pressable onPress={() => navigation.navigate('Search', { query: t(x.query) })} hitSlop={6} style={{ marginTop: 4 }}>
                <Text style={[GTYPE.caption, { color: colors.primary, ...GFW('700') }]}>{t('Find one')} ›</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      ))}

      {premium && skip.length ? (
        <>
          <Text style={[GTYPE.caption, { color: colors.muted, ...GFW('800'), letterSpacing: 0.6, marginTop: SPACING.lg }]}>{t('DON’T BUY THESE YET')}</Text>
          {skip.map(x => (
            <Pressable key={x.product.id} onPress={() => navigation.navigate('Product', { id: x.product.id })} style={styles.skip}>
              <Ionicons name="remove-circle-outline" size={15} color={colors.warning} style={{ marginTop: 2 }} />
              <Text style={[GTYPE.caption, { color: colors.text, flex: 1, lineHeight: 18 }]}>
                <Text style={{ ...GFW('700') }}>{x.product.name}</Text>: {t(x.text, x.params)}
              </Text>
            </Pressable>
          ))}
        </>
      ) : null}

      {premium === false && (ranked.length > 1 || skip.length) ? (
        <Pressable onPress={() => navigation.navigate('Premium')} style={styles.lock} hitSlop={6}>
          <Ionicons name="diamond" size={13} color={colors.primary} />
          <Text style={[GTYPE.caption, { color: colors.primary, ...GFW('700'), flex: 1 }]}>
            {t('See your full ranking and what not to buy with Premium')}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.md },
  rank: { fontSize: 18, ...GFW('800'), width: 30 },
  skip: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: SPACING.sm },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md },
})
