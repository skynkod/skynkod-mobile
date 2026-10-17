import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native'
import { logError } from '../utils/errorLogger'
import { Screen, Button, IconCircle, useColors } from '../components/ui'
import { SPACING, TYPE } from '../utils/theme'

const STEPS = [
  {
    icon: 'sparkles',
    title: 'Welcome to Skynkod',
    subtitle: 'Your AI skin coach',
    description: 'Get personalized skincare advice tailored to your skin type and concerns.',
  },
  {
    icon: 'camera',
    title: 'Track your progress',
    subtitle: 'See real results',
    description: 'Take photos and keep a daily journal to watch your skin improve over time.',
  },
  {
    icon: 'water',
    title: 'Build healthy habits',
    subtitle: 'Consistent care',
    description: 'Follow morning and evening routines built around your skin.',
  },
  {
    icon: 'chatbubbles',
    title: 'Ask Koda anything',
    subtitle: 'Expert advice, instantly',
    description: 'Chat with Koda about ingredients, products and breakouts — any time.',
  },
]

export default function OnboardingScreen({ onComplete }) {
  const colors = useColors()
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  const finish = async () => {
    try {
      await onComplete()
    } catch (error) {
      await logError('OnboardingScreen_finish', error, { step })
      Alert.alert('Error', 'Failed to complete onboarding')
    }
  }

  return (
    <Screen
      scroll={false}
      right={
        !isLast ? (
          <Pressable onPress={finish} hitSlop={10}>
            <Text style={[TYPE.bodyStrong, { color: colors.muted }]}>Skip</Text>
          </Pressable>
        ) : null
      }
      footer={
        <View style={{ gap: SPACING.md, paddingVertical: SPACING.sm }}>
          <View style={styles.dots}>
            {STEPS.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  { backgroundColor: idx === step ? colors.primary : colors.border, width: idx === step ? 24 : 8 },
                ]}
              />
            ))}
          </View>
          <Button title={isLast ? 'Get started' : 'Next'} onPress={isLast ? finish : () => setStep(step + 1)} icon={isLast ? undefined : 'arrow-forward'} />
        </View>
      }
    >
      <View style={styles.body}>
        <View style={[styles.halo, { backgroundColor: colors.primarySoft }]}>
          <IconCircle name={current.icon} size={96} background={colors.card} />
        </View>
        <Text style={[TYPE.overline, { color: colors.primary, marginTop: SPACING.xxxl }]}>{current.subtitle}</Text>
        <Text style={[TYPE.title, { color: colors.text, textAlign: 'center', marginTop: SPACING.sm }]}>{current.title}</Text>
        <Text style={[TYPE.body, { color: colors.muted, textAlign: 'center', marginTop: SPACING.md, maxWidth: 320 }]}>
          {current.description}
        </Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  halo: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
})
