import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { signUp, signIn, createUser } from '../utils/supabase'
import { useTheme } from '../utils/ThemeContext'
import { useLanguage } from '../utils/LanguageContext'
import { logError } from '../utils/errorLogger'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'

export default function LoginScreen({ onLogin }) {
  const { isDark, colors } = useTheme()
  const { t } = useLanguage()
  const screenColors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter valid email')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      let result
      
      if (isSignUp) {
        result = await signUp(email, password)
        if (!result.success) throw new Error(result.error)
        
        await createUser(result.user.id, email)
        Alert.alert('Success', 'Account created! Please login.')
        setIsSignUp(false)
        setPassword('')
      } else {
        result = await signIn(email, password)
        if (!result.success) throw new Error(result.error)
        
        onLogin(email, result.user.id)
      }
    } catch (error) {
      await logError('LoginScreen_auth', error, { email, isSignUp }, 'error')
      Alert.alert('Error', error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: screenColors.bg }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: screenColors.text }]}>Skynkod</Text>
          <Text style={[styles.subtitle, { color: screenColors.muted }]}>Your AI Skin Coach ✨</Text>
        </View>

        <View style={[styles.form, { backgroundColor: screenColors.card }]}>
          <Text style={[styles.formTitle, { color: screenColors.text }]}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: screenColors.bg,
                borderColor: screenColors.primary,
                color: screenColors.text,
              },
            ]}
            placeholder="Email"
            placeholderTextColor={screenColors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: screenColors.bg,
                borderColor: screenColors.primary,
                color: screenColors.text,
              },
            ]}
            placeholder="Password"
            placeholderTextColor={screenColors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: screenColors.primary, opacity: loading ? 0.6 : 1 }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.authBtnText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setPassword('') }}>
            <Text style={[styles.toggleText, { color: screenColors.primary }]}>
              {isSignUp ? 'Already have account? Sign In' : "Don't have account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: screenColors.muted }]}>
            Your skin health matters to us
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, justifyContent: 'center', minHeight: '100%' },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14 },
  form: { borderRadius: 12, padding: 24, marginBottom: 24 },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 },
  authBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  authBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  toggleText: { textAlign: 'center', fontSize: 12, fontWeight: '600' },
  footer: { alignItems: 'center' },
  footerText: { fontSize: 12 },
})
