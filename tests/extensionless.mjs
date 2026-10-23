// Lets Node load the app's extensionless imports (Metro adds ".js" itself).
import { registerHooks } from 'node:module'

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context)
    } catch (error) {
      if (error.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.') && !specifier.endsWith('.js')) return next(`${specifier}.js`, context)
      throw error
    }
  },
})
