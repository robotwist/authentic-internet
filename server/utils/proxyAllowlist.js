/**
 * Host allowlist helpers for /api/proxy.
 * Prevents SSRF via substring matches (e.g. evilzenquotes.io) or
 * nested DNS tricks (e.g. zenquotes.io.127.0.0.1.nip.io).
 */

export const PROXY_ALLOWED_DOMAINS = Object.freeze([
  'folgerdigitaltexts.org',
  'api.quotable.io',
  'zenquotes.io',
  'quotes.rest',
]);

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^\[?::1\]?$/i,
  /^\[?fc[0-9a-f]{2}:/i,
  /^\[?fd[0-9a-f]{2}:/i,
  /^\[?fe80:/i,
  /\.nip\.io$/i,
  /\.sslip\.io$/i,
  /\.localtest\.me$/i,
  /\.localhost$/i,
];

/**
 * Normalize a hostname for comparison (lowercase, strip trailing dot).
 * @param {string} hostname
 * @returns {string}
 */
export function normalizeHostname(hostname) {
  if (!hostname || typeof hostname !== 'string') {
    return '';
  }
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

/**
 * True when hostname is exactly an allowed domain or a subdomain of one.
 * @param {string} hostname
 * @param {readonly string[]} [allowedDomains]
 * @returns {boolean}
 */
export function isAllowedProxyHostname(hostname, allowedDomains = PROXY_ALLOWED_DOMAINS) {
  const host = normalizeHostname(hostname);
  if (!host) {
    return false;
  }

  if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(host))) {
    return false;
  }

  return allowedDomains.some((domain) => {
    const allowed = normalizeHostname(domain);
    return host === allowed || host.endsWith(`.${allowed}`);
  });
}

/**
 * Validate a candidate proxy URL string.
 * @param {string} urlString
 * @returns {{ ok: true, url: URL } | { ok: false, error: string }}
 */
export function validateProxyUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return { ok: false, error: 'URL is required' };
  }

  let url;
  try {
    url = new URL(urlString);
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https URLs are allowed' };
  }

  if (!isAllowedProxyHostname(url.hostname)) {
    return {
      ok: false,
      error: 'Domain not allowed for proxying',
      message: `${url.hostname} is not in the list of allowed domains`,
    };
  }

  return { ok: true, url };
}
