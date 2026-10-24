import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Card, Button, LoadingView, useColors } from '../components/ui'
import { usePremium, UnlockButton } from '../components/PremiumLock'
import { useAuth } from '../utils/AuthContext'
import { useT, useLanguage } from '../utils/LanguageContext'
import { shareReport } from '../utils/skin-report'
import { logError } from '../utils/errorLogger'
import { track } from '../utils/analytics'
import { SPACING, RADIUS, TYPE } from '../utils/theme'
import ProgressTabs from '../components/ProgressTabs'

const INSIDE = [
  ['person-outline', 'Your skin profile and treatments'],
  ['water-outline', 'Your morning and evening routines'],
  ['book-outline', 'What your journal shows: skin mood, what comes back, the links found'],
  ['flask-outline', 'Reactions after starting a product'],
  ['scan-outline', 'Your Dekod scans, first and latest'],
]

// Premium: a one-page PDF to show a dermatologist (like Flo's health report).
export default function SkinReportScreen() {
  const colors = useColors()
  const t = useT()
  const { language } = useLanguage()
  const { user } = useAuth()
  const premium = usePremium()
  const [questions, setQuestions] = useState('')
  const [busy, setBusy] = useState(false)

  if (premium === undefined) return <LoadingView />

  const create = async () => {
    setBusy(true)
    try {
      await shareReport(user.id, { questions, language })
      track('skin_report')
    } catch (error) {
      await logError('SkinReport_create', error)
      Alert.alert(t('Error'), t('Your report couldn’t be created. Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen back title={t('My progress')} subtitle={t('One page to show your dermatologist')}
      footer={premium ? <Button title={t('Create my report')} icon="document-text-outline" loading={busy} onPress={create} /> : <UnlockButton />}>
      <ProgressTabs current="SkinReport" />
      <Card>
        <Text style={[TYPE.overline, { color: colors.muted }]}>{t('WHAT’S INSIDE')}</Text>
        {INSIDE.map(([icon, text]) => (
          <View key={text} style={styles.row}>
            <Ionicons name={icon} size={18} color={colors.primary} />
            <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{t(text)}</Text>
          </View>
        ))}
        <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.md, lineHeight: 17 }]}>{t('Only what you logged in Skynkod. It’s not a diagnosis: your dermatologist decides.')}</Text>
      </Card>
      <Text style={[styles.section, { color: colors.muted }]}>{t('YOUR QUESTIONS FOR THE APPOINTMENT')}</Text>
      <TextInput value={questions} onChangeText={setQuestions} multiline editable={!!premium}
        placeholder={t('Can I keep using retinol with my treatment?')} placeholderTextColor={colors.muted}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} />
      <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.sm }]}>{t('Optional. They’re added at the end of your report.')}</Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.md },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  input: { minHeight: 110, borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.md, padding: SPACING.md, fontSize: 15, textAlignVertical: 'top' },
})
