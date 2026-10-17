import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native'
import { signUp, signIn, createUser } from '../utils/supabase'
import { logError } from '../utils/errorLogger'
import { Screen, Card, Input, Button, Banner, IconCircle, SegmentedControl, useColors } from '../components/ui'
import { SPACING, TYPE } from '../utils/theme'

export default function LoginScreen({ onLogin }) {
  const colors = useColors()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const isSignUp = mode === 'signup'

  const handleAuth = async () => {
    const cleanEmail = email.trim().toLowerCase()
    setError(null)

    if (!cleanEmail || !password) return setError('Please fill in your email and password.')
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError('Please enter a valid email.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')

    setLoading(true)
    try {
      if (isSignUp) {
        const result = await signUp(cleanEmail, password)
        if (!result.success) throw new Error(result.error)

        if (result.user?.id) await createUser(result.user.id, cleanEmail)
        Alert.alert('Account created', 'Check your inbox to confirm your email, then sign in.')
        setMode('signin')
        setPassword('')
      } else {
        const result = await signIn(cleanEmail, password)
        if (!result.success) throw new Error(result.error)
        await onLogin(cleanEmail, result.user.id)
      }
    } catch (err) {
      await logError('LoginScreen_auth', err, { isSignUp })
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen keyboard contentStyle={styles.content}>
      <View style={styles.hero}>
        <IconCircle name="sparkles" size={72} />
        <Text style={[TYPE.display, { color: colors.text, marginTop: SPACING.xl }]}>Skynkod</Text>
        <Text style={[TYPE.body, { color: colors.muted, marginTop: 4, textAlign: 'center' }]}>
          Your AI skin coach. Track, learn, glow.
        </Text>
      </View>

      <Card style={{ padding: SPACING.xl }}>
        <SegmentedControl
          value={mode}
          onChange={m => { setMode(m); setError(null) }}
          options={[{ value: 'signin', label: 'Sign in' }, { value: 'signup', label: 'Create account' }]}
        />
        <View style={{ height: SPACING.xl }} />

        {error ? <Banner message={error} /> : null}

        <Input
          label="Email"
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
          label="Password"
          placeholder="At least 6 characters"
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
          title={isSignUp ? 'Create account' : 'Sign in'}
          onPress={handleAuth}
          loading={loading}
          style={{ marginTop: SPACING.sm }}
        />
      </Card>

      <Pressable onPress={() => setMode(isSignUp ? 'signin' : 'signup')} style={{ marginTop: SPACING.xl }}>
        <Text style={[TYPE.caption, { color: colors.muted, textAlign: 'center' }]}>
          {isSignUp ? 'Already have an account? ' : "New to Skynkod? "}
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{isSignUp ? 'Sign in' : 'Create one'}</Text>
        </Text>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: SPACING.xxxl },
  hero: { alignItems: 'center', marginBottom: SPACING.xxl },
})
