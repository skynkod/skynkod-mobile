import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, Pressable, Image } from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import { supabase, signUp, signIn } from '../utils/supabase'
import { logError } from '../utils/errorLogger'
import { useT } from '../utils/LanguageContext'
import { Screen, Card, Input, Button, Banner, SegmentedControl, useColors } from '../components/ui'
import { SPACING, TYPE } from '../utils/theme'

const LOGO = require('../assets/images/skynkod-logo.png')
// Turn on once Google is set up in Supabase > Authentication > Providers.
// Reads key=value pairs from a URL's #fragment and ?query (auth redirects use
// both), without relying on URLSearchParams, which React Native only partly supports.
const readAuthParams = (url = '') => {
  const params = {}
  const parts = [url.split('#')[1], url.split('#')[0].split('?')[1]]
  for (const part of parts) {
    for (const pair of (part || '').split('&')) {
      const [key, value = ''] = pair.split('=')
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '))
    }
  }
  return params
}

const GOOGLE_ENABLED = process.env.EXPO_PUBLIC_GOOGLE_AUTH === 'true'

export default function LoginScreen({ onLogin, onNew }) {
  const colors = useColors()
  const t = useT()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [resetStep, setResetStep] = useState('email')
  const isSignUp = mode === 'signup'
  const isReset = mode === 'reset'

  const switchMode = (m) => {
    // New accounts are made at the end of the sign-up journey (audit 2026-10-28).
    if (m === 'signup' && onNew) return onNew()
    setMode(m)
    setError(null)
    setNotice(null)
    setPassword('')
    setResetStep('email')
  }

  // Forgot password, step 2: the email link reopens the app with a recovery
  // session in the URL fragment (#access_token=...&type=recovery).
  const recoveryUrl = Linking.useLinkingURL()
  useEffect(() => {
    if (!recoveryUrl || !recoveryUrl.includes('reset-password')) return
    const params = readAuthParams(recoveryUrl)
    // Names only (never the tokens), to see what the link brought back.
    console.log('Reset link params:', Object.keys(params), params.error_code || '', params.error_description || '')
    if (!params.access_token || !params.refresh_token) {
      setMode('reset')
      setError(t(params.error_description) || t('This link has expired. Please ask for a new one.'))
      return
    }
    supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token })
      .then(({ error: sessionError }) => {
        setMode('reset')
        setError(null)
        setPassword('')
        if (sessionError) {
          console.log('Reset link session error:', sessionError.message)
          return setError(t('This link has expired. Please ask for a new one.'))
        }
        setResetStep('newPassword')
        setNotice(t('Choose your new password.'))
      })
  }, [recoveryUrl])

  // Step 1: Supabase emails a link that opens this app.
  const handleSendLink = async () => {
    const cleanEmail = email.trim().toLowerCase()
    setError(null)
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError(t('Please enter a valid email.'))

    setLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: Linking.createURL('reset-password'),
      })
      if (resetError) throw resetError
      setResetStep('sent')
      setNotice(t('Check your email and tap the link on this phone.'))
    } catch (err) {
      await logError('LoginScreen_sendResetLink', err)
      setError(t(err.message) || t('Could not send the email. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // Step 3: save the new password, then sign in again with it.
  const handleResetPassword = async () => {
    setError(null)
    if (password.length < 8) return setError(t('Password must be at least 8 characters.'))

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      Alert.alert(t('Password updated'), t('You can now sign in with your new password.'))
      switchMode('signin')
    } catch (err) {
      await logError('LoginScreen_resetPassword', err)
      setError(t(err.message) || t('Could not save your new password. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // Google sign-in through Supabase in an in-app browser; the redirect brings
  // the session back in the URL fragment.
  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      const redirectTo = Linking.createURL('auth-callback')
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      })
      if (oauthError) throw oauthError

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      if (result.type !== 'success') return

      const params = readAuthParams(result.url)
      if (!params.access_token || !params.refresh_token) {
        throw new Error(params.error_description || t('Google sign-in was cancelled.'))
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      })
      if (sessionError) throw sessionError
      await onLogin(sessionData.user.email, sessionData.user.id)
    } catch (err) {
      await logError('LoginScreen_google', err)
      setError(t(err.message) || t('Google sign-in failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async () => {
    const cleanEmail = email.trim().toLowerCase()
    setError(null)

    if (!cleanEmail || !password) return setError(t('Please fill in your email and password.'))
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError(t('Please enter a valid email.'))
    // New passwords: 8 characters (audit 2026-10-23); older accounts still sign in.
    if (isSignUp && password.length < 8) return setError(t('Password must be at least 8 characters.'))

    setLoading(true)
    try {
      if (isSignUp) {
        const result = await signUp(cleanEmail, password)
        if (!result.success) throw new Error(result.error)

        Alert.alert(t('Account created'), t('Check your inbox to confirm your email, then sign in.'))
        setMode('signin')
        setPassword('')
      } else {
        const result = await signIn(cleanEmail, password)
        if (!result.success) throw new Error(result.error)
        await onLogin(cleanEmail, result.user.id)
      }
    } catch (err) {
      await logError('LoginScreen_auth', err, { isSignUp })
      setError(t(err.message) || t('Authentication failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen keyboard contentStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={[TYPE.heading, { color: colors.textSecondary, fontWeight: '600' }]}>{t('Welcome to')}</Text>
        <Image source={LOGO} resizeMode="contain" style={styles.logo} accessibilityLabel="Skynkod" />
      </View>

      {isReset ? (
      <Card style={{ padding: SPACING.xl }}>
        <Text style={[TYPE.subheading, { color: colors.text, marginBottom: SPACING.lg }]}>{t('Reset your password')}</Text>

        {error ? <Banner message={error} /> : null}
        {notice && !error ? <Banner tone="success" message={notice} /> : null}

        {resetStep === 'newPassword' ? (
          <Input
            label={t('New password')}
            placeholder={t('At least 8 characters')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!loading}
            onSubmitEditing={handleResetPassword}
            returnKeyType="go"
          />
        ) : (
          <Input
            label={t('Email')}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            editable={!loading}
          />
        )}

        <Button
          title={resetStep === 'newPassword' ? t('Save new password') : resetStep === 'sent' ? t('Send the email again') : t('Send me a reset link')}
          onPress={resetStep === 'newPassword' ? handleResetPassword : handleSendLink}
          loading={loading}
          variant={resetStep === 'sent' ? 'secondary' : 'primary'}
          style={{ marginTop: SPACING.sm }}
        />
      </Card>
      ) : (
      <Card style={{ padding: SPACING.xl }}>
        <SegmentedControl
          value={mode}
          onChange={switchMode}
          options={[{ value: 'signin', label: t('Sign in') }, { value: 'signup', label: t('Create account') }]}
        />
        <View style={{ height: SPACING.xl }} />

        {error ? <Banner message={error} /> : null}

        <Input
          label={t('Email')}
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          editable={!loading}
        />
        <Input
          label={t('Password')}
          placeholder={isSignUp ? t('At least 8 characters') : t('Your password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          textContentType={isSignUp ? 'newPassword' : 'password'}
          editable={!loading}
          onSubmitEditing={handleAuth}
          returnKeyType="go"
        />

        <Button
          title={isSignUp ? t('Create account') : t('Sign in')}
          onPress={handleAuth}
          loading={loading}
          style={{ marginTop: SPACING.sm }}
        />
        {!isSignUp ? (
          <Pressable onPress={() => switchMode('reset')} style={{ marginTop: SPACING.lg }}>
            <Text style={[TYPE.caption, { color: colors.primary, textAlign: 'center', fontWeight: '700' }]}>{t('Forgot password?')}</Text>
          </Pressable>
        ) : null}

        {GOOGLE_ENABLED ? (
        <>
        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Text style={[TYPE.caption, { color: colors.muted }]}>{t('or')}</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>
        <Button title={t('Continue with Google')} icon="logo-google" variant="secondary" onPress={handleGoogle} disabled={loading} />
        </>
        ) : null}
      </Card>
      )}

      <Pressable onPress={() => switchMode(isReset || isSignUp ? 'signin' : 'signup')} style={{ marginTop: SPACING.xl }}>
        <Text style={[TYPE.caption, { color: colors.muted, textAlign: 'center' }]}>
          {isReset ? t('Remembered it? ') : isSignUp ? t('Already have an account? ') : t('New to Skynkod? ')}
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{isReset || isSignUp ? t('Sign in') : t('Create one')}</Text>
        </Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: SPACING.xxxl },
  hero: { alignItems: 'center', marginBottom: SPACING.xxl },
  divider: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginVertical: SPACING.xl },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  logo: { width: 230, height: 230 * 333 / 1306, marginTop: SPACING.md },
})
