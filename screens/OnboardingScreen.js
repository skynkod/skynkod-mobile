import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { logError } from '../utils/errorLogger'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'

export default function OnboardingScreen({ onComplete }) {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS
  const [step, setStep] = useState(0)

  const steps = [
    {
      title: 'Welcome to Skynkod',
      subtitle: 'Your AI Skin Coach ✨',
      description: 'Get personalized skincare recommendations tailored to your skin type and concerns.',
      emoji: '👋',
    },
    {
      title: 'Track Your Progress',
      subtitle: 'See Real Results',
      description: 'Take photos and keep daily journal entries to monitor your skin improvements.',
      emoji: '📸',
    },
    {
      title: 'Build Healthy Habits',
      subtitle: 'Consistent Care',
      description: 'Create morning and evening routines to maintain your skincare regimen.',
      emoji: '🔄',
    },
    {
      title: 'Get Expert Advice',
      subtitle: 'Chat with Koda',
      description: 'Ask Koda anything about your skin and get instant personalized recommendations.',
      emoji: '💬',
    },
  ]

  const handleNext = async () => {
    try {
      if (step < steps.length - 1) {
        setStep(step + 1)
      } else {
        await onComplete()
      }
    } catch (error) {
      await logError('OnboardingScreen_handleNext', error, { step }, 'error')
      Alert.alert('Error', 'Failed to complete onboarding')
    }
  }

  const handleSkip = async () => {
    try {
      await onComplete()
    } catch (error) {
      await logError('OnboardingScreen_handleSkip', error, {}, 'error')
      Alert.alert('Error', 'Failed to complete onboarding')
    }
  }

  const currentStep = steps[step]

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.content}>
        <Text style={[styles.emoji, { marginTop: 60 }]}>{currentStep.emoji}</Text>
        
        <Text style={[styles.title, { color: colors.text }]}>{currentStep.title}</Text>
        <Text style={[styles.subtitle, { color: colors.primary }]}>{currentStep.subtitle}</Text>
        
        <Text style={[styles.description, { color: colors.muted }]}>
          {currentStep.description}
        </Text>

        <View style={styles.progressContainer}>
          {steps.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressBar,
                idx <= step && { backgroundColor: colors.primary },
                idx > step && { backgroundColor: colors.border },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.buttons, { borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={[styles.skipBtnText, { color: colors.primary }]}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {step === steps.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  emoji: { fontSize: 80, textAlign: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 48 },
  progressContainer: { flexDirection: 'row', gap: 8, marginBottom: 48 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  buttons: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1 },
  skipBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  skipBtnText: { fontWeight: '600', fontSize: 14 },
  nextBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  nextBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
})
