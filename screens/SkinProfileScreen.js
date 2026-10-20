import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Screen, LoadingView, Button, useColors } from '../components/ui'
import QuizQuestion from '../components/QuizQuestion'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { getUserProfile, updateUserProfile } from '../utils/supabase'
import { CHAPTERS, QUESTIONS, fromRow, toColumns, answerLabel, computeSkinType, suspicionsFrom, SUSPICIONS, DOCTOR_NOTE } from '../utils/skin-quiz'
import { logError } from '../utils/errorLogger'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

// Every sign-up answer, editable anytime: a new diagnosis, a new treatment,
// a change of mind. Saved straight away.
export default function SkinProfileScreen({ navigation }) {
  const colors = useColors()
  const t = useT()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [row, setRow] = useState(null)
  const [answers, setAnswers] = useState(null)
  const [editing, setEditing] = useState(null) // question id
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)

  useFocusEffect(useCallback(() => {
    if (!user?.id) return
    getUserProfile(user.id).then(r => { setRow(r); setAnswers(fromRow(r)) }).catch(error => logError('SkinProfile_load', error))
  }, [user?.id]))

  if (!answers) return <LoadingView />
  const health = !!row?.consent_health_at

  const save = async () => {
    const next = { ...answers, [editing]: draft }
    setSaving(true)
    const ok = await updateUserProfile(user.id, toColumns(next, health))
    setSaving(false)
    if (!ok) return Alert.alert(t('Error'), t("Couldn't save your answer. Try again."))
    setAnswers(next)
    setEditing(null)
  }

  const open = (q) => { setDraft(answers[q.id] ?? (q.type === 'multi' ? [] : null)); setEditing(q.id) }
  const q = QUESTIONS.find(x => x.id === editing)
  const suspected = health ? suspicionsFrom(answers) : []

  return (
    <Screen back title={t('My skin profile')} subtitle={t('Change any answer, anytime.')}>
      <View style={[styles.summary, { backgroundColor: colors.primarySoft }]}>
        <Text style={[TYPE.overline, { color: colors.primary }]}>{t('Your skin type')}</Text>
        <Text style={[TYPE.heading, { color: colors.text, marginTop: 2 }]}>
          {computeSkinType(answers) ? t(computeSkinType(answers)) : row?.skin_type ? t(row.skin_type) : t('To discover')}
          {answers.reactivity === 'often' ? ` · ${t('Sensitive')}` : ''}
        </Text>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4 }]}>{t('Calculated from your skin test.')}</Text>
      </View>

      {suspected.map(id => (
        <View key={id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(SUSPICIONS[id].title)}</Text>
          <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>{t(DOCTOR_NOTE)}</Text>
          <Text style={[TYPE.caption, { color: colors.muted, marginTop: 4, lineHeight: 18 }]}>{t('Seen a doctor? Update your answers below: diagnosed conditions, or remove the sign if it was something else.')}</Text>
        </View>
      ))}

      {CHAPTERS.map(chapter => {
        const list = QUESTIONS.filter(x => x.chapter === chapter.id && (!x.showIf || x.showIf(answers)))
        if (!list.length) return null
        const locked = list.every(x => x.sensitive) && !health
        return (
          <View key={chapter.id} style={{ marginTop: SPACING.xl }}>
            <Text style={[TYPE.overline, { color: colors.muted, marginBottom: SPACING.sm }]}>{t(chapter.label)}</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, paddingVertical: 0 }]}>
              {locked ? (
                <Pressable onPress={() => navigation.navigate('Privacy')} style={styles.row}>
                  <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>{t('Turn on “Sensitive skin information” in Privacy to answer these questions.')}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                </Pressable>
              ) : list.filter(x => health || !x.sensitive).map((x, i, arr) => (
                <Pressable key={x.id} onPress={() => open(x)} style={[styles.row, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[TYPE.caption, { color: colors.muted }]}>{t(x.title)}</Text>
                    <Text style={[TYPE.bodyStrong, { color: answerLabel(x, answers[x.id]) ? colors.text : colors.muted, marginTop: 2 }]}>
                      {answerLabel(x, answers[x.id]) ? answerLabel(x, answers[x.id]).split(' · ').map(l => t(l)).join(' · ') : t('Not answered')}
                    </Text>
                  </View>
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </Pressable>
              ))}
            </View>
          </View>
        )
      })}

      <Modal visible={!!q} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditing(null)}>
        <View style={{ flex: 1, backgroundColor: colors.bg, paddingBottom: insets.bottom + SPACING.md }}>
          <View style={styles.modalBar}>
            <Pressable onPress={() => setEditing(null)} hitSlop={12}><Text style={[TYPE.bodyStrong, { color: colors.muted }]}>{t('Cancel')}</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: SPACING.xl }}>
            {q ? <QuizQuestion question={q} value={draft} onChange={setDraft} compact /> : null}
          </ScrollView>
          <View style={{ paddingHorizontal: SPACING.xl }}>
            <Button title={t('Save')} onPress={save} loading={saving} />
          </View>
        </View>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  summary: { borderRadius: RADIUS.lg, padding: SPACING.lg, marginTop: SPACING.sm },
  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, marginTop: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  modalBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg },
})
