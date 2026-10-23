import React from 'react'
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Card, useColors } from '../components/ui'
import { useT } from '../utils/LanguageContext'
import { INGREDIENTS, PREGNANCY_DETAIL, PREGNANCY_ALTERNATIVES } from '../utils/ingredients-guide'
import { SPACING, TYPE } from '../utils/theme'

// "What's safe for you now", for the pregnancy and breastfeeding mode. The
// same rules the product verdicts use (utils/ingredients-guide.js), with sources.
const SOURCES = [
  { label: 'American Academy of Dermatology, "Is any acne treatment safe to use during pregnancy?"', url: 'https://www.aad.org/public/diseases/acne/derm-treat/pregnancy' },
  { label: 'American Family Physician, "Common Skin Conditions During Pregnancy" (2023)', url: 'https://www.aafp.org/pubs/afp/issues/2023/0200/skin-conditions-during-pregnancy/' },
]

export default function PregnancySafeScreen({ navigation }) {
  const colors = useColors()
  const t = useT()
  const avoid = INGREDIENTS.filter(i => i.tags.includes('pregnancy-avoid'))
  const ask = INGREDIENTS.filter(i => i.tags.includes('pregnancy-care'))
  const safeIds = [...new Set(Object.values(PREGNANCY_ALTERNATIVES).flat())]
  const safe = safeIds.map(id => INGREDIENTS.find(i => i.id === id)).filter(Boolean)

  const Row = ({ item, icon, tone, text }) => (
    <Pressable onPress={() => navigation.navigate('Ingredient', { id: item.id })} style={[styles.row, { borderBottomColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={tone} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(item.name)}</Text>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>{t(text)}</Text>
      </View>
    </Pressable>
  )

  return (
    <Screen back title={t('What’s safe for you now')} subtitle={t('Pregnancy and breastfeeding')}>
      <Text style={[styles.section, { color: colors.muted }]}>{t('BEST AVOIDED')}</Text>
      <Card padded={false} style={styles.card}>
        {avoid.map(i => <Row key={i.id} item={i} icon="close-circle-outline" tone={colors.danger} text={PREGNANCY_DETAIL[i.id] || 'Not recommended while pregnant or breastfeeding.'} />)}
      </Card>

      <Text style={[styles.section, { color: colors.muted }]}>{t('ASK YOUR DOCTOR FIRST')}</Text>
      <Card padded={false} style={styles.card}>
        {ask.map(i => <Row key={i.id} item={i} icon="help-circle-outline" tone={colors.warning} text="Low strengths in skincare are generally considered fine for a limited time, but peels and high strengths are not." />)}
      </Card>

      <Text style={[styles.section, { color: colors.muted }]}>{t('GOOD ALTERNATIVES')}</Text>
      <Card padded={false} style={styles.card}>
        {safe.map(i => <Row key={i.id} item={i} icon="checkmark-circle-outline" tone={colors.success} text={i.what} />)}
      </Card>

      <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: SPACING.lg, lineHeight: 18 }]}>
        {t('Every product you scan is checked against these rules for you. Wear a broad-spectrum sunscreen every day: pregnancy can make dark patches (melasma) appear.')}
      </Text>
      <Text style={[styles.section, { color: colors.muted }]}>{t('WHERE THIS COMES FROM')}</Text>
      {SOURCES.map(s => (
        <Pressable key={s.url} onPress={() => Linking.openURL(s.url)} hitSlop={6}>
          <Text style={[TYPE.caption, { color: colors.primary, marginBottom: SPACING.sm }]}>{s.label}</Text>
        </Pressable>
      ))}
      <Text style={[TYPE.caption, { color: colors.muted, lineHeight: 17, marginTop: SPACING.sm }]}>{t('General guidance, not a medical prescription. Check with your doctor or midwife, especially for prescribed treatments.')}</Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  card: { paddingHorizontal: SPACING.lg },
  row: { flexDirection: 'row', gap: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: StyleSheet.hairlineWidth },
})
