import AsyncStorage from '@react-native-async-storage/async-storage'

// Her Better / Same / Worse answers from "Your expectations", on the phone.
export const verdictKey = userId => `expect_verdict_${userId}`
export const getVerdicts = async userId => JSON.parse((await AsyncStorage.getItem(verdictKey(userId)).catch(() => null)) || '{}')
