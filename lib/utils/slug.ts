// lib/utils/slug.ts
import { customAlphabet } from 'nanoid';

// Custom nanoid with only lowercase letters and numbers for URL-safe slugs
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 4);

/**
 * Generate a URL-safe slug from a string
 * e.g., "Pizza Palace" -> "pizza-palace"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug with a random suffix
 * e.g., "Pizza Palace" -> "pizza-palace-x7k2"
 */
export function generateUniqueSlug(text: string): string {
  const base = slugify(text);
  const suffix = nanoid();
  return `${base}-${suffix}`;
}

/**
 * Validate a page slug format
 * Must start with / and contain only lowercase letters, numbers, and hyphens
 */
export function isValidPageSlug(slug: string): boolean {
  if (!slug.startsWith('/')) return false;
  // Allow only lowercase letters, numbers, hyphens, and forward slashes
  return /^\/[a-z0-9-/]*$/.test(slug);
}

/**
 * Validate a subdomain format
 */
export function isValidSubdomain(subdomain: string): boolean {
  // 3-40 chars, lowercase letters, numbers, and hyphens only
  // Cannot start or end with hyphen
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(subdomain);
}

/**
 * Validate a custom domain format
 */
export function isValidDomain(domain: string): boolean {
  // Basic domain validation
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}
