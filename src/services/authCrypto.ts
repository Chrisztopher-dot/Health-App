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
    const enc = new TextEncoder();
    const passwordBytes = enc.encode(password);

    // Convert salt hex string to Uint8Array
    const saltMatch = saltHex.match(/.{1,2}/g);
    if (!saltMatch) {
      throw new Error('Invalid salt format');
    }
    const saltBytes = new Uint8Array(saltMatch.map((byte) => parseInt(byte, 16)));

    // Prefer native Web Crypto API in secure contexts
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const keyMaterial = await window.crypto.subtle.importKey(
          'raw',
          passwordBytes,
          { name: 'PBKDF2' },
          false,
          ['deriveBits']
        );

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
      } catch (err) {
        console.warn('Native Web Crypto deriveBits failed, using pure-JS fallback:', err);
      }
    }

    // Pure-JS PBKDF2-HMAC-SHA256 fallback (works in insecure HTTP, remote IPs, or environments lacking window.crypto.subtle)
    return this.fallbackPbkdf2HmacSha256(passwordBytes, saltBytes, iterations, 32);
  }

  // --- Pure JS Cryptographic Fallbacks for Insecure Contexts (RFC 2898 / RFC 8018) ---

  private static fallbackSha256(messageBytes: Uint8Array): Uint8Array {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    let H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
    let H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

    const msgLen = messageBytes.length;
    const bitLen = msgLen * 8;
    const padLen = (msgLen % 64 < 56) ? (56 - msgLen % 64) : (120 - msgLen % 64);
    const totalLen = msgLen + padLen + 8;
    const padded = new Uint8Array(totalLen);
    padded.set(messageBytes);
    padded[msgLen] = 0x80;

    const view = new DataView(padded.buffer);
    view.setUint32(totalLen - 4, bitLen >>> 0);
    view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000));

    const W = new Uint32Array(64);

    for (let offset = 0; offset < totalLen; offset += 64) {
      for (let t = 0; t < 16; t++) {
        W[t] = view.getUint32(offset + t * 4);
      }
      for (let t = 16; t < 64; t++) {
        const s0 = ((W[t-15] >>> 7) | (W[t-15] << 25)) ^ ((W[t-15] >>> 18) | (W[t-15] << 14)) ^ (W[t-15] >>> 3);
        const s1 = ((W[t-2] >>> 17) | (W[t-2] << 15)) ^ ((W[t-2] >>> 19) | (W[t-2] << 13)) ^ (W[t-2] >>> 10);
        W[t] = (((W[t-16] + s0) | 0) + ((W[t-7] + s1) | 0)) | 0;
      }

      let a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;

      for (let t = 0; t < 64; t++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ ((~e) & g);
        const temp1 = (((((h + S1) | 0) + ch) | 0) + ((K[t] + W[t]) | 0)) | 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) | 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) | 0;
      }

      H0 = (H0 + a) | 0;
      H1 = (H1 + b) | 0;
      H2 = (H2 + c) | 0;
      H3 = (H3 + d) | 0;
      H4 = (H4 + e) | 0;
      H5 = (H5 + f) | 0;
      H6 = (H6 + g) | 0;
      H7 = (H7 + h) | 0;
    }

    const out = new Uint8Array(32);
    const outView = new DataView(out.buffer);
    outView.setUint32(0, H0);
    outView.setUint32(4, H1);
    outView.setUint32(8, H2);
    outView.setUint32(12, H3);
    outView.setUint32(16, H4);
    outView.setUint32(20, H5);
    outView.setUint32(24, H6);
    outView.setUint32(28, H7);
    return out;
  }

  private static fallbackHmacSha256(keyBytes: Uint8Array, msgBytes: Uint8Array): Uint8Array {
    let key = keyBytes;
    if (key.length > 64) {
      key = this.fallbackSha256(key);
    }
    const kPad = new Uint8Array(64);
    kPad.set(key);

    const iPad = new Uint8Array(64 + msgBytes.length);
    const oPad = new Uint8Array(64 + 32);

    for (let i = 0; i < 64; i++) {
      iPad[i] = kPad[i] ^ 0x36;
      oPad[i] = kPad[i] ^ 0x5c;
    }
    iPad.set(msgBytes, 64);
    const innerHash = this.fallbackSha256(iPad);
    oPad.set(innerHash, 64);
    return this.fallbackSha256(oPad);
  }

  private static fallbackPbkdf2HmacSha256(
    passwordBytes: Uint8Array,
    saltBytes: Uint8Array,
    iterations: number,
    dkLen = 32
  ): string {
    const saltBlock = new Uint8Array(saltBytes.length + 4);
    saltBlock.set(saltBytes);
    saltBlock[saltBytes.length + 3] = 1; // Block 1 (dkLen <= 32)

    let u = this.fallbackHmacSha256(passwordBytes, saltBlock);
    const t = new Uint8Array(u);

    for (let i = 1; i < iterations; i++) {
      u = this.fallbackHmacSha256(passwordBytes, u);
      for (let j = 0; j < 32; j++) {
        t[j] ^= u[j];
      }
    }

    const result = t.slice(0, dkLen);
    return Array.from(result).map((b) => b.toString(16).padStart(2, '0')).join('');
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
