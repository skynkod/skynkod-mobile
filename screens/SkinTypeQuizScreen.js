import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { updateUserProfile } from '../utils/supabase'
import { logError } from '../utils/errorLogger'
import { SKIN_TYPES } from '../utils/constants'
import { Screen, Card, Button, ProgressBar, useColors } from '../components/ui'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

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
      <Screen back title="Your skin type">
        <Card tone="soft" style={styles.resultCard}>
          <Text style={styles.resultEmoji}>{info?.emoji || '✨'}</Text>
          <Text style={[TYPE.display, { color: colors.primary }]}>{result}</Text>
          <Text style={[TYPE.body, { color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>{info?.description}</Text>
        </Card>
        {saved ? (
          <View style={[styles.savedRow, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[TYPE.bodyStrong, { color: colors.success }]}>Saved — your routines now use it</Text>
          </View>
        ) : (
          <Button title="Save my skin type" onPress={save} loading={saving} />
        )}
        <Button title="Retake quiz" variant="ghost" onPress={restart} style={{ marginTop: SPACING.sm }} />
      </Screen>
    )
  }

  const q = QUESTIONS[current]
  return (
    <Screen back overline={`Question ${current + 1} of ${QUESTIONS.length}`} title="Skin type quiz">
      <ProgressBar value={(current + 1) / QUESTIONS.length} style={{ marginBottom: SPACING.xxl }} />
      <Text style={[TYPE.heading, { color: colors.text, marginBottom: SPACING.xl }]}>{q.question}</Text>
      {q.answers.map(a => (
        <Pressable
          key={a.text}
          onPress={() => choose(a.type)}
          style={({ pressed }) => [
            styles.answer,
            { backgroundColor: pressed ? colors.primarySoft : colors.card, borderColor: pressed ? colors.primary : colors.border },
          ]}
        >
          <Text style={[TYPE.bodyStrong, { color: colors.text, flex: 1 }]}>{a.text}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  resultCard: { alignItems: 'center', paddingVertical: SPACING.xxxl, marginBottom: SPACING.xl },
  resultEmoji: { fontSize: 56, marginBottom: SPACING.md },
  savedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, padding: SPACING.lg, borderRadius: RADIUS.md },
  answer: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 1.5, marginBottom: SPACING.md },
})
