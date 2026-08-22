import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0)

  const slides = [
    {
      title: '✨ Welcome to Skynkod',
      description: 'Your personal skincare companion powered by AI',
      emoji: '🌟'
    },
    {
      title: '📔 Track Daily',
      description: 'Journal your skin conditions and mood every day',
      emoji: '📔'
    },
    {
      title: '🤖 Get AI Advice',
      description: 'Koda, your AI coach, gives personalized skincare tips',
      emoji: '🤖'
    },
    {
      title: '📊 See Progress',
      description: 'Watch your skin improve with detailed charts and stats',
      emoji: '📊'
    },
    {
      title: '💪 Build Routines',
      description: 'Create and manage your perfect skincare routine',
      emoji: '💪'
    },
  ]

  const current = slides[step]

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>{current.emoji}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.description}</Text>

        <View style={styles.dots}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[styles.dot, idx === step && styles.dotActive]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipBtnText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {step === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SKYNKOD_COLORS.bg,
    paddingTop: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SKYNKOD_COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: SKYNKOD_COLORS.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 48,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SKYNKOD_COLORS.border,
  },
  dotActive: {
    backgroundColor: SKYNKOD_COLORS.primary,
    width: 24,
  },
  buttons: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: SKYNKOD_COLORS.primary,
    borderRadius: 8,
  },
  skipBtnText: {
    color: SKYNKOD_COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: SKYNKOD_COLORS.primary,
    borderRadius: 8,
  },
  nextBtnText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
})