import crypto from 'crypto';

export function hashBuffer(buffer: Buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function hashString(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function sanitizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return null;
  }
}
