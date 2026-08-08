/**
 * Resolve SMTP password from environment.
 * Deploy docs and render.yaml use EMAIL_PASS; accept EMAIL_PASSWORD as a fallback.
 */
export const resolveSmtpPassword = (env = process.env) => {
  return env.EMAIL_PASS || env.EMAIL_PASSWORD;
};
