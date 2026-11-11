import React, { useState } from 'react'
import { View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useTheme } from '../utils/ThemeContext'
import { SPACING } from '../utils/theme'
import { KodaFace } from './Koda'
import { Button, Input } from './ui'
import { PageBackdrop, GlossyScope, GTYPE } from './glossy'
import { reportError, flushErrors, sendCrashNote } from '../utils/analytics'

// The safety net (technical audit, Lita 2026-11-11): when a screen breaks, a calm
// page with Koda's curious face instead of a blank or closed app. The error goes
// to the server by itself (no personal data: the message and where it broke). She
// can add a few words of her own, sent straight to the team (Lita, 2026-11-11).
function CrashScreen({ onRetry, crash }) {
  const { colors, gloss } = useTheme()
  // The deeper charter mauve for the links: the glossy light mauve is too pale on the backdrop.
  const link = gloss?.mauve || colors.primary
  const [writing, setWriting] = useState(false)
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [failed, setFailed] = useState(false)
  const send = async () => {
    setSending(true)
    setFailed(false)
    try {
      await sendCrashNote(note.trim(), crash)
      setSent(true)
      setWriting(false)
    } catch {
      setFailed(true)
    } finally {
      setSending(false)
    }
  }
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.page, { backgroundColor: colors.bg }]}>
      <PageBackdrop />
      <KodaFace mood="curious" size={96} float />
      <Text style={[GTYPE.subheading, styles.center, { color: colors.text, marginTop: SPACING.lg }]}>Something went wrong</Text>
      <Text style={[GTYPE.body, styles.center, { color: colors.muted, marginTop: 6, maxWidth: 280 }]}>Your routine and your data are safe.</Text>
      {writing ? (
        <View style={{ alignSelf: 'stretch', marginTop: SPACING.xl }}>
          <Input value={note} onChangeText={setNote} multiline maxLength={1000} autoFocus placeholder="What were you doing when it happened?" />
          {failed ? <Text style={[GTYPE.caption, styles.center, { color: colors.danger, marginBottom: SPACING.sm }]}>Not sent. Check your connection and try again.</Text> : null}
          <Button title="Send" onPress={send} loading={sending} disabled={!note.trim()} />
          <Pressable onPress={() => setWriting(false)} accessibilityRole="button" hitSlop={10} style={{ marginTop: SPACING.lg, alignSelf: 'center' }}>
            <Text style={[GTYPE.caption, { color: link }]}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Button title="Try again" onPress={onRetry} style={{ marginTop: SPACING.xl, alignSelf: 'stretch' }} />
          {sent ? (
            <Text style={[GTYPE.caption, { color: colors.muted, marginTop: SPACING.lg }]}>Thank you, we've got it.</Text>
          ) : (
            <Pressable onPress={() => setWriting(true)} accessibilityRole="button" hitSlop={10} style={{ marginTop: SPACING.lg }}>
              <Text style={[GTYPE.caption, { color: link }]}>Tell us what happened</Text>
            </Pressable>
          )}
        </>
      )}
    </KeyboardAvoidingView>
  )
}

export default class CrashGuard extends React.Component {
  state = { error: null, attempt: 0 }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    reportError({ source: `crash_${this.props.name || 'app'}`, message: error?.message || String(error), stack: `${error?.stack || ''}\n${info?.componentStack || ''}`, fatal: true })
      .then(() => flushErrors())
      .catch(() => {})
  }

  // Try again: the screens start afresh (back to Home), she stays signed in.
  retry = () => this.setState(s => ({ error: null, attempt: s.attempt + 1 }))

  render() {
    if (this.state.error) {
      // In the glossy universe of the app: its backdrop, Inter and the glossy button.
      return <GlossyScope><CrashScreen onRetry={this.retry} crash={String(this.state.error?.message || this.state.error).slice(0, 300)} /></GlossyScope>
    }
    return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>
  }
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  center: { textAlign: 'center' },
})
