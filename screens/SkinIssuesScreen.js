import React, { useCallback, useState } from 'react'
import { View, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Screen, LoadingView, Button } from '../components/ui'
import IssuePicker from '../components/IssuePicker'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { getUserProfile, updateUserProfile } from '../utils/supabase'
import { fromRow, toColumns } from '../utils/skin-quiz'
import { syncSoon } from '../utils/journey'
import { logError } from '../utils/errorLogger'
import { refreshIfRekod } from '../utils/rekod'
import { syncSmartReminders } from '../utils/notifications'
import { SPACING } from '../utils/theme'

// "+ New skin issue" from the journal (Lita, 2026-10-25): the same photos as
// at sign-up, to add a new issue or remove one that's gone.
export default function SkinIssuesScreen({ navigation }) {
  const t = useT()
  const { user } = useAuth()
  const [row, setRow] = useState(null)
  const [issues, setIssues] = useState([])
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => {
    if (!user?.id) return
    getUserProfile(user.id).then(r => { setRow(r); setIssues(fromRow(r).issues || []) }).catch(error => logError('SkinIssues_load', error))
  }, [user?.id]))

  if (!row) return <LoadingView />
  const health = !!row.consent_health_at

  const save = async () => {
    setSaving(true)
    const ok = await updateUserProfile(user.id, toColumns({ ...fromRow(row), issues }, health))
    setSaving(false)
    if (!ok) return Alert.alert(t('Error'), t("Couldn't save your answer. Try again."))
    syncSoon(user.id)
    // Rekod follows her health answers at once (pregnancy, diagnosis, treatment).
    refreshIfRekod(user.id).then(done => { if (done) syncSmartReminders(user.id) }).catch(error => logError('Rekod_safetyRefresh', error, {}, 'warn'))
    navigation.goBack()
  }

  return (
    <Screen back title={t('My skin issues')} subtitle={t('Tap every photo that looks like your skin. As many as you like.')}>
      <IssuePicker value={issues} onChange={setIssues} health={health} />
      <View style={{ marginTop: SPACING.xl }}>
        <Button title={t('Save')} onPress={save} loading={saving} />
      </View>
    </Screen>
  )
}
