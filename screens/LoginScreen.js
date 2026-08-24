import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useLanguage } from '../utils/LanguageContext'
import { signIn, signUp } from '../utils/supabase'
import { DARK_COLORS, LIGHT_COLORS } from '../utils/theme'
import { useTheme } from '../utils/ThemeContext'

export default function LoginScreen({ onLogin }) {
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        const result = await signUp(email, password)
        if (result.success) {
          Alert.alert('Success', 'Account created! Please sign in.')
          setIsSignUp(false)
          setPassword('')
        } else {
          Alert.alert('Error', result.error)
        }
      } else {
        const result = await signIn(email, password)
        if (result.success) {
          onLogin(email, result.user.id)
        } else {
          Alert.alert('Error', result.error)
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Skynkod</Text>
          <Text style={[styles.heroSubtitle, { color: colors.muted }]}>Your AI Skin Coach</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {isSignUp ? t('auth_create_account') : t('auth_sign_in')}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: colors.primary,
              },
            ]}
            placeholder={t('auth_email')}
            placeholderTextColor={colors.muted}
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
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: colors.primary,
              },
            ]}
            placeholder={t('auth_password')}
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.authBtnText}>
                {isSignUp ? t('auth_sign_up') : t('auth_sign_in')}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.toggleSection}>
            <Text style={[styles.toggleText, { color: colors.muted }]}>
              {isSignUp ? t('auth_already_have') : t('auth_no_account')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsSignUp(!isSignUp)
                setPassword('')
              }}
              disabled={loading}
            >
              <Text style={[styles.toggleLink, { color: colors.primary }]}>
                {isSignUp ? t('auth_sign_in') : t('auth_sign_up')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            🔒 Your data is secure and encrypted with Supabase
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  heroSection: { alignItems: 'center', marginBottom: 40 },
  heroEmoji: { fontSize: 60, marginBottom: 12 },
  heroTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
  heroSubtitle: { fontSize: 14 },
  formCard: { borderRadius: 12, padding: 24, marginBottom: 24 },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
  authBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  authBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  toggleSection: { marginTop: 16, alignItems: 'center' },
  toggleText: { fontSize: 13, marginBottom: 6 },
  toggleLink: { fontWeight: 'bold', fontSize: 13 },
  infoSection: { alignItems: 'center' },
  infoText: { fontSize: 12, textAlign: 'center' },
})