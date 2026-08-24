import { useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SKYNKOD_COLORS } from '../utils/constants'
import { createUser, signIn, signUp } from '../utils/supabase'

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAuthenticate = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }

    setLoading(true)
    try {
      let result
      if (isSignUp) {
        result = await signUp(email, password)
        if (result.success) {
          await createUser(result.user.id, email)
          Alert.alert('Success', 'Account created! Please sign in.')
          setIsSignUp(false)
          setPassword('')
        } else {
          Alert.alert('Sign Up Error', result.error)
        }
      } else {
        result = await signIn(email, password)
        if (result.success) {
          onLogin(email, result.user.id)
        } else {
          Alert.alert('Sign In Error', result.error)
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.title}>Skynkod</Text>
        <Text style={styles.subtitle}>Your AI Skincare Coach</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!loading}
          placeholderTextColor={SKYNKOD_COLORS.muted}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          placeholderTextColor={SKYNKOD_COLORS.muted}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuthenticate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setIsSignUp(!isSignUp)
            setPassword('')
          }}
          disabled={loading}
        >
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure login powered by Supabase</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SKYNKOD_COLORS.bg, justifyContent: 'center', paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: 'bold', color: SKYNKOD_COLORS.text },
  subtitle: { fontSize: 14, color: SKYNKOD_COLORS.muted, marginTop: 4 },
  formCard: { backgroundColor: 'white', borderRadius: 12, padding: 24, marginBottom: 24 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: SKYNKOD_COLORS.text, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: SKYNKOD_COLORS.border, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14, color: SKYNKOD_COLORS.text },
  button: { backgroundColor: SKYNKOD_COLORS.primary, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  toggleText: { color: SKYNKOD_COLORS.primary, textAlign: 'center', marginTop: 16, fontWeight: '500' },
  footer: { alignItems: 'center' },
  footerText: { color: SKYNKOD_COLORS.muted, fontSize: 12 },
})