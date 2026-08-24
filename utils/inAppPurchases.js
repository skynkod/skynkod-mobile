import AsyncStorage from '@react-native-async-storage/async-storage'
import * as IAP from 'expo-in-app-purchases'

const PREMIUM_PRODUCT_ID = 'skynkod_premium_monthly'

export const initializeIAP = async () => {
  try {
    await IAP.connectAsync()
  } catch (error) {
    console.error('IAP init error:', error)
  }
}

export const getProducts = async () => {
  try {
    const products = await IAP.getProductsAsync([PREMIUM_PRODUCT_ID])
    return products
  } catch (error) {
    console.error('Get products error:', error)
    return []
  }
}

export const purchasePremium = async (userId) => {
  try {
    const result = await IAP.purchaseAsync(PREMIUM_PRODUCT_ID)
    if (result.transactionId) {
      await AsyncStorage.setItem(`premium_${userId}`, 'true')
      return { success: true, transactionId: result.transactionId }
    }
    return { success: false }
  } catch (error) {
    console.error('Purchase error:', error)
    return { success: false, error: error.message }
  }
}

export const disconnectIAP = async () => {
  try {
    await IAP.disconnectAsync()
  } catch (error) {
    console.error('Disconnect error:', error)
  }
}