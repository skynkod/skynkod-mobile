import AsyncStorage from '@react-native-async-storage/async-storage'

const MAX_LOGS = 100

export async function logError(source, error, context = {}) {
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
