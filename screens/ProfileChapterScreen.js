import React, { useCallback, useState } from 'react'
import { View, Alert, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import OnboardingScreen from './OnboardingScreen'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { getUserProfile, updateUserProfile } from '../utils/supabase'
import { fromRow, toColumns } from '../utils/skin-quiz'
import { syncSoon } from '../utils/journey'
import { logError } from '../utils/errorLogger'
import { refreshIfRekod, refreshBasicRoutine } from '../utils/rekod'
import { syncSmartReminders } from '../utils/notifications'
import { LIGHT_COLORS } from '../utils/theme'

// My Skyn Profile and "My skin issues" (Lita, 2026-10-27): she redoes one or
// more steps with the very same screens as the sign-up, already filled in,
// then comes back to where she was. route.params.chapters: e.g. ['skin'],
// ['face', 'eyes', 'lips', 'neck'], ['priority'].
export default function ProfileChapterScreen({ route, navigation }) {
  const t = useT()
  const { user } = useAuth()
  const chapters = route?.params?.chapters || ['skin']
  const [row, setRow] = useState(null)

  useFocusEffect(useCallback(() => {
    if (!user?.id) return
    setRow(null)
    getUserProfile(user.id).then(setRow).catch(error => logError('ProfileChapter_load', error))
  }, [user?.id, chapters.join()]))

  if (!row) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: LIGHT_COLORS.bg }}><ActivityIndicator color={LIGHT_COLORS.accent} /></View>

  const onDone = async (answers, health) => {
    const ok = await updateUserProfile(user.id, {
      ...toColumns(answers, health),
      // She can give the sensitive-info consent in the Safety step.
      ...(health && !row.consent_health_at ? { consent_health_at: new Date().toISOString() } : {}),
    })
    if (!ok) return Alert.alert(t('Error'), t("Couldn't save your answer. Try again."))
    syncSoon(user.id)
    // Rekod follows her health answers at once (pregnancy, diagnosis, treatment).
    // Rekod rebuilds itself; otherwise the basic routine's own picks are chosen again.
    refreshIfRekod(user.id)
      .then(done => (done ? true : refreshBasicRoutine(user.id)))
      .then(changed => { if (changed) syncSmartReminders(user.id) })
      .catch(error => logError('Routine_profileRefresh', error, {}, 'warn'))
    navigation.goBack()
  }

  return (
    <OnboardingScreen
      key={chapters.join()}
      userId={user?.id}
      mode={{ chapters, answers: fromRow(row), row, onDone, onCancel: () => navigation.goBack() }}
    />
  )
}
