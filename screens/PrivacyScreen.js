import React, { useEffect, useState } from 'react'
import { View, Text, Switch, Pressable, StyleSheet, Alert } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { Screen, Card, LoadingView, useColors } from '../components/ui'
import { useAuth } from '../utils/AuthContext'
import { useT, useLanguage } from '../utils/LanguageContext'
import { getUserProfile, updateUserProfile } from '../utils/supabase'
import { logError } from '../utils/errorLogger'
import { setAnalyticsOff } from '../utils/analytics'
import { SPACING, RADIUS, TYPE } from '../utils/theme'

const PRIVACY_URL = 'https://skynkod.com/privacy'
const TERMS_URL = 'https://skynkod.com/terms'

// GDPR: every optional consent can be withdrawn as easily as it was given.
export default function PrivacyScreen({ navigation }) {
  const colors = useColors()
  const t = useT()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!user?.id) return
    getUserProfile(user.id).then(setProfile)
  }, [user?.id])

  if (!profile) return <LoadingView />

  const save = async (changes) => {
    const previous = profile
    setProfile({ ...profile, ...changes })
    const ok = await updateUserProfile(user.id, changes)
    if (!ok) {
      setProfile(previous)
      await logError('PrivacyScreen_save', new Error('Consent not saved'), {}, 'warn')
      Alert.alert(t('Error'), t("Couldn't save your choice. Try again."))
    }
  }

  // Usage statistics are on by default; turning them off stops them at once.
  const setImprove = async (on) => {
    setProfile(p => ({ ...p, analytics_off: !on }))
    try {
      await setAnalyticsOff(!on)
    } catch (error) {
      setProfile(p => ({ ...p, analytics_off: on }))
      await logError('PrivacyScreen_analytics', error, {}, 'warn')
      Alert.alert(t('Error'), t("Couldn't save your choice. Try again."))
    }
  }

  // Withdrawing health consent also erases the sensitive answers.
  const setHealth = (on) => {
    if (on) return save({ consent_health_at: new Date().toISOString() })
    Alert.alert(
      t('Stop using sensitive skin information?'),
      t('Your skin conditions, acne type, allergies and pregnancy answers will be deleted, and your advice will be less personal.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Stop and delete'),
          style: 'destructive',
          onPress: () => save({ consent_health_at: null, acne_types: [], skin_conditions: [], avoid_ingredients: [], pregnancy: null }),
        },
      ]
    )
  }

  const date = iso => (iso ? new Date(iso).toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' }) : null)

  const Row = ({ title, subtitle, value, onChange, last }) => (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[TYPE.bodyStrong, { color: colors.text }]}>{title}</Text>
        <Text style={[TYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 17 }]}>{subtitle}</Text>
      </View>
      <Switch value={!!value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  )

  return (
    <Screen back title={t('Privacy')} subtitle={t('Your data, your choice')}>
      <Card padded={false} style={{ paddingHorizontal: SPACING.lg }}>
        <Row
          title={t('Sensitive skin information')}
          subtitle={t('Skin conditions, acne type, allergies and pregnancy, used only to personalise your advice.')}
          value={profile.consent_health_at}
          onChange={setHealth}
        />
        <Row
          title={t('Help improve Skynkod')}
          subtitle={t('Counts which screens and features you use, and reports errors. Never what you write in your journal or to Koda.')}
          value={!profile.analytics_off}
          onChange={setImprove}
        />
        <Row
          title={t('Offers and product tests')}
          subtitle={t('Offers from brands, without them knowing who you are.')}
          value={profile.consent_offers}
          onChange={v => save({ consent_offers: v })}
          last
        />
      </Card>

      <Text style={[TYPE.caption, { color: colors.muted, marginTop: SPACING.lg, lineHeight: 18 }]}>
        {profile.consent_terms_at
          ? t('You accepted the terms of use and privacy policy on {date}.', { date: date(profile.consent_terms_at) })
          : t("You haven't accepted the terms of use yet.")}
        {' '}{t('We never sell your personal data.')}
      </Text>

      <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl }}>
        {[
          { icon: 'document-text-outline', title: t('Privacy policy'), onPress: () => WebBrowser.openBrowserAsync(PRIVACY_URL) },
          { icon: 'reader-outline', title: t('Terms of use'), onPress: () => WebBrowser.openBrowserAsync(TERMS_URL) },
          { icon: 'trash-outline', title: t('Delete my account and data'), onPress: () => navigation.navigate('Settings') },
        ].map((item, idx, arr) => (
          <Pressable
            key={item.title}
            onPress={item.onPress}
            style={[styles.link, idx < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
          >
            <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
            <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.lg },
  link: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.lg },
})
