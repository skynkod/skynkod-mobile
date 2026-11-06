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
import { SPACING } from '../utils/theme'
import { exportMyData, isDiscreet, setDiscreet, isLockOn, canLock, setLock } from '../utils/privacy'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../utils/supabase'
import { refreshIfRekod } from '../utils/rekod'
import { GTYPE } from '../components/glossy'
import FeatureIcon from '../components/FeatureIcon'

const OFFERS_ENABLED = false

const PRIVACY_URL = 'https://skynkod.com/privacy'
const TERMS_URL = 'https://skynkod.com/terms'

// GDPR: every optional consent can be withdrawn as easily as it was given.
export default function PrivacyScreen({ navigation }) {
  const colors = useColors()
  const t = useT()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [discreet, setDiscreetOn] = useState(false)
  const [lock, setLockOn] = useState(false)
  const [lockable, setLockable] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    getUserProfile(user.id).then(setProfile)
    isDiscreet(user.id).then(setDiscreetOn)
    isLockOn().then(setLockOn)
    canLock().then(setLockable).catch(() => setLockable(false))
  }, [user?.id])

  if (!profile) return <LoadingView />

  // A copy of all her data, right away, as a file she can keep or send.
  const askData = async () => {
    if (exporting) return
    setExporting(true)
    try {
      await exportMyData(user.id)
    } catch (error) {
      await logError('PrivacyScreen_export', error)
      Alert.alert(t('Something went wrong'), t('Please try again.'))
    } finally {
      setExporting(false)
    }
  }

  const toggleDiscreet = (on) => {
    const apply = async () => {
      try {
        await setDiscreet(user.id, on)
        setDiscreetOn(on)
        if (on) setProfile(p => ({ ...p, analytics_off: true, first_name: null, birth_date: null }))
      } catch (error) {
        await logError('PrivacyScreen_discreet', error)
        Alert.alert(t('Error'), t("Couldn't save your choice. Try again."))
      }
    }
    if (!on) return apply()
    Alert.alert(t('Turn on discreet mode?'), t('Your first name and date of birth are erased, usage statistics are turned off, and your conversations with Koda are no longer kept (past ones are deleted). Your email stays, only so you can sign in.'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Turn on'), onPress: apply },
    ])
  }

  const toggleLock = async (on) => {
    const ok = await setLock(on, on ? t('Lock Skynkod with Face ID') : t('Turn off the lock')).catch(() => false)
    if (ok) setLockOn(on)
  }

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
          // Rekod is rebuilt without the deleted answers.
          onPress: async () => { await save({ consent_health_at: null, acne_types: [], skin_conditions: [], avoid_ingredients: [], pregnancy: null }); refreshIfRekod(user.id).catch(() => {}) },
        },
      ]
    )
  }

  // Dekod's consent can be withdrawn here (audit 3); her saved results can go too.
  const setDekod = (on) => {
    if (on) {
      const at = new Date().toISOString()
      AsyncStorage.setItem(`dekod_consent_${user.id}`, at).catch(() => {})
      return save({ consent_dekod_at: at })
    }
    const stop = async (erase) => {
      await AsyncStorage.removeItem(`dekod_consent_${user.id}`).catch(() => {})
      await save({ consent_dekod_at: null })
      if (erase) {
        const { error } = await supabase.from('dekod_results').delete().eq('user_id', user.id)
        if (error) { logError('PrivacyScreen_dekodErase', error, {}, 'warn'); Alert.alert(t('Error'), t('Please try again.')) }
      }
    }
    Alert.alert(t('Stop Dekod?'), t('Dekod won’t analyse any new photo. Your past results can stay in your account or be deleted now.'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Stop, keep my results'), onPress: () => stop(false) },
      { text: t('Stop and delete my results'), style: 'destructive', onPress: () => stop(true) },
    ])
  }

  const date = iso => (iso ? new Date(iso).toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' }) : null)

  const Row = ({ title, subtitle, value, onChange, last }) => (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[GTYPE.bodyStrong, { color: colors.text }]}>{title}</Text>
        <Text style={[GTYPE.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 17 }]}>{subtitle}</Text>
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
          title={t('Dekod skin scan')}
          subtitle={t('Your selfie is sent to Anthropic for the analysis. Skynkod only keeps the result, in your account.')}
          value={profile.consent_dekod_at}
          onChange={setDekod}
        />
        <Row
          title={t('Help improve Skynkod')}
          subtitle={t('Counts which screens and features you use, and reports errors. Never what you write in your journal or to Koda.')}
          value={!profile.analytics_off}
          onChange={setImprove}
          last={!OFFERS_ENABLED}
        />
      </Card>

      <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl }}>
        <Row
          title={t('Discreet mode')}
          subtitle={t('No first name or date of birth, no statistics, Koda conversations not kept.')}
          value={discreet}
          onChange={toggleDiscreet}
          last={!lockable}
        />
        {lockable ? (
          <Row
            title={t('Lock with Face ID')}
            subtitle={t('Nobody else can open your skin journal on this phone.')}
            value={lock}
            onChange={toggleLock}
            last
          />
        ) : null}
        {/* Brand offers come back once real offers exist. */}
        {OFFERS_ENABLED ? (
          <Row
            title={t('Offers and product tests')}
            subtitle={t('Offers from brands, without them knowing who you are.')}
            value={profile.consent_offers}
            onChange={v => save({ consent_offers: v })}
            last
          />
        ) : null}
      </Card>

      <Text style={[GTYPE.caption, { color: colors.muted, marginTop: SPACING.lg, lineHeight: 18 }]}>
        {profile.consent_terms_at
          ? t('You accepted the terms of use and privacy policy on {date}.', { date: date(profile.consent_terms_at) })
          : t("You haven't accepted the terms of use yet.")}
        {' '}{t('We never sell your personal data.')}
      </Text>

      <Card padded={false} style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.xl }}>
        {[
          { icon: 'document-text-outline', title: t('Privacy policy'), onPress: () => WebBrowser.openBrowserAsync(PRIVACY_URL) },
          { icon: 'reader-outline', title: t('Terms of use'), onPress: () => WebBrowser.openBrowserAsync(TERMS_URL) },
          { icon: 'download-outline', title: t('Get a copy of my data'), onPress: askData },
          { icon: 'trash-outline', title: t('Delete my account and data'), onPress: () => navigation.navigate('Settings') },
        ].map((item, idx, arr) => (
          <Pressable
            key={item.title}
            onPress={item.onPress}
            style={[styles.link, idx < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
          >
            <FeatureIcon name={item.icon} size={20} color={colors.textSecondary} />
            <Text style={[GTYPE.body, { color: colors.text, flex: 1 }]}>{item.title}</Text>
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
