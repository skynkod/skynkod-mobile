import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'

export default function SkinTypeQuizScreen() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  const questions = [
    {
      id: 'q1',
      question: 'How does your skin feel by mid-afternoon?',
      options: ['Oily', 'Dry', 'Balanced', 'Tight & Flaky']
    },
    {
      id: 'q2',
      question: 'Do you experience breakouts?',
      options: ['Often', 'Rarely', 'Sometimes', 'Very rarely']
    },
    {
      id: 'q3',
      question: 'How sensitive is your skin?',
      options: ['Very sensitive', 'Somewhat', 'Not really', 'Not at all']
    },
    {
      id: 'q4',
      question: 'Does your skin feel tight after washing?',
      options: ['Always', 'Sometimes', 'Rarely', 'Never']
    },
    {
      id: 'q5',
      question: 'Do you need moisturizer?',
      options: ['No, too oily', 'Yes, definitely', 'Sometimes', 'Always']
    }
  ]

  const skinTypes = {
    oily: { name: 'Oily', emoji: '💧', tips: 'Use light moisturizers, exfoliate regularly, avoid heavy products' },
    dry: { name: 'Dry', emoji: '🏜️', tips: 'Deep moisturize daily, use hydrating serums, avoid harsh cleansers' },
    combination: { name: 'Combination', emoji: '⚖️', tips: 'Balance T-zone care with cheek hydration, use targeted products' },
    sensitive: { name: 'Sensitive', emoji: '🌸', tips: 'Use gentle products, patch test everything, avoid fragrance' },
    normal: { name: 'Normal', emoji: '✨', tips: 'Maintain routine, use balanced products, sunscreen daily' }
  }

  const handleAnswer = (answer) => {
    const newAnswers = { ...answers, [questions[step].id]: answer }
    setAnswers(newAnswers)

    if (step < questions.length - 1) {
      setStep(step + 1)
    } else {
      calculateResult(newAnswers)
    }
  }

  const calculateResult = (finalAnswers) => {
    const oilyCount = Object.values(finalAnswers).filter(a => a === 'Oily' || a === 'Often' || a === 'No, too oily').length
    const dryCount = Object.values(finalAnswers).filter(a => a === 'Dry' || a === 'Always' || a === 'Yes, definitely').length
    const sensitiveCount = Object.values(finalAnswers).filter(a => a === 'Very sensitive' || a === 'Somewhat').length

    let skinType = 'normal'
    if (sensitiveCount >= 2) skinType = 'sensitive'
    else if (oilyCount >= 3) skinType = 'oily'
    else if (dryCount >= 3) skinType = 'dry'
    else if (oilyCount >= 1 && dryCount >= 1) skinType = 'combination'

    setResult(skinType)
  }

  const handleReset = () => {
    setStep(0)
    setAnswers({})
    setResult(null)
  }

  if (result) {
    const skinTypeData = skinTypes[result]
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContent}>
          <Text style={styles.resultEmoji}>{skinTypeData.emoji}</Text>
          <Text style={styles.resultTitle}>Your Skin Type</Text>
          <Text style={styles.resultType}>{skinTypeData.name}</Text>
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Tips for You</Text>
            <Text style={styles.tipsText}>{skinTypeData.tips}</Text>
          </View>
        </ScrollView>
        <TouchableOpacity style={styles.restartBtn} onPress={handleReset}>
          <Text style={styles.restartBtnText}>Retake Quiz</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const currentQuestion = questions[step]
  const progress = ((step + 1) / questions.length) * 100

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.questionNumber}>Question {step + 1} of {questions.length}</Text>
        <Text style={styles.question}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.option}
              onPress={() => handleAnswer(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg },
  progressBar: { height: 4, backgroundColor: SKYNKOD_COLORS.border },
  progressFill: { height: '100%', backgroundColor: SKYNKOD_COLORS.primary },
  content: { flex: 1, padding: 20 },
  questionNumber: { fontSize: 12, color: SKYNKOD_COLORS.muted, marginBottom: 16 },
  question: { fontSize: 24, fontWeight: 'bold', color: SKYNKOD_COLORS.text, marginBottom: 32, lineHeight: 32 },
  optionsContainer: { gap: 12 },
  option: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 2, borderColor: SKYNKOD_COLORS.primary },
  optionText: { fontSize: 16, color: SKYNKOD_COLORS.text, fontWeight: '500' },
  resultContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  resultEmoji: { fontSize: 80, marginBottom: 20 },
  resultTitle: { fontSize: 16, color: SKYNKOD_COLORS.muted, marginBottom: 8 },
  resultType: { fontSize: 40, fontWeight: 'bold', color: SKYNKOD_COLORS.primary, marginBottom: 32 },
  tipsCard: { backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 20 },
  tipsTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 12 },
  tipsText: { color: SKYNKOD_COLORS.muted, fontSize: 14, lineHeight: 20 },
  restartBtn: { backgroundColor: SKYNKOD_COLORS.primary, padding: 16, margin: 16, borderRadius: 8 },
  restartBtnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' },
})