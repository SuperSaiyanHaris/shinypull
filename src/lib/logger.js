/**
 * Simple logging utility that can be disabled in production
 * Wraps console methods to allow centralized control
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },

  error: (...args) => {
    // Always log errors, but could integrate with Sentry/LogRocket later
    console.error(...args);
  },

  warn: (...args) => {
    if (isDev) console.warn(...args);
  },

  debug: (...args) => {
    if (isDev) console.debug(...args);
  },
};

export default logger;
