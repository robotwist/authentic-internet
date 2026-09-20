import jwt from 'jsonwebtoken';

/**
 * Verify an access JWT using jsonwebtoken's CJS default export.
 *
 * `await import('jsonwebtoken')` yields an ESM namespace whose named
 * `verify` is undefined (the lexer only surfaces `decode`). Socket auth
 * must unwrap `.default` or use a static default import.
 */
export function verifyAccessToken(token, secret = process.env.JWT_SECRET) {
  if (!token) {
    throw new Error('Authentication error: Token required');
  }
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }
  return jwt.verify(token, secret);
}
