/**
 * Environment variable validation
 * Validates required environment variables on app startup
 */

// Required environment variables for the app to function
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

// Optional but recommended environment variables
const OPTIONAL_ENV_VARS = [
  'VITE_YOUTUBE_API_KEY',
  'VITE_TWITCH_CLIENT_ID',
];

/**
 * Validates that all required environment variables are set
 * Logs warnings for missing optional variables
 * @returns {boolean} True if all required vars are set
 */
export function validateEnv() {
  const missing = [];
  const missingOptional = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!import.meta.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional variables (warnings only)
  for (const varName of OPTIONAL_ENV_VARS) {
    if (!import.meta.env[varName]) {
      missingOptional.push(varName);
    }
  }

  // Log warnings for missing optional vars in development
  if (import.meta.env.DEV && missingOptional.length > 0) {
    console.warn(
      `[ENV] Missing optional environment variables: ${missingOptional.join(', ')}. ` +
      'Some features may not work correctly.'
    );
  }

  // Throw error for missing required vars
  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}. ` +
      'Please check your .env file.';

    if (import.meta.env.DEV) {
      console.error(`[ENV] ${message}`);
    }

    return false;
  }

  if (import.meta.env.DEV) {
    console.log('[ENV] All required environment variables are configured.');
  }

  return true;
}

/**
 * Get an environment variable with a fallback value
 * @param {string} key - The environment variable key
 * @param {string} fallback - Fallback value if not set
 * @returns {string} The environment variable value or fallback
 */
export function getEnv(key, fallback = '') {
  return import.meta.env[key] || fallback;
}

/**
 * Check if we're in development mode
 * @returns {boolean}
 */
export function isDev() {
  return import.meta.env.DEV === true;
}

/**
 * Check if we're in production mode
 * @returns {boolean}
 */
export function isProd() {
  return import.meta.env.PROD === true;
}

// Export environment variable names for type safety
export const ENV_KEYS = {
  SUPABASE_URL: 'VITE_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'VITE_SUPABASE_ANON_KEY',
  YOUTUBE_API_KEY: 'VITE_YOUTUBE_API_KEY',
  TWITCH_CLIENT_ID: 'VITE_TWITCH_CLIENT_ID',
};
