import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto';

/**
 * Envelope format (colon-delimited, base64url-ish safe characters only):
 *   v1:<keyId>:<nonce>:<tag>:<ciphertext>
 * The colon delimiter is safe because base64 output never contains ':'.
 */
const VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const NONCE_BYTES = 16;

@Injectable()
export class PiiService {
  private readonly key: Buffer | null;
  private readonly keyId: string;
  private readonly pepper: string;

  constructor(config: ConfigService) {
    const keyB64 = config.get<string>('PII_ENC_KEY');
    this.keyId = config.get<string>('PII_ENC_KEY_ID') ?? VERSION;
    this.pepper = config.get<string>('PII_HASH_PEPPER') ?? '';

    if (keyB64) {
      this.key = Buffer.from(keyB64, 'base64');
      if (this.key.length !== KEY_BYTES) {
        throw new Error(`PII_ENC_KEY must decode to ${KEY_BYTES} bytes`);
      }
    } else {
      this.key = null;
    }
  }

  isConfigured(): boolean {
    return this.key !== null;
  }

  /**
   * Encrypts a plaintext PII value. Returns null if no key is configured
   * (allows dev/test without encryption).
   */
  encrypt(plaintext: string | null | undefined): string | null {
    if (!plaintext) return null;
    if (!this.key) return `PLAINTEXT:${plaintext}`;

    const nonce = randomBytes(NONCE_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, nonce);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return [VERSION, this.keyId, nonce.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':');
  }

  /**
   * Decrypts an envelope ciphertext. Returns null if input is null or not encrypted.
   */
  decrypt(ciphertext: string | null | undefined): string | null {
    if (!ciphertext) return null;
    if (ciphertext.startsWith('PLAINTEXT:')) {
      return ciphertext.substring('PLAINTEXT:'.length);
    }
    if (!this.key) return null;

    const parts = ciphertext.split(':');
    if (parts.length !== 5 || parts[0] !== VERSION) {
      return null;
    }

    const [, keyId, nonceB64, tagB64, dataB64] = parts;
    if (keyId !== this.keyId) {
      // In production this is where multi-key rotation lookup would happen.
      return null;
    }

    const nonce = Buffer.from(nonceB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');

    const decipher = createDecipheriv(ALGORITHM, this.key, nonce);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
    return plaintext.toString('utf8');
  }

  /**
   * Produces a keyed HMAC-SHA256 of the normalized value for equality search.
   */
  hash(value: string | null | undefined): string | null {
    if (!value) return null;
    const normalized = value.trim().toUpperCase();
    return createHmac('sha256', this.pepper).update(normalized).digest('hex');
  }

  /**
   * Masks a plaintext value to last-4 for list views.
   */
  mask(value: string | null | undefined): string | null {
    if (!value) return null;
    if (value.length <= 4) return value;
    return '*'.repeat(value.length - 4) + value.slice(-4);
  }
}
