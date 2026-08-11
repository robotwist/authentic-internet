/**
 * Apply XSS-related response headers only.
 *
 * Do NOT HTML-encode req.body strings before persistence. Encoding on input
 * silently corrupts durable data (artifact names/answers with apostrophes,
 * message URLs with "/", etc.) and breaks client-side unlock comparisons that
 * compare raw user input to the stored answer.
 *
 * Escape on output / rely on React text escaping instead.
 */
export const xssProtection = (req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");

  next();
};
