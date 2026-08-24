import { useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { supabase } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

const SKIN_TYPES = {
  oily: { name: 'Oily', emoji: '💧', color: '#FFB347' },
  dry: { name: 'Dry', emoji: '🏜️', color: '#D2B48C' },
  combination: { name: 'Combination', emoji: '⚖️', color: '#DDA0DD' },
  sensitive: { name: 'Sensitive', emoji: '🌸', color: '#FFB6C1' },
  normal: { name: 'Normal', emoji: '✨', color: '#90EE90' },
}

const QUESTIONS = [
  {
    id: 1,
    question: 'How does your skin feel by midday?',
    answers: [
      { text: 'Very oily', type: 'oily' },
      { text: 'Slightly oily', type: 'combination' },
      { text: 'Normal', type: 'normal' },
      { text: 'Dry or tight', type: 'dry' },
    ],
  },
  {
    id: 2,
    question: 'How does your skin react to new products?',
    answers: [
      { text: 'Gets irritated easily', type: 'sensitive' },
      { text: 'Sometimes irritated', type: 'combination' },
      { text: 'Handles well', type: 'normal' },
      { text: 'Very resilient', type: 'oily' },
    ],
  },
  {
    id: 3,
    question: 'Do you experience breakouts?',
    answers: [
      { text: 'Frequently', type: 'oily' },
      { text: 'Occasionally', type: 'combination' },
      { text: 'Rarely', type: 'normal' },
      { text: 'Never, just dryness', type: 'dry' },
    ],
  },
  {
    id: 4,
    question: 'How is your skin moisture level?',
    answers: [
      { text: 'Always dry', type: 'dry' },
      { text: 'Dry in some areas', type: 'combination' },
      { text: 'Well-balanced', type: 'normal' },
      { text: 'Always oily', type: 'oily' },
    ],
  },
  {
    id: 5,
    question: 'Does your skin get red easily?',
    answers: [
      { text: 'Yes, very reactive', type: 'sensitive' },
      { text: 'Sometimes in T-zone', type: 'combination' },
      { text: 'Not really', type: 'normal' },
      { text: 'No, very resilient', type: 'oily' },
    ],
  },
]

export default function SkinTypeQuizScreen({ route }) {
  const { userId } = route.params || {}
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [scores, setScores] = useState({
    oily: 0,
    dry: 0,
    combination: 0,
    sensitive: 0,
    normal: 0,
  })
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleAnswerSelect = (skinType) => {
    const newScores = { ...scores }
    newScores[skinType] += 1
    setScores(newScores)

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      determineResult(newScores)
    }
  }

  const determineResult = (finalScores) => {
    let maxScore = 0
    let resultType = 'normal'

    Object.entries(finalScores).forEach(([type, score]) => {
      if (score > maxScore) {
        maxScore = score
        resultType = type
      }
    })

    setResult(resultType)
    setShowResult(true)
  }

  const handleSaveResult = async () => {
    if (!userId) {
      Alert.alert('Error', 'User not logged in')
      return
    }

    setSaving(true)
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('users')
        .update({ skin_type: result })
        .eq('id', userId)

      if (error) throw error

      Alert.alert('Success', `Your skin type is ${SKIN_TYPES[result].name}!`)
      setCurrentQuestion(0)
      setScores({ oily: 0, dry: 0, combination: 0, sensitive: 0, normal: 0 })
      setShowResult(false)
      setResult(null)
    } catch (error) {
      console.error('Save result error:', error)
      Alert.alert('Error', 'Failed to save result')
    } finally {
      setSaving(false)
    }
  }

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0)
    setScores({ oily: 0, dry: 0, combination: 0, sensitive: 0, normal: 0 })
    setShowResult(false)
    setResult(null)
  }

  if (showResult && result) {
    const skinType = SKIN_TYPES[result]
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Your Skin Type</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.resultContent}>
          <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <Text style={styles.resultEmoji}>{skinType.emoji}</Text>
            <Text style={[styles.resultType, { color: colors.text }]}>{skinType.name}</Text>

            <View style={[styles.tipsCard, { backgroundColor: colors.bg }]}>
              <Text style={[styles.tipsTitle, { color: colors.text }]}>Skincare Tips:</Text>
              {result === 'oily' && (
                <>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Use oil-free cleansers</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Apply lightweight moisturizers</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Use sunscreen daily</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Try clay masks weekly</Text>
                </>
              )}
              {result === 'dry' && (
                <>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Use hydrating cleansers</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Apply rich moisturizers</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Use serums with hyaluronic acid</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Avoid hot water</Text>
                </>
              )}
              {result === 'combination' && (
                <>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Use gentle cleansers</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Target products by zone</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Balance moisturization</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Use mattifying products on T-zone</Text>
                </>
              )}
              {result === 'sensitive' && (
                <>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Use hypoallergenic products</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Patch test new products</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Avoid fragrance</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Use minimal ingredients</Text>
                </>
              )}
              {result === 'normal' && (
                <>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Maintain a consistent routine</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Use balanced products</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Focus on prevention</Text>
                  <Text style={[styles.tip, { color: colors.muted }]}>• Use sunscreen daily</Text>
                </>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.buttonContainer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={handleRetakeQuiz}
            disabled={saving}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Retake Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSaveResult}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Save Result</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const question = QUESTIONS[currentQuestion]
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Skin Type Quiz</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Question {currentQuestion + 1} of {QUESTIONS.length}</Text>
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.quizContent}>
        <Text style={[styles.question, { color: colors.text }]}>{question.question}</Text>

        <View style={styles.answersContainer}>
          {question.answers.map((answer, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.answerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleAnswerSelect(answer.type)}
            >
              <Text style={[styles.answerText, { color: colors.text }]}>{answer.text}</Text>
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
  progressBar: { height: 4, width: '100%' },
  progressFill: { height: '100%' },
  content: { flex: 1 },
  quizContent: { padding: 20, justifyContent: 'center' },
  resultContent: { padding: 20, justifyContent: 'center', alignItems: 'center' },
  question: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, lineHeight: 28 },
  answersContainer: { gap: 12 },
  answerBtn: { borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  answerText: { fontSize: 14, fontWeight: '500' },
  resultCard: { borderRadius: 12, padding: 24, alignItems: 'center', width: '100%' },
  resultEmoji: { fontSize: 80, marginBottom: 12 },
  resultType: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  tipsCard: { borderRadius: 12, padding: 16, width: '100%', marginBottom: 20 },
  tipsTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 12 },
  tip: { fontSize: 12, marginBottom: 8, lineHeight: 18 },
  buttonContainer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1 },
  primaryBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  secondaryBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  secondaryBtnText: { fontWeight: 'bold', fontSize: 14 },
})