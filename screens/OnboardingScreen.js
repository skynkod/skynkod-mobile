import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function OnboardingScreen({ onComplete }) {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      emoji: '✨',
      title: 'Welcome to Skynkod',
      description: 'Your AI-powered skincare companion. Track your skin journey and get personalized advice.',
    },
    {
      emoji: '📔',
      title: 'Daily Journal',
      description: 'Log your skin mood and conditions daily. Our AI learns your patterns to give better advice.',
    },
    {
      emoji: '🔄',
      title: 'Build Routines',
      description: 'Create morning and evening routines. Get reminders to stay consistent.',
    },
    {
      emoji: '✨',
      title: 'Meet Koda',
      description: 'Chat with Koda, your AI skin coach. Ask anything about skincare, routines, and skin concerns.',
    },
    {
      emoji: '📸',
      title: 'Track Progress',
      description: 'Take photos to visualize your skin improvement. See real progress over time.',
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stepContainer}>
          <Text style={styles.stepEmoji}>{step.emoji}</Text>
          <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
          <Text style={[styles.stepDescription, { color: colors.muted }]}>{step.description}</Text>
        </View>

        <View style={styles.dotsContainer}>
          {steps.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === currentStep && { backgroundColor: colors.primary, width: 32 },
                idx !== currentStep && { backgroundColor: colors.border },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.buttonContainer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.skipBtn, { borderColor: colors.border }]}
          onPress={handleSkip}
        >
          <Text style={[styles.skipBtnText, { color: colors.text }]}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBar: { height: 4, width: '100%' },
  progressFill: { height: '100%' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stepContainer: { alignItems: 'center' },
  stepEmoji: { fontSize: 80, marginBottom: 24 },
  stepTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  stepDescription: { fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 300 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 60 },
  dot: { height: 8, borderRadius: 4, width: 8 },
  buttonContainer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1 },
  skipBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  skipBtnText: { fontWeight: 'bold', fontSize: 14 },
  nextBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  nextBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
})