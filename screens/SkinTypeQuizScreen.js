import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function SkinTypeQuizScreen() {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [scores, setScores] = useState({ dry: 0, oily: 0, combination: 0, sensitive: 0 })
  const [showResult, setShowResult] = useState(false)
  const [skinType, setSkinType] = useState('')

  const questions = [
    {
      q: 'How does your skin feel after washing?',
      answers: [
        { text: 'Tight and dry', type: 'dry' },
        { text: 'Oily and shiny', type: 'oily' },
        { text: 'Mixed - some areas dry, some oily', type: 'combination' },
        { text: 'Uncomfortable and irritated', type: 'sensitive' },
      ],
    },
    {
      q: 'How often do you experience breakouts?',
      answers: [
        { text: 'Rarely', type: 'dry' },
        { text: 'Very often', type: 'oily' },
        { text: 'Sometimes in T-zone', type: 'combination' },
        { text: 'Frequently with redness', type: 'sensitive' },
      ],
    },
    {
      q: 'How does your skin look in the mirror?',
      answers: [
        { text: 'Matte and flaky', type: 'dry' },
        { text: 'Shiny and greasy', type: 'oily' },
        { text: 'Shiny in some areas, matte in others', type: 'combination' },
        { text: 'Red and reactive', type: 'sensitive' },
      ],
    },
    {
      q: 'How does your skin react to new products?',
      answers: [
        { text: 'Gets more flaky', type: 'dry' },
        { text: 'Gets more oily', type: 'oily' },
        { text: 'Mixed reactions', type: 'combination' },
        { text: 'Burns or stings', type: 'sensitive' },
      ],
    },
    {
      q: 'How would you describe your pores?',
      answers: [
        { text: 'Barely visible', type: 'dry' },
        { text: 'Large and visible', type: 'oily' },
        { text: 'Large in T-zone', type: 'combination' },
        { text: 'Easily irritated', type: 'sensitive' },
      ],
    },
  ]

  const handleAnswer = (type) => {
    const newScores = { ...scores, [type]: scores[type] + 1 }
    setScores(newScores)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      determineSkinnType(newScores)
    }
  }

  const determineSkinnType = (finalScores) => {
    const maxType = Object.keys(finalScores).reduce((a, b) =>
      finalScores[a] > finalScores[b] ? a : b
    )
    setSkinType(maxType)
    setShowResult(true)
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setScores({ dry: 0, oily: 0, combination: 0, sensitive: 0 })
    setShowResult(false)
    setSkinType('')
  }

  const getSkinTypeDescription = () => {
    const descriptions = {
      dry: {
        emoji: '🏜️',
        title: 'Dry Skin',
        description: 'Your skin lacks moisture and may feel tight or flaky. Focus on hydrating products and avoid harsh cleansers.',
        tips: ['Use gentle hydrating cleansers', 'Apply rich moisturizers', 'Use hydrating serums', 'Avoid hot water'],
      },
      oily: {
        emoji: '💧',
        title: 'Oily Skin',
        description: 'Your skin produces excess sebum and may appear shiny. Focus on mattifying products and light hydration.',
        tips: ['Use oil-control cleansers', 'Apply lightweight moisturizers', 'Use clay masks weekly', 'Avoid heavy creams'],
      },
      combination: {
        emoji: '⚖️',
        title: 'Combination Skin',
        description: 'Your skin has both dry and oily areas, typically in the T-zone. Use targeted products for different areas.',
        tips: ['Use gentle cleansers', 'Mattify T-zone only', 'Hydrate dry areas', 'Use lightweight moisturizers'],
      },
      sensitive: {
        emoji: '🌸',
        title: 'Sensitive Skin',
        description: 'Your skin is reactive and easily irritated. Focus on calming products and avoid potential irritants.',
        tips: ['Use gentle products', 'Avoid fragrance', 'Patch test new products', 'Use soothing ingredients'],
      },
    }
    return descriptions[skinType] || descriptions.combination
  }

  if (showResult) {
    const result = getSkinTypeDescription()
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Your Skin Type</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <Text style={styles.resultEmoji}>{result.emoji}</Text>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{result.title}</Text>
            <Text style={[styles.resultDesc, { color: colors.muted }]}>{result.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommended Tips:</Text>
            {result.tips.map((tip, idx) => (
              <View key={idx} style={[styles.tipCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.tipNumber, { color: colors.primary }]}>{idx + 1}</Text>
                <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.retakeBtn, { backgroundColor: colors.primary }]}
            onPress={resetQuiz}
          >
            <Text style={styles.retakeBtnText}>Retake Quiz</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Skin Type Quiz</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Question {currentQuestion + 1} of {questions.length}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentQuestion + 1) / questions.length) * 100}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>

        <View style={styles.questionContainer}>
          <Text style={[styles.question, { color: colors.text }]}>
            {questions[currentQuestion].q}
          </Text>

          <View style={styles.answersContainer}>
            {questions[currentQuestion].answers.map((answer, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.answerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleAnswer(answer.type)}
              >
                <Text style={[styles.answerText, { color: colors.text }]}>{answer.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  progressBar: { height: 6, borderRadius: 3, marginBottom: 24, overflow: 'hidden' },
  progressFill: { height: '100%' },
  questionContainer: { marginBottom: 24 },
  question: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, lineHeight: 24 },
  answersContainer: { gap: 12 },
  answerBtn: { padding: 16, borderRadius: 12, borderWidth: 1 },
  answerText: { fontSize: 14, fontWeight: '500' },
  resultCard: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24 },
  resultEmoji: { fontSize: 60, marginBottom: 12 },
  resultTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  resultDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  tipCard: { flexDirection: 'row', borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'flex-start' },
  tipNumber: { fontSize: 18, fontWeight: 'bold', marginRight: 12, minWidth: 30 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
  retakeBtn: { padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 24 },
  retakeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
})