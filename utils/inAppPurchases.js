import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';

export const PREMIUM_PRODUCT_IDS = Platform.select({
  ios: ['skynkod_premium_monthly'],
  android: ['skynkod_premium_monthly'],
});

let connected = false;

export const initPurchases = async () => {
  try {
    if (!connected) {
      await RNIap.initConnection();
      connected = true;
    }
    return true;
  } catch (error) {
    console.warn('IAP init failed:', error);
    return false;
  }
};

export const endPurchases = async () => {
  try {
    if (connected) {
      await RNIap.endConnection();
      connected = false;
    }
  } catch (error) {
    console.warn('IAP end failed:', error);
  }
};

export const getPremiumProducts = async () => {
  try {
    await initPurchases();
    return await RNIap.getSubscriptions({ skus: PREMIUM_PRODUCT_IDS });
  } catch (error) {
    console.warn('Get products failed:', error);
    return [];
  }
};

export const buyPremium = async (productId = PREMIUM_PRODUCT_IDS[0]) => {
  try {
    await initPurchases();
    return await RNIap.requestSubscription({ sku: productId });
  } catch (error) {
    console.warn('Purchase failed:', error);
    return null;
  }
};
