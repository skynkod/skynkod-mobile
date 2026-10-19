import AsyncStorage from '@react-native-async-storage/async-storage'
import { reportError } from './analytics'

const MAX_LOGS = 100

export async function logError(source, error, context = {}, level = 'error') {
  // While developing, show it in the Metro logs too.
  if (__DEV__) console.warn(`[${source}]`, error?.message || String(error))
  // Real errors also reach the server; warnings (often just no network) stay on the phone.
  if (level !== 'warn') reportError({ source, message: error?.message || String(error), stack: error?.stack })
  try {
    const errorLog = {
      timestamp: new Date().toISOString(),
      source,
      message: error.message || String(error),
      stack: error.stack || '',
      context,
    }

    const existing = await AsyncStorage.getItem('skynkod_error_logs')
    let logs = existing ? JSON.parse(existing) : []

    logs.push(errorLog)
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(-MAX_LOGS)
    }

    await AsyncStorage.setItem('skynkod_error_logs', JSON.stringify(logs))
  } catch (err) {
    console.error('Failed to log error:', err)
  }
}

export async function getErrorLogs() {
  try {
    const logs = await AsyncStorage.getItem('skynkod_error_logs')
    return logs ? JSON.parse(logs) : []
  } catch (err) {
    return []
  }
}

export async function clearErrorLogs() {
  try {
    await AsyncStorage.removeItem('skynkod_error_logs')
  } catch (err) {
    console.error('Failed to clear error logs:', err)
  }
}
