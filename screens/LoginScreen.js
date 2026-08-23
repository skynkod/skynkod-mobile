import { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { createUser, getUser } from '../utils/supabase'

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email')
      return
    }

    setLoading(true)
    try {
      let user = await getUser(email)

      if (!user) {
        user = await createUser(email)
        if (!user) throw new Error('Failed to create user')
        Alert.alert('Success', 'Account created!')
      }

      onLogin(email, user.id)
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Skynkod</Text>
      <Text style={styles.subtitle}>Your skincare journey starts here</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Demo password: demo123</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F1F5',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#14121A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9B97A0',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ABA0AA',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#B283AC',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    color: '#9B97A0',
    textAlign: 'center',
    fontSize: 12,
  },
})