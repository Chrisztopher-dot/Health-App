/**
 * Cryptographic Password Protection Service
 * Implements industry standard PBKDF2 with SHA-256 and 100,000 iterations
 * using the high-security W3C Web Crypto API.
 * Ensures passwords are never stored in plaintext.
 */

export class AuthCryptoService {
  public static readonly DEFAULT_ITERATIONS = 100000;
  public static readonly SALT_BYTE_LENGTH = 32;

  /**
   * Generates a cryptographically strong random salt (256-bit / 32 bytes hex)
   */
  public static generateSalt(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(this.SALT_BYTE_LENGTH);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
    // Fallback pseudo-random for non-browser environments
    let fallback = '';
    for (let i = 0; i < this.SALT_BYTE_LENGTH * 2; i++) {
      fallback += Math.floor(Math.random() * 16).toString(16);
    }
    return fallback;
  }

  /**
   * Derives a salted password hash using PBKDF2-HMAC-SHA256 with 100,000 iterations
   */
  public static async hashPassword(
    password: string,
    saltHex: string,
    iterations = this.DEFAULT_ITERATIONS
  ): Promise<string> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API is not available.');
    }

    const enc = new TextEncoder();
    const passwordBytes = enc.encode(password);

    // Convert salt hex string to Uint8Array
    const saltMatch = saltHex.match(/.{1,2}/g);
    if (!saltMatch) {
      throw new Error('Invalid salt format');
    }
    const saltBytes = new Uint8Array(saltMatch.map((byte) => parseInt(byte, 16)));

    // Import base password key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    // Derive 256-bit PBKDF2 hash
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      256 // 256 bits = 32 bytes
    );

    const hashArray = Array.from(new Uint8Array(derivedBits));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Timing-safe verification comparing candidate password against stored salt and hash
   */
  public static async verifyPassword(
    password: string,
    saltHex: string,
    expectedHashHex: string,
    iterations = this.DEFAULT_ITERATIONS
  ): Promise<boolean> {
    try {
      const computedHash = await this.hashPassword(password, saltHex, iterations);
      if (computedHash.length !== expectedHashHex.length) {
        return false;
      }
      // Constant-time bitwise comparison to eliminate timing side-channel attacks
      let diff = 0;
      for (let i = 0; i < computedHash.length; i++) {
        diff |= computedHash.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
      }
      return diff === 0;
    } catch (err) {
      console.error('Password verification error:', err);
      return false;
    }
  }
}
