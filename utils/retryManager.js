export async function retryAsync(fn, maxRetries = 3, delay = 1000) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry on client errors (400, 403, 404, etc)
      if (error.status >= 400 && error.status < 500) {
        throw error
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  throw lastError
}

export function isRetryableError(error) {
  // Network errors are retryable
  if (!error.status) return true
  
  // Server errors (5xx) are retryable
  if (error.status >= 500) return true
  
  // Client errors (4xx) are NOT retryable
  if (error.status >= 400 && error.status < 500) return false
  
  return true
}

export async function withRetry(asyncFn, maxRetries = 3) {
  return retryAsync(asyncFn, maxRetries)
}
