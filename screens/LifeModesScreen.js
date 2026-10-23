import React, { useCallback, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Card, SegmentedControl, LoadingView, useColors } from '../components/ui'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { useTheme } from '../utils/ThemeContext'
import { getUserProfile, updateUserProfile } from '../utils/supabase'
import { fromRow, toColumns } from '../utils/skin-quiz'
import { getActivePlan } from '../utils/emergency-state'
import { currentSeason, SEASONS } from '../utils/seasons'
import { syncSoon } from '../utils/journey'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// "Your skin right now" (inspired by Flo's life stages, Lita 2026-10-23): the
// modes that change the whole app. Pregnancy and breastfeeding (every verdict,
// Rekod and Koda follow it), "My skin is reacting" (the 7-day calm plan) and
// the season (automatic).
export default function LifeModesScreen({ navigation }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const { coords } = useTheme()
  const [row, setRow] = useState(null)
  const [sos, setSos] = useState(null)
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => {
    if (!user?.id) return
    getUserProfile(user.id).then(r => setRow(r || {})).catch(error => { logError('LifeModes_load', error); setRow({}) })
    getActivePlan(user.id).then(setSos).catch(() => setSos(null))
  }, [user?.id]))

  if (!row) return <LoadingView />
  const answers = fromRow(row)
  const pregnancy = ['pregnant', 'breastfeeding'].includes(answers.pregnancy) ? answers.pregnancy : 'no'
  const season = SEASONS[currentSeason(new Date(), coords?.latitude ?? null).id]

  const savePregnancy = async (value) => {
    const write = async () => {
      setSaving(true)
      const next = { ...answers, pregnancy: value === 'no' ? 'no' : value }
      const fields = { ...toColumns(next, true), ...(row.consent_health_at ? {} : { consent_health_at: new Date().toISOString() }) }
      const ok = await updateUserProfile(user.id, fields)
      setSaving(false)
      if (!ok) return Alert.alert(t('Error'), t("Couldn't save your answer. Try again."))
      setRow({ ...row, ...fields })
      syncSoon(user.id)
      if (value === 'no' && pregnancy !== 'no') {
        Alert.alert(t('Welcome back to your full routine'), t('Bring strong actives back slowly: retinol 2 or 3 nights a week at first, and only more if your skin is comfortable.'))
      }
    }
    // Health information: asked with consent, like at sign-up.
    if (!row.consent_health_at && value !== 'no') {
      return Alert.alert(t('Health information'), t('We use it only to check your products and adapt your routine. You can turn it off anytime.'), [
        { text: t('Cancel'), style: 'cancel' },
        { text: t('I agree'), onPress: write },
      ])
    }
    write()
  }

  const Mode = ({ icon, title, text, on, children, onPress }) => (
    <Card style={[styles.mode, on && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]} onPress={onPress}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: on ? colors.primary : colors.primarySoft }]}>
          <Ionicons name={icon} size={20} color={on ? colors.onPrimary : colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{title}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>{text}</Text>
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
      </View>
      {children}
    </Card>
  )

  return (
    <Screen back title={t('Your skin right now')} subtitle={t('Choose what’s going on: the whole app adapts.')}>
      {answers.sex !== 'man' ? (
        <Mode icon="heart-outline" title={t('Pregnancy and breastfeeding')} on={pregnancy !== 'no'}
          text={pregnancy !== 'no' ? t('On: every product, routine and answer from Koda takes it into account.') : t('Every product you scan is checked for ingredients to avoid.')}>
          <View style={{ marginTop: SPACING.md, opacity: saving ? 0.5 : 1 }}>
            <SegmentedControl value={pregnancy} onChange={v => !saving && v !== pregnancy && savePregnancy(v)}
              options={[{ value: 'no', label: t('Off') }, { value: 'pregnant', label: t('Pregnant') }, { value: 'breastfeeding', label: t('Breastfeeding') }]} />
          </View>
          {pregnancy !== 'no' ? (
            <Pressable onPress={() => navigation.navigate('PregnancySafe')} style={styles.link} hitSlop={6}>
              <Text style={[TYPE.bodyStrong, { color: colors.primary }]}>{t('What’s safe for you now')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          ) : null}
        </Mode>
      ) : null}

      <Mode icon="flame-outline" title={t('My skin is reacting')} on={!!sos}
        text={sos
          ? (sos.phase === 'return' ? t('Gradual return · day {day} of {total}', { day: sos.returnDay, total: sos.returnDays }) : t('Day {day} of 7 · {title}', { day: sos.dayIndex + 1, title: t(sos.situation.title) }))
          : t('7 calm days: strong actives on pause, then back one by one.')}
        onPress={() => navigation.navigate('Emergency')} />

      <Mode icon={season.icon} title={t('Season: {season}', { season: t(season.label).toLowerCase() })} on={false}
        text={t('Automatic. Your tips follow the season, and a routine for it is offered when it starts.')}>
        <View style={{ marginTop: SPACING.md, gap: 6 }}>
          {season.tips.map(tip => (
            <View key={tip} style={styles.tip}>
              <Ionicons name="checkmark" size={14} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>{t(tip)}</Text>
            </View>
          ))}
        </View>
      </Mode>
    </Screen>
  )
}

const styles = StyleSheet.create({
  mode: { marginBottom: SPACING.md, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent', borderRadius: RADIUS.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.md },
  tip: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
})
