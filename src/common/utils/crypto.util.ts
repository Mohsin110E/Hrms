import { createDecipheriv, randomBytes, createHash } from 'crypto';

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateSecureToken(length = 32): string {
  let result = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return result;
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Decrypts a legacy DES-CBC ciphertext using the configured key/IV.
 * The legacy system stored DES-encrypted passwords; this helper is used
 * ONLY during the migration window (D-014). Returns null if decryption
 * fails or if the legacy key/IV are not configured.
 */
export function desDecrypt(
  ciphertext: string,
  keyBase64: string | undefined,
  ivBase64: string | undefined,
): string | null {
  if (!keyBase64 || !ivBase64) return null;
  try {
    const key = Buffer.from(keyBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    if (key.length !== 8 || iv.length !== 8) return null;

    const encrypted = Buffer.from(ciphertext, 'base64');
    const decipher = createDecipheriv('des-cbc', key, iv);
    decipher.setAutoPadding(true);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}
