import crypto from 'crypto';

export function hashBuffer(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function hashString(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function sanitizeUrl(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isSafeHttpUrl(url?: string | null): url is string {
  return Boolean(sanitizeUrl(url));
}
