/**
 * Validate an email address
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
 */
export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate a subdomain slug
 */
export function isValidSubdomain(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(slug);
}
