/**
 * CSRF protection helper.
 * Verifies that the Origin or Referer header of a request matches the
 * application's own host. Rejects cross-origin state-mutating requests.
 */
export function checkCsrf(request: Request): boolean {
  const host = request.headers.get('host');
  if (!host) return false;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  const allowedPrefixes = [`http://${host}`, `https://${host}`];

  if (origin) {
    return allowedPrefixes.some((prefix) => origin === prefix || origin.startsWith(`${prefix}/`));
  }

  if (referer) {
    return allowedPrefixes.some((prefix) => referer.startsWith(prefix));
  }

  // Neither header present — deny to be safe.
  return false;
}
