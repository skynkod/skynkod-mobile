import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Card, SegmentedControl, LoadingView, EmptyState, useColors } from '../components/ui'
import { usePremium, PremiumBlur } from '../components/PremiumLock'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { getUserRoutines } from '../utils/routines-service'
import { currentRoutine } from '../utils/current-routine'
import { getProductsByIds } from '../utils/catalog'
import { layerRoutine } from '../utils/layering'
import { DAY_LABELS } from '../utils/routine-checks'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS } from '../utils/theme'
import { GTYPE, GFW } from '../components/glossy'
import FeatureIcon from '../components/FeatureIcon'

const LAYER_LABEL = { cleanser: 'Cleanse', spot: 'Spot treatment', exfoliant: 'Exfoliate', toner: 'Tone', essence: 'Essence', serum: 'Treat', eye: 'Eyes', oil: 'Face oil', moisturizer: 'Moisturize', mask: 'Mask', 'sleeping mask': 'Sleeping mask', sunscreen: 'Protect' }
// Monday first, like the rest of the app's weeks.
const WEEK = [1, 2, 3, 4, 5, 6, 0]

// Premium: her own products in the right order, how much and how, and which
// evening holds which active. Every rule shows its source.
export default function LayeringScreen({ route }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const premium = usePremium()
  const [tab, setTab] = useState(route?.params?.period || (new Date().getHours() >= 15 ? 'evening' : 'morning'))
  const [data, setData] = useState(null)

  useFocusEffect(useCallback(() => {
    if (!user?.id) return
    let active = true
    ;(async () => {
      try {
        const res = await getUserRoutines(user.id)
        const list = res.success ? res.data : []
        const routines = { morning: currentRoutine(list, 'morning'), evening: currentRoutine(list, 'evening') }
        const ids = [...(routines.morning?.steps || []), ...(routines.evening?.steps || [])].map(s => s.product_id).filter(Boolean)
        const products = ids.length ? await getProductsByIds(ids) : []
        const byId = Object.fromEntries(products.map(p => [p.id, p]))
        const out = {}
        for (const period of ['morning', 'evening']) out[period] = routines[period] ? layerRoutine({ period, steps: routines[period].steps, productsById: byId }) : null
        if (active) setData(out)
      } catch (error) {
        await logError('Layering_load', error, {}, 'warn')
        if (active) setData({ morning: null, evening: null })
      }
    })()
    return () => { active = false }
  }, [user?.id]))

  if (!data || premium === undefined) return <LoadingView />
  const guide = data[tab]

  const body = guide?.steps.length ? (
    <>
      {guide.notes.map((n, i) => (
        <View key={i} style={[styles.note, { backgroundColor: n.level === 'warning' ? colors.warningSoft : colors.primarySoft }]}>
          <FeatureIcon name={n.level === 'warning' ? 'alert-circle-outline' : 'information-circle-outline'} size={18} color={n.level === 'warning' ? colors.warning : colors.primary} />
          <Text style={[GTYPE.caption, { color: colors.text, flex: 1, lineHeight: 18 }]}>{t(n.text)}</Text>
        </View>
      ))}

      {guide.steps.map((s, i) => (
        <View key={`${s.product.id}-${i}`}>
          <Card style={{ marginTop: i ? 0 : SPACING.md }}>
            <View style={styles.stepHead}>
              <View style={[styles.num, { backgroundColor: colors.primary }]}><Text style={{ color: colors.onPrimary, ...GFW('700') }}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[GTYPE.overline, { color: colors.primary }]}>{t(LAYER_LABEL[s.layer] || 'Treat')}</Text>
                <Text style={[GTYPE.bodyStrong, { color: colors.text, marginTop: 2 }]}>{s.product.brand} {s.product.name}</Text>
                {s.days.length < 7 ? <Text style={[GTYPE.caption, { color: colors.muted, marginTop: 2 }]}>{t(s.daysLabel)}</Text> : null}
              </View>
            </View>
            <View style={styles.row}><FeatureIcon name="water-outline" size={15} color={colors.primary} /><Text style={[GTYPE.caption, { color: colors.text, flex: 1 }]}>{t(s.amount)}</Text></View>
            <View style={styles.row}><Ionicons name="hand-left-outline" size={15} color={colors.primary} /><Text style={[GTYPE.caption, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>{t(s.how)}</Text></View>
          </Card>
          {s.then ? (
            <View style={styles.then}>
              <View style={[styles.thenLine, { backgroundColor: colors.border }]} />
              <Text style={[GTYPE.caption, { color: colors.muted, fontStyle: 'italic' }]}>{t(s.then)}</Text>
            </View>
          ) : null}
        </View>
      ))}

      {guide.nights ? (
        <>
          <Text style={[styles.section, { color: colors.muted }]}>{t('YOUR EVENINGS')}</Text>
          <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
            {WEEK.map(day => guide.nights.find(n => n.day === day)).map((n, i) => (
              <View key={n.day} style={[styles.night, i < 6 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <Text style={[GTYPE.bodyStrong, { color: colors.text, width: 48 }]}>{t(DAY_LABELS[n.day])}</Text>
                <Text style={[GTYPE.caption, { color: n.actives.length ? colors.text : colors.muted, flex: 1 }]}>
                  {n.actives.length ? n.actives.map(a => `${a.name} (${t(a.kind === 'retinoid' ? 'retinoid' : 'exfoliant')})`).join(' + ') : t('Recovery night: no strong active')}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}
    </>
  ) : (
    <EmptyState icon="layers-outline" koda="curious" title={t('No products in this routine yet')} description={t('Add your products to your routine and we’ll show you the right order.')} />
  )

  return (
    <Screen back title={t('How to apply')} subtitle={t('Your products, in the right order')}>
      <SegmentedControl value={tab} onChange={setTab} options={[{ value: 'morning', label: t('Morning'), icon: 'sunny-outline' }, { value: 'evening', label: t('Evening'), icon: 'moon-outline' }]} />
      {premium === false && guide?.steps.length ? (
        <PremiumBlur locked title="Your routine in the right order" text="Which product first, how much, how to apply it, and which evening for each active." style={{ marginTop: SPACING.lg }}>
          {body}
        </PremiumBlur>
      ) : body}

      {premium && guide?.rules.length ? (
        <Text style={[GTYPE.caption, { color: colors.muted, lineHeight: 17, marginTop: SPACING.lg }]}>{t('If you use a prescribed treatment, follow your doctor’s instructions.')}</Text>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  note: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start', borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  num: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginTop: SPACING.sm },
  then: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingLeft: 29, paddingVertical: SPACING.sm },
  thenLine: { width: 2, height: 18, borderRadius: 1 },
  section: { fontSize: 12, ...GFW('700'), letterSpacing: 1.1, marginTop: SPACING.xxl, marginBottom: SPACING.sm },
  night: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
})
