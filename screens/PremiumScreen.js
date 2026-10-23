import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, Pressable, Image, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { logError } from '../utils/errorLogger'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { isPremiumUser, PREMIUM_PLANS, PREMIUM_BENEFITS, startPurchase, restorePurchases, getMonthValue } from '../utils/premium'
import { Screen, Card, Button, IconCircle, useColors } from '../components/ui'
import RekodIcon from '../components/RekodIcon'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const LOGO = require('../assets/images/logo-glow.png')
const KODA_LOGO = require('../assets/images/koda-logo.png')
const FREE = ['Unlimited product scans with your verdict', 'Your morning and evening routines', 'Your skin journal', 'Your badges and levels', 'Koda: 3 questions a week']

// The Premium page: why it's worth it, "everything in Free, plus", the three
// plans (yearly highlighted, 7 days free), and what the stores require.
export default function PremiumScreen({ navigation }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const [isPremium, setIsPremium] = useState(false)
  const [plan, setPlan] = useState('yearly')
  const [busy, setBusy] = useState(false)
  const [month, setMonth] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    isPremiumUser(user.id).then(p => { setIsPremium(p); if (p) getMonthValue(user.id).then(setMonth).catch(() => {}) }).catch(error => logError('Premium_status', error, {}, 'warn'))
  }, [user?.id])

  const chosen = PREMIUM_PLANS.find(p => p.id === plan)
  const notYet = () => Alert.alert(t('Almost there'), t('Payments open with the next version of the app.'))
  const buy = async () => {
    setBusy(true)
    try {
      const result = await startPurchase(chosen)
      if (result.unavailable) notYet()
    } finally {
      setBusy(false)
    }
  }
  const restore = async () => {
    const result = await restorePurchases()
    if (result.unavailable) notYet()
  }

  if (isPremium) {
    return (
      <Screen back>
        <View style={styles.hero}>
          <IconCircle name="diamond" size={80} />
          <Text style={[TYPE.title, { color: colors.text, textAlign: 'center', marginTop: SPACING.lg }]}>{t('You’re Premium ✨')}</Text>
          <Text style={[TYPE.body, { color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.sm }]}>{t('Your skin code is fully unlocked. Enjoy every feature.')}</Text>
        </View>
        {month ? (
          <Card>
            <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '700', letterSpacing: 1 }]}>{t('THIS MONTH WITH PREMIUM')}</Text>
            {[
              ['chatbubbles-outline', t('{n} questions to Koda', { n: month.koda })],
              ['scan-circle', t('{n} Dekod scans', { n: month.dekod })],
              month.rekod ? ['sparkles-outline', t('Your Rekod, adjusted to your skin every week')] : null,
            ].filter(Boolean).map(([icon, text]) => (
              <View key={text} style={[styles.benefit, { marginBottom: 0, marginTop: SPACING.md, alignItems: 'center' }]}>
                <IconCircle name={icon} size={32} />
                <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{text}</Text>
              </View>
            ))}
          </Card>
        ) : null}
      </Screen>
    )
  }

  const cta = chosen.trialDays ? t('Start my {n} free days', { n: chosen.trialDays }) : t('Continue with {plan}', { plan: t(chosen.label) })

  return (
    <Screen
      back
      footer={
        <View>
          <Button title={cta} icon="diamond-outline" loading={busy} onPress={buy} />
          <Text style={[TYPE.caption, { color: colors.muted, textAlign: 'center', marginTop: SPACING.sm }]}>
            {chosen.trialDays
              ? t('Free for {n} days, then {price} a {per}. Cancel anytime.', { n: chosen.trialDays, price: chosen.fallbackPrice, per: t(chosen.per) })
              : t('{price} a {per}. Cancel anytime.', { price: chosen.fallbackPrice, per: t(chosen.per) })}
          </Text>
        </View>
      }
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <View style={[styles.pill, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="diamond" size={12} color={colors.primary} />
          <Text style={[TYPE.caption, { color: colors.primary, fontWeight: '700', letterSpacing: 1 }]}>SKYNKOD PREMIUM</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{t('Crack your skin code')}</Text>
        <Text style={[TYPE.body, { color: colors.textSecondary, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 22 }]}>
          {t('Stop guessing what your skin needs. Premium tells you, every day, so your routine finally brings results.')}
        </Text>
      </View>

      {/* Everything in Free, plus… */}
      <Card>
        <Text style={[TYPE.caption, { color: colors.muted, fontWeight: '700', letterSpacing: 1 }]}>{t('EVERYTHING IN FREE')}</Text>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}>{FREE.map(x => t(x)).join(' · ')}</Text>
        <Text style={[TYPE.bodyStrong, { color: colors.primary, marginTop: SPACING.lg, marginBottom: SPACING.md }]}>{t('Plus, with Premium:')}</Text>
        {PREMIUM_BENEFITS.map((b, i) => (
          <View key={b.title} style={[styles.benefit, i === PREMIUM_BENEFITS.length - 1 && { marginBottom: 0 }]}>
            {b.icon === 'rekod' || b.icon === 'koda' ? (
              <View style={[styles.logoCircle, { backgroundColor: colors.primarySoft }]}>
                {b.icon === 'rekod' ? <RekodIcon size={22} color={colors.primary} focused /> : <Image source={KODA_LOGO} style={{ width: 22, height: 22, tintColor: colors.primary }} resizeMode="contain" />}
              </View>
            ) : <IconCircle name={b.icon} size={36} />}
            <View style={{ flex: 1 }}>
              <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(b.title)}</Text>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 17 }]}>{t(b.text)}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* The three plans */}
      <Text style={[styles.section, { color: colors.muted }]}>{t('CHOOSE YOUR PLAN')}</Text>
      {PREMIUM_PLANS.map(p => {
        const on = p.id === plan
        return (
          <Pressable key={p.id} onPress={() => setPlan(p.id)} accessibilityRole="radio" accessibilityState={{ selected: on }}
            style={[styles.plan, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.card }]}>
            <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? colors.primary : colors.muted} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{t(p.label)}</Text>
                {p.badge ? <View style={[styles.badge, { backgroundColor: colors.primary }]}><Text style={styles.badgeText}>{p.badge}</Text></View> : null}
              </View>
              <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {p.trialDays ? t('{n} days free, the best value', { n: p.trialDays }) : p.note ? t(p.note) : t('Cancel anytime')}
              </Text>
            </View>
            <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{p.fallbackPrice}<Text style={[TYPE.caption, { color: colors.muted }]}> / {t(p.per)}</Text></Text>
          </Pressable>
        )
      })}

      {/* Independence pledge */}
      <View style={[styles.pledge, { borderColor: colors.border }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
        <Text style={[TYPE.caption, { color: colors.textSecondary, flex: 1, lineHeight: 18 }]}>
          {t('Independent, always: no brand pays us and no verdict is for sale. Safety alerts stay free for everyone.')}
        </Text>
      </View>

      {/* What the stores require */}
      <View style={styles.links}>
        <Text onPress={restore} style={[TYPE.caption, { color: colors.primary }]}>{t('Restore purchases')}</Text>
        <Text style={[TYPE.caption, { color: colors.muted }]}>·</Text>
        <Text onPress={() => Linking.openURL('https://skynkod.com/terms')} style={[TYPE.caption, { color: colors.primary }]}>{t('Terms of use')}</Text>
        <Text style={[TYPE.caption, { color: colors.muted }]}>·</Text>
        <Text onPress={() => navigation.navigate('Privacy')} style={[TYPE.caption, { color: colors.primary }]}>{t('Privacy policy')}</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: SPACING.xl },
  logo: { width: 72, height: 72 },
  logoCircle: { width: 36, height: 36, borderRadius: 36 / 2.6, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: 5, borderRadius: 999, marginTop: SPACING.md },
  title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center', marginTop: SPACING.md },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.lg },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, marginTop: SPACING.xxl, marginBottom: SPACING.sm },
  plan: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, borderWidth: 1.5, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  pledge: { flexDirection: 'row', gap: SPACING.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.lg },
  links: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.xl, marginBottom: SPACING.lg, flexWrap: 'wrap' },
})
