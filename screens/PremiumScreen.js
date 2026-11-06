import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, Pressable, Image, Linking, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { logError } from '../utils/errorLogger'
import { useAuth } from '../utils/AuthContext'
import { useT } from '../utils/LanguageContext'
import { isPremiumUser, PREMIUM_PLANS, PREMIUM_BENEFITS, startPurchase, restorePurchases, getMonthValue, planPrice } from '../utils/premium'
import { Screen, Card, IconCircle, useColors } from '../components/ui'
import { SPACING, RADIUS, TYPE } from '../utils/theme'
import FeatureIcon from '../components/FeatureIcon'
import { useGlossy, GlossyBackdrop, Glass, GlossyButton, GlassIcon } from '../components/glossy'

const ORB = require('../assets/onboarding/orb-welcome.png')
const FREE = ['Unlimited product scans with your verdict', 'Should I buy this? (the answer)', 'Safety alerts: allergies, pregnancy, reactions', 'Your skin forecast, every day', 'Your morning and evening routines', 'When to judge each product', 'Your skin review every 2 weeks', 'Your skin journal', 'Your skin timeline', 'Your badges and levels', 'Koda: 3 questions a week']

// The Premium page: why it's worth it, "everything in Free, plus", the three
// plans (yearly highlighted, 7 days free), and what the stores require.
export default function PremiumScreen({ navigation, route }) {
  const colors = useColors()
  const t = useT()
  const { user } = useAuth()
  const [isPremium, setIsPremium] = useState(false)
  const [plan, setPlan] = useState('yearly')
  const [busy, setBusy] = useState(false)
  const [month, setMonth] = useState(null)
  const glossy = useGlossy()
  const insets = useSafeAreaInsets()

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
              ['koda', t('{n} questions to Koda', { n: month.koda })],
              ['dekod', t('{n} Dekod scans', { n: month.dekod })],
              month.rekod ? ['rekod', t('Your Rekod, adjusted to your skin every week')] : null,
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
  const G = glossy
  const { C, F, night } = G

  // The model screen of the glossy universe (audit 2026-10-28): same content as
  // before, in the sign-up's pink glass by day and deep plum at night.
  return (
    <View style={[gs.flex, { backgroundColor: C.bg }]}>
      <GlossyBackdrop night={night} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel={t('Back')} style={[gs.back, { backgroundColor: C.iconBg, borderColor: C.glassLine }]}>
          <Ionicons name="chevron-back" size={20} color={C.ink} />
        </Pressable>

        {/* Hero */}
        <View style={gs.hero}>
          <Image source={ORB} style={gs.orb} resizeMode="contain" />
          <View style={[gs.pill, { backgroundColor: C.glassOn, borderColor: C.glassLine }]}>
            <Ionicons name="diamond-outline" size={12} color={C.mauve} />
            <Text style={[F.s, gs.pillText, { color: C.mauve }]}>SKYNKOD PREMIUM</Text>
          </View>
          <Text style={[F.b, gs.title, { color: C.ink }]}>{t('Crack your skin code')}</Text>
          <Text style={[F.r, gs.sub, { color: C.soft }]}>{t('Stop guessing what your skin needs. Premium tells you, every day, so your routine finally brings results.')}</Text>
        </View>

        {/* Plus, with Premium */}
        <Text style={[F.s, gs.section, { color: C.mute }]}>{t('PLUS, WITH PREMIUM')}</Text>
        <Glass C={C} night={night} style={{ paddingVertical: 6 }}>
          {PREMIUM_BENEFITS.map((b, i) => (
            <View key={b.title} style={[gs.benefit, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line }]}>
              <GlassIcon C={C} size={38}><FeatureIcon name={b.icon} size={18} color={C.icon} focused={b.icon === 'rekod'} /></GlassIcon>
              <View style={{ flex: 1 }}>
                <Text style={[F.s, { fontSize: 14.5, color: C.ink }]}>{t(b.title)}</Text>
                <Text style={[F.r, { fontSize: 12.5, lineHeight: 17, color: C.soft, marginTop: 2 }]}>{t(b.text)}</Text>
              </View>
            </View>
          ))}
        </Glass>

        {/* Everything in Free */}
        <Text style={[F.s, gs.section, { color: C.mute }]}>{t('EVERYTHING IN FREE')}</Text>
        <Glass C={C} night={night} style={{ padding: 14 }}>
          <View style={gs.chips}>
            {FREE.map(x => (
              <View key={x} style={[gs.chip, { borderColor: C.line, backgroundColor: C.iconBg }]}>
                <Ionicons name="checkmark" size={12} color={C.mauve} />
                <Text style={[F.m, { fontSize: 12, color: C.ink }]}>{t(x)}</Text>
              </View>
            ))}
          </View>
        </Glass>

        {/* The plans */}
        <Text style={[F.s, gs.section, { color: C.mute }]}>{t('CHOOSE YOUR PLAN')}</Text>
        {PREMIUM_PLANS.map(p => {
          const on = p.id === plan
          return (
            <Pressable key={p.id} onPress={() => setPlan(p.id)} accessibilityRole="radio" accessibilityState={{ selected: on }}>
              <Glass C={C} night={night} style={[gs.plan, on && { borderColor: C.mauve2, backgroundColor: C.glassOn }]}>
                <View style={[gs.radio, { borderColor: on ? C.mauve2 : C.mute }, on && { borderWidth: 6 }]} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[F.s, { fontSize: 15, color: C.ink }]}>{t(p.label)}</Text>
                    {p.badge ? <View style={[gs.badge, { backgroundColor: C.mauve2 }]}><Text style={[F.s, gs.badgeText]}>{p.badge}</Text></View> : null}
                  </View>
                  <Text style={[F.r, { fontSize: 12.5, color: C.soft, marginTop: 2 }]}>
                    {p.trialDays ? t('{n} days free, the best value', { n: p.trialDays }) : p.note ? t(p.note) : t('Cancel anytime')}
                  </Text>
                </View>
                <Text style={[F.s, { fontSize: 14, color: C.ink }]}>{planPrice(p) || t('Every {per}', { per: t(p.per) })}{planPrice(p) ? <Text style={[F.r, { fontSize: 12, color: C.mute }]}> / {t(p.per)}</Text> : null}</Text>
              </Glass>
            </Pressable>
          )
        })}

        {/* Independence pledge */}
        <Glass C={C} night={night} style={[gs.pledge]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={C.mauve} />
          <Text style={[F.r, { flex: 1, fontSize: 12.5, lineHeight: 18, color: C.soft }]}>
            {t('Independent, always: no brand pays us and no verdict is for sale. Safety alerts stay free for everyone.')}
          </Text>
        </Glass>

        {/* What the stores require */}
        <View style={gs.links}>
          <Text onPress={restore} style={[F.m, gs.link, { color: C.mauve }]}>{t('Restore purchases')}</Text>
          <Text style={[gs.link, { color: C.mute }]}>·</Text>
          <Text onPress={() => Linking.openURL('https://skynkod.com/terms')} style={[F.m, gs.link, { color: C.mauve }]}>{t('Terms of use')}</Text>
          <Text style={[gs.link, { color: C.mute }]}>·</Text>
          <Text onPress={() => navigation.navigate('Privacy')} style={[F.m, gs.link, { color: C.mauve }]}>{t('Privacy policy')}</Text>
        </View>
      </ScrollView>

      {/* The button stays in reach */}
      <View style={[gs.footer, { paddingBottom: Math.max(insets.bottom, 12), borderTopColor: C.line, backgroundColor: night ? 'rgba(21,18,21,0.92)' : 'rgba(251,248,250,0.92)' }]}>
        <GlossyButton title={cta} onPress={buy} loading={busy} F={F} />
        <Text style={[F.r, { fontSize: 12, color: C.mute, textAlign: 'center', marginTop: 8 }]}>
          {chosen.trialDays
            ? (planPrice(chosen) ? t('Free for {n} days, then {price} a {per}. Cancel anytime.', { n: chosen.trialDays, price: planPrice(chosen), per: t(chosen.per) }) : t('Free for {n} days, then your App Store price. Cancel anytime.', { n: chosen.trialDays }))
            : (planPrice(chosen) ? t('{price} a {per}. Cancel anytime.', { price: planPrice(chosen), per: t(chosen.per) }) : t('Your App Store price. Cancel anytime.'))}
        </Text>
        {route?.params?.fromOnboarding ? (
          <Text onPress={() => navigation.goBack()} style={[F.m, { fontSize: 14, color: C.soft, textAlign: 'center', marginTop: 10 }]}>{t('Not now')}</Text>
        ) : null}
      </View>
    </View>
  )
}

const gs = StyleSheet.create({
  flex: { flex: 1 },
  back: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', marginTop: 4 },
  orb: { width: 150, height: 150 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1, marginTop: 6 },
  pillText: { fontSize: 11, letterSpacing: 1.2 },
  title: { fontSize: 30, letterSpacing: -0.6, textAlign: 'center', marginTop: 12 },
  sub: { fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 8, paddingHorizontal: 6 },
  section: { fontSize: 11.5, letterSpacing: 1.1, marginTop: 26, marginBottom: 10 },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginBottom: 10 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 11 },
  pledge: { flexDirection: 'row', gap: 10, padding: 14, marginTop: 10 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 22, flexWrap: 'wrap' },
  link: { fontSize: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
})

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
