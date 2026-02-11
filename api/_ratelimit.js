// Simple in-memory rate limiter for Vercel serverless functions
// Note: Each serverless function instance has its own memory, so this won't work
// perfectly across multiple instances, but provides basic protection

const requestCounts = new Map();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.resetTime > 600000) { // 10 minutes
      requestCounts.delete(key);
    }
  }
}, 600000);

/**
 * Simple rate limiter
 * @param {string} identifier - IP address or identifier
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Window size in milliseconds
 * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(identifier, maxRequests = 60, windowMs = 60000) {
  const now = Date.now();
  const key = identifier;

  if (!requestCounts.has(key)) {
    requestCounts.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  const data = requestCounts.get(key);

  // Reset window if expired
  if (now > data.resetTime) {
    data.count = 1;
    data.resetTime = now + windowMs;
    return { allowed: true, remaining: maxRequests - 1, resetTime: data.resetTime };
  }

  // Increment count
  data.count++;

  if (data.count > maxRequests) {
    return { allowed: false, remaining: 0, resetTime: data.resetTime };
  }

  return { allowed: true, remaining: maxRequests - data.count, resetTime: data.resetTime };
}

/**
 * Get client identifier (IP address)
 */
export function getClientIdentifier(req) {
  // Check various headers for real IP (Vercel sets these)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return req.headers['x-real-ip'] ||
         req.socket?.remoteAddress ||
         'unknown';
}
