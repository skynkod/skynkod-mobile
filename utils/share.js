import { Share } from 'react-native'
import { trackShared } from './journey'
import { logError } from './errorLogger'

// Share Skynkod with a friend. The Skinfluencer badge counts only when the
// share sheet reports that something was actually sent.
export const shareSkynkod = async (userId, t = s => s) => {
  try {
    const result = await Share.share({ message: t('I take care of my skin with Skynkod https://skynkod.com') })
    if (result.action === Share.sharedAction) trackShared(userId)
  } catch (error) {
    logError('Share_skynkod', error, {}, 'warn')
  }
}
