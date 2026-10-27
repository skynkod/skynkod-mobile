import React, { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter'
import { LoadingView } from '../components/ui'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { getUserProfile } from '../utils/supabase'
import { getCondition, CONCERN_CONDITIONS, SUSPICION_CONDITION } from '../utils/encyclopedia/conditions'
import { fromRow, computeSkinType, suspicionsFrom, SUSPICIONS, DOCTOR_NOTE, prioritiesOf } from '../utils/skin-quiz'
import { logError } from '../utils/errorLogger'
import { fromAnswers, Backdrop, Bubble, LineIcon, GLOSSY as C, STEPS, CONCERN_LABEL, AGES, SAFETY, LIFE_CARDS } from './OnboardingScreen'
import { rxName } from '../utils/treatments'

// My Skyn Profile (Lita, 2026-10-27): the 7 steps of the sign-up, in the same
// glossy style, each with what she answered. Tapping a step replays it with
// the sign-up's own screens (ProfileChapterScreen), already filled in.
const PREFS = { fragrance_free: 'Fragrance-free', vegan: 'Vegan' }

export default function SkinProfileScreen({ navigation }) {
  const t = useT()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [row, setRow] = useState(null)
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold })
  const F = fontsLoaded
    ? { r: { fontFamily: 'Inter_400Regular' }, m: { fontFamily: 'Inter_500Medium' }, s: { fontFamily: 'Inter_600SemiBold' } }
    : { r: {}, m: { fontWeight: '500' }, s: { fontWeight: '600' } }

  useFocusEffect(useCallback(() => {
    if (!user?.id) return
    getUserProfile(user.id).then(setRow).catch(error => logError('SkinProfile_load', error))
  }, [user?.id]))
  if (!row) return <LoadingView />

  const a = fromRow(row)
  const P = fromAnswers(a, row)
  const health = !!row.consent_health_at
  const type = computeSkinType(a) || row.skin_type
  const { main, second } = prioritiesOf(a)
  const concerns = a.concerns || []
  const suspected = health ? suspicionsFrom(a) : []
  const open = chapters => navigation.navigate('ProfileChapter', { chapters })
  const list = items => items.filter(Boolean).join(' · ')
  const titles = picks => picks.map(o => t(o.t))

  // What she answered, step by step (empty = nothing to report).
  const summary = {
    skin: list([type ? `${t(type)}${a.reactivity === 'often' ? ` · ${t('Sensitive')}` : ''}` : null, P.age != null ? AGES[P.age] : null, ...P.goals.map(g => t(g.t))]),
    face: list([...P.faceZones.map(z => t(z.t)), ...titles(P.face)]),
    eyes: list(titles(P.eyes)),
    lips: list(titles(P.lips)),
    neck: list(titles(P.neck)),
    life: list([P.sleep != null ? t('{n} h of sleep', { n: P.sleep }) : null, ...(P.lifeYes || []).map((yes, i) => (yes ? t(LIFE_CARDS[i].t) : null))]),
    safety: list([
      ...(health ? [...P.preg.map(x => t(SAFETY[0].o.find(o => o[0] === x)?.[1] || x)), ...(a.avoid || []).map(x => t('No {x}', { x: x.toLowerCase() })), ...(a.conditions || []).map(x => t(x)), ...(a.meds || []).map(m => t(rxName(m, a.medsOther || '')))] : [t('Sensitive information not shared')]),
      ...P.prefs.map(x => t(PREFS[x] || x)),
    ]),
  }
  const label = c => t(CONCERN_LABEL[c] || c)

  return (
    <View style={{ flex: 1 }}>
      <Backdrop />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.bar}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel={t('Back')}><Ionicons name="arrow-back" size={22} color={C.ink} /></Pressable>
        </View>
        <Text style={[F.s, styles.h1]}>{t('My Skyn Profile')}</Text>
        <Text style={[F.r, styles.hint]}>{t('Tap a step to update your answers.')}</Text>

        {/* Her priorities: they lead every recommendation. */}
        <Pressable disabled={concerns.length < 2} onPress={() => open(['priority'])} style={[styles.glass, { marginTop: 18 }]}>
          <View style={styles.rowHead}>
            <LineIcon name="sparkles" size={20} />
            <Text style={[F.s, styles.k]}>{t('Your priority')}</Text>
            {concerns.length >= 2 ? <Ionicons name="chevron-forward" size={18} color={C.mauve2} /> : null}
          </View>
          <Text style={[F.s, styles.value]}>{main ? `1. ${label(main)}${second ? `   2. ${label(second)}` : ''}` : t('Nothing to work on yet')}</Text>
          {main && CONCERN_CONDITIONS[main] ? (
            <View style={styles.chips}>
              {CONCERN_CONDITIONS[main].map(id => (
                <Pressable key={id} onPress={() => navigation.navigate('Condition', { id })} style={styles.chip}>
                  <Text style={[F.m, { fontSize: 12, color: C.mauve }]}>{t(getCondition(id).title)} ›</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Pressable>

        {/* What might be behind some photos: never a diagnosis. */}
        {suspected.map(id => (
          <View key={id} style={[styles.glass, { marginTop: 10 }]}>
            <Text style={[F.s, { fontSize: 14.5, color: C.ink }]}>{t(SUSPICIONS[id].title)}</Text>
            <Text style={[F.r, styles.small]}>{t(DOCTOR_NOTE)}</Text>
            {SUSPICION_CONDITION[id] ? (
              <Pressable onPress={() => navigation.navigate('Condition', { id: SUSPICION_CONDITION[id] })} hitSlop={6}>
                <Text style={[F.s, { fontSize: 12.5, color: C.mauve, marginTop: 6 }]}>{t('What it is, what helps and the treatments')} ›</Text>
              </Pressable>
            ) : null}
          </View>
        ))}

        {/* The 7 steps, like the journey map. */}
        <View style={[styles.glass, { marginTop: 14, paddingVertical: 4 }]}>
          {STEPS.map((s, i) => (
            <Pressable key={s.z} onPress={() => open([s.z])} style={[styles.step, i === STEPS.length - 1 && { borderBottomWidth: 0 }]} accessibilityRole="button">
              <Bubble name={s.i} size={50} />
              <View style={{ flex: 1 }}>
                <Text style={[F.s, { fontSize: 15, color: C.ink }]}>{t(s.t)}</Text>
                <Text style={[F.r, styles.small, { marginTop: 1 }]} numberOfLines={2}>{summary[s.z] || t('Nothing to report')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.mauve2} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const glass = { backgroundColor: 'rgba(255,255,255,0.62)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 18, shadowColor: '#AA789B', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 }
const styles = StyleSheet.create({
  bar: { height: 36, justifyContent: 'center', marginBottom: 6 },
  h1: { fontSize: 28, lineHeight: 33, letterSpacing: -0.6, color: '#2F2230' },
  hint: { fontSize: 13.5, lineHeight: 19, color: '#6E5F6B', marginTop: 4 },
  glass: { ...glass, padding: 14 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  k: { flex: 1, fontSize: 11, color: '#A0909B', letterSpacing: 0.5, textTransform: 'uppercase' },
  value: { fontSize: 16, color: '#2F2230', marginTop: 6 },
  small: { fontSize: 12.5, lineHeight: 17, color: '#6E5F6B', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { backgroundColor: 'rgba(246,226,238,0.95)', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(234,220,229,0.7)' },
})
