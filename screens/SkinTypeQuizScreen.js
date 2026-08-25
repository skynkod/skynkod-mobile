import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { updateUserProfile } from '../utils/supabase'
import { logError } from '../utils/errorLogger'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { SKIN_TYPES } from '../utils/constants'

export default function SkinTypeQuizScreen({ route }) {
  const { userId } = route.params
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const questions = [
    {
      question: 'How does your skin usually feel?',
      answers: [
        { text: 'Dry and tight', type: 'Dry' },
        { text: 'Oily and shiny', type: 'Oily' },
        { text: 'Balanced', type: 'Combination' },
        { text: 'Sensitive', type: 'Sensitive' },
      ],
    },
    {
      question: 'How does your skin react to new products?',
      answers: [
        { text: 'Gets irritated easily', type: 'Sensitive' },
        { text: 'Reacts well usually', type: 'Dry' },
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
        { text: 'Mixed concerns', type: 'Combination' },
      ],
    },
  ]

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState([])
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleAnswerSelect = (skinType) => {
    const newAnswers = [...answers, skinType]
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateResult(newAnswers)
    }
  }

  const calculateResult = (allAnswers) => {
    const counts = {}
    allAnswers.forEach(type => {
      counts[type] = (counts[type] || 0) + 1
    })

    const skinType = Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b
    )

    setResult(skinType)
  }

  const handleSaveResult = async () => {
    if (!result) return

    setSaving(true)
    try {
      const success = await updateUserProfile(userId, { skin_type: result })
      if (success) {
        Alert.alert('Success', `Your skin type is ${result}!`)
        setCurrentQuestion(0)
        setAnswers([])
        setResult(null)
      } else {
        throw new Error('Failed to save result')
      }
    } catch (error) {
      await logError('SkinTypeQuizScreen_saveResult', error, { userId, result }, 'error')
      Alert.alert('Error', 'Failed to save result. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleRetake = () => {
    setCurrentQuestion(0)
    setAnswers([])
    setResult(null)
  }

  if (result) {
    const skinTypeInfo = SKIN_TYPES.find(s => s.name === result)

    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Your Skin Type</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <Text style={styles.resultEmoji}>{skinTypeInfo?.emoji}</Text>
            <Text style={[styles.resultType, { color: colors.primary }]}>
              {result}
            </Text>
            <Text style={[styles.resultDescription, { color: colors.muted }]}>
              {skinTypeInfo?.description}
            </Text>

            <View style={[styles.characteristicsCard, { backgroundColor: colors.bg }]}>
              <Text style={[styles.characteristicsTitle, { color: colors.text }]}>
                Characteristics
              </Text>
              <Text style={[styles.characteristicsText, { color: colors.muted }]}>
                {skinTypeInfo?.characteristics.join('\n')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSaveResult}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveBtnText}>Save My Skin Type</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.retakeBtn, { borderColor: colors.primary }]}
            onPress={handleRetake}
          >
            <Text style={[styles.retakeBtnText, { color: colors.primary }]}>Retake Quiz</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  const question = questions[currentQuestion]

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Skin Type Quiz</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Question {currentQuestion + 1} of {questions.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.progressContainer}>
          {questions.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressBar,
                idx < currentQuestion && { backgroundColor: colors.primary },
                idx === currentQuestion && { backgroundColor: colors.primary },
                idx > currentQuestion && { backgroundColor: colors.border },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.question, { color: colors.text }]}>
          {question.question}
        </Text>

        <View style={styles.answersContainer}>
          {question.answers.map((answer, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.answerBtn, { borderColor: colors.primary }]}
              onPress={() => handleAnswerSelect(answer.type)}
            >
              <Text style={[styles.answerText, { color: colors.text }]}>
                {answer.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 4 },
  content: { flex: 1, padding: 16 },
  progressContainer: { flexDirection: 'row', gap: 4, marginBottom: 32 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  question: { fontSize: 20, fontWeight: 'bold', marginBottom: 24, lineHeight: 28 },
  answersContainer: { gap: 12 },
  answerBtn: { borderWidth: 2, borderRadius: 12, padding: 16, alignItems: 'center' },
  answerText: { fontSize: 14, fontWeight: '500' },
  resultCard: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24 },
  resultEmoji: { fontSize: 60, marginBottom: 16 },
  resultType: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  resultDescription: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  characteristicsCard: { borderRadius: 8, padding: 16, marginTop: 16, width: '100%' },
  characteristicsTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  characteristicsText: { fontSize: 13, lineHeight: 20 },
  saveBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  retakeBtn: { borderWidth: 2, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 24 },
  retakeBtnText: { fontWeight: '600', fontSize: 14 },
})
