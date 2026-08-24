import { stripe } from '@stripe/stripe-react-native'

const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE'

export const initializeStripe = async () => {
  try {
    await stripe.initialise({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.skynkod',
    })
  } catch (error) {
    console.error('Stripe init error:', error)
  }
}

export const createPaymentIntent = async (userId) => {
  try {
    const response = await fetch('https://your-backend.com/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount: 499, currency: 'usd' }),
    })
    const data = await response.json()
    return data.clientSecret
  } catch (error) {
    console.error('Payment intent error:', error)
    return null
  }
}

export const confirmPayment = async (clientSecret) => {
  try {
    const result = await stripe.confirmPaymentSheetPayment()
    if (result.error) {
      return { success: false, error: result.error.message }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}