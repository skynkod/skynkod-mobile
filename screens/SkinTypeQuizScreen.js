import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { updateUserProfile } from '../utils/supabase'
import { logError } from '../utils/errorLogger'
import { SKIN_TYPES } from '../utils/constants'
import { Screen, Card, Button, useColors } from '../components/ui'
import { SPACING, RADIUS } from '../utils/theme'
import { GTYPE, GFW } from '../components/glossy'

const QUESTIONS = [
  {
    question: 'How does your skin usually feel?',
    answers: [
      { text: 'Dry and tight', type: 'Dry' },
      { text: 'Oily and shiny', type: 'Oily' },
      { text: 'Oily T-zone, dry cheeks', type: 'Combination' },
      { text: 'Easily irritated', type: 'Sensitive' },
    ],
  },
  {
    question: 'How does your skin react to new products?',
    answers: [
      { text: 'Gets irritated easily', type: 'Sensitive' },
      { text: 'Usually fine, sometimes tight', type: 'Dry' },
      { text: 'No major reactions', type: 'Oily' },
      { text: 'Varies by area', type: 'Combination' },
    ],
  },
  {
    question: 'What is your main skin concern?',
    answers: [
      { text: 'Acne and oiliness', type: 'Oily' },
      { text: 'Dryness and flaking', type: 'Dry' },
      { text: 'Sensitivity and redness', type: 'Sensitive' },
      { text: 'A bit of everything', type: 'Combination' },
    ],
  },
]

export default function SkinTypeQuizScreen({ route }) {
  const { userId } = route.params
  const colors = useColors()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const choose = (type) => {
    const next = [...answers, type]
    setAnswers(next)
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1)
      return
    }
    const counts = next.reduce((acc, t) => ({ ...acc, [t]: (acc[t] || 0) + 1 }), {})
    setResult(Object.keys(counts).reduce((a, b) => (counts[a] >= counts[b] ? a : b)))
  }

  const restart = () => {
    setCurrent(0)
    setAnswers([])
    setResult(null)
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    try {
      const ok = await updateUserProfile(userId, { skin_type: result })
      if (!ok) throw new Error('Failed to save result')
      setSaved(true)
    } catch (error) {
      await logError('SkinTypeQuizScreen_save', error, { userId, result })
      Alert.alert('Error', 'Failed to save result. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (result) {
    // SKIN_TYPES is keyed by lowercase type ({ oily: {...}, dry: {...} }), not an array.
    const info = SKIN_TYPES[result.toLowerCase()] || Object.values(SKIN_TYPES).find(s => s.name === result)
    return (
      <Screen back>
        <Text style={[GTYPE.overline, { color: colors.primary, marginTop: SPACING.xl }]}>Your skin type</Text>
        <Card tone="soft" style={styles.resultCard}>
          <Text style={[styles.headline, { color: colors.primary, textAlign: 'center' }]}>{result}</Text>
          <Text style={[GTYPE.body, { color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>{info?.description}</Text>
        </Card>
        {saved ? (
          <View style={[styles.savedRow, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[GTYPE.bodyStrong, { color: colors.success }]}>Saved — your routines now use it</Text>
          </View>
        ) : (
          <Button title="Save my skin type" onPress={save} loading={saving} />
        )}
        <Button title="Retake quiz" variant="ghost" onPress={restart} style={{ marginTop: SPACING.sm }} />
      </Screen>
    )
  }

  const q = QUESTIONS[current]
  // Same look as the onboarding: thin progress line, big headline, pill answers.
  return (
    <Screen back>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((current + 1) / QUESTIONS.length) * 100}%` }]} />
      </View>
      <Text style={[GTYPE.overline, { color: colors.primary, marginTop: SPACING.xl }]}>{`Question ${current + 1} of ${QUESTIONS.length}`}</Text>
      <Text style={[styles.headline, { color: colors.text }]}>{q.question}</Text>
      <View style={styles.choices}>
        {q.answers.map(a => (
          <Pressable
            key={a.text}
            onPress={() => choose(a.type)}
            style={({ pressed }) => [
              styles.choice,
              { backgroundColor: pressed ? colors.primarySoft : colors.card, borderColor: pressed ? colors.primary : colors.border, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <Text style={[styles.choiceLabel, { color: colors.text }]}>{a.text}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  resultCard: { alignItems: 'center', paddingVertical: SPACING.xxxl, marginTop: SPACING.lg, marginBottom: SPACING.xl },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: SPACING.sm },
  progressFill: { height: 3, borderRadius: 2 },
  headline: { fontSize: 32, ...GFW('700'), letterSpacing: -0.8, lineHeight: 38, marginTop: SPACING.sm },
  choices: { marginTop: SPACING.xxl, gap: SPACING.sm },
  choice: { borderRadius: 999, borderWidth: 1, paddingVertical: 16, paddingHorizontal: SPACING.xl },
  choiceLabel: { fontSize: 16, ...GFW('600') },
  savedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.lg, borderRadius: RADIUS.md },
})
