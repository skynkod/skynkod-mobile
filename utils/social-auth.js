import { Platform } from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import * as AppleAuthentication from 'expo-apple-authentication'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase'

// Sign in with Google or Apple (Lita, 2026-11-09: both, on the login screen and
// at the end of the sign-up). A button only shows once its provider is switched
// on in Supabase > Authentication > Providers, so none ever leads to an error.

// Reads key=value pairs from a URL's #fragment and ?query (auth redirects use
// both), without relying on URLSearchParams, which React Native only partly supports.
export const readAuthParams = (url = '') => {
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

// Which providers are on: { google, apple }. Apple also needs an iPhone that offers it.
export const socialProviders = async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } })
    const external = (await response.json())?.external || {}
    const appleHere = Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync().catch(() => false))
    return { google: !!external.google, apple: !!external.apple && appleHere }
  } catch {
    return { google: false, apple: false }
  }
}

// Each returns the signed-in user, or null when she cancelled.

// Google through Supabase in an in-app browser; the redirect brings the session back in the URL fragment.
export const signInWithGoogle = async () => {
  const redirectTo = Linking.createURL('auth-callback')
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } })
  if (error) throw error
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (result.type !== 'success') return null
  const params = readAuthParams(result.url)
  if (!params.access_token || !params.refresh_token) throw new Error(params.error_description || 'Google sign-in was cancelled.')
  const { data: session, error: sessionError } = await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token })
  if (sessionError) throw sessionError
  return session.user
}

// Apple's own sheet on the iPhone, then the token goes to Supabase.
export const signInWithApple = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    })
    if (!credential.identityToken) throw new Error('Apple sign-in failed. Please try again.')
    const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken })
    if (error) throw error
    return data.user
  } catch (error) {
    if (error?.code === 'ERR_REQUEST_CANCELED') return null
    throw error
  }
}
