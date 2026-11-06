import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Button, useColors } from '../components/ui'
import FeatureIcon from '../components/FeatureIcon'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { saveCheckin } from '../utils/skin-tracking'
import { markAsked } from '../utils/ask-pace'
import { OVERALL, CHECKIN_CONCERNS } from '../utils/skin-tracking-core'
import { logError } from '../utils/errorLogger'
import { usePremium } from '../components/PremiumLock'
import { getDekodResults } from '../utils/dekod'
import { SPACING, RADIUS } from '../utils/theme'
import { GTYPE, GFW, glassCard } from '../components/glossy'

// The check-in every 2 weeks (Lita, 2026-10-24): three quick answers, about
// ten seconds. Compared with her start, what bothers her, and a Dekod scan if
// she wants one.
export default function SkinCheckInScreen({ route, navigation }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const week = route?.params?.week
  const [overall, setOverall] = useState(null)
  const [concerns, setConcerns] = useState([])
  const [scan, setScan] = useState(false)
  // Dekod is offered when she can scan: Premium, or her free scan not used yet (audit 2).
  const premium = usePremium()
  const [scanned, setScanned] = useState(null)
  useEffect(() => { if (user?.id) getDekodResults(user.id, 1).then(r => setScanned(r.length > 0)).catch(() => setScanned(true)) }, [user?.id])
  const canScan = premium || scanned === false
  const [saving, setSaving] = useState(false)

  const toggle = c => setConcerns(list => (list.includes(c) ? list.filter(x => x !== c) : [...list, c]))

  const save = async () => {
    if (!user?.id || !overall) return
    setSaving(true)
    try {
      await saveCheckin(user.id, { overall, concerns })
      markAsked(user.id)
      if (scan) navigation.navigate('Dekod')
      else navigation.navigate('Progress')
    } catch (error) {
      logError('Checkin_save', error, {}, 'warn')
      Alert.alert(t('Couldn’t save'), t('Check your connection and try again.'))
      setSaving(false)
    }
  }

  return (
    <Screen back overline={week ? t('WEEK {n} · SKIN REVIEW', { n: week }) : t('SKIN REVIEW')} title={t('How is your skin doing?')}
      footer={<Button title={t('Save my skin review')} onPress={save} disabled={!overall || saving} loading={saving} />}>
      <Text style={[styles.q, { color: colors.text }]}>{t('Compared with when you started')}</Text>
      <View style={styles.row}>
        {OVERALL.map(o => {
          const on = overall === o.key
          return (
            <Pressable key={o.key} onPress={() => setOverall(o.key)} accessibilityRole="button" accessibilityState={{ selected: on }}
              style={[styles.mood, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.card }]}>
              <Text style={{ fontSize: 28 }}>{o.emoji}</Text>
              <Text style={[GTYPE.bodyStrong, { color: on ? colors.primary : colors.text, marginTop: 4 }]}>{t(o.label)}</Text>
            </Pressable>
          )
        })}
      </View>

      <Text style={[styles.q, { color: colors.text }]}>{t('What’s bothering you?')}</Text>
      <View style={styles.chips}>
        {CHECKIN_CONCERNS.map(c => {
          const on = concerns.includes(c)
          return (
            <Pressable key={c} onPress={() => toggle(c)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
              style={[styles.chip, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.card }]}>
              {on ? <Ionicons name="checkmark" size={14} color={colors.primary} /> : null}
              <Text style={[GTYPE.body, { color: on ? colors.primary : colors.text }]}>{t(c)}</Text>
            </Pressable>
          )
        })}
      </View>
      <Text style={[GTYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>{t('Nothing? Leave it empty.')}</Text>

      {canScan ? (
      <Pressable onPress={() => setScan(s => !s)} accessibilityRole="checkbox" accessibilityState={{ checked: scan }}
        style={[styles.scan, { borderColor: scan ? colors.primary : colors.border, ...glassCard(colors) }]}>
        <FeatureIcon name="dekod" size={22} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[GTYPE.bodyStrong, { color: colors.text }]}>{t('Add a Dekod scan')}</Text>
          <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>{t('Optional: a photo makes your progress clearer.')}</Text>
        </View>
        <FeatureIcon name={scan ? 'checkbox' : 'square-outline'} size={22} color={scan ? colors.primary : colors.muted} />
      </Pressable>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  q: { fontSize: 16, ...GFW('700'), marginTop: SPACING.xl, marginBottom: SPACING.md },
  row: { flexDirection: 'row', gap: SPACING.sm },
  mood: { flex: 1, alignItems: 'center', borderWidth: 1.5, borderRadius: RADIUS.lg, paddingVertical: SPACING.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: SPACING.md, paddingVertical: 8 },
  scan: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.xl },
})
