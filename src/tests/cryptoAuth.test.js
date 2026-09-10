import { describe, it, expect } from 'vitest';
import { hashPassword, sanitizeUserSession } from '../utils/cryptoAuth';

describe('cryptoAuth utility', () => {
  it('hashes password deterministically with salt', async () => {
    const hash1 = await hashPassword('SecretPass123');
    const hash2 = await hashPassword('SecretPass123');
    const hash3 = await hashPassword('DifferentPass123');

    expect(hash1).toBeDefined();
    expect(hash1.length).toBe(64); // SHA-256 is 64 hex chars
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it('handles empty or non-string passwords gracefully', async () => {
    expect(await hashPassword('')).toBe('');
    expect(await hashPassword(null)).toBe('');
    expect(await hashPassword(undefined)).toBe('');
  });

  it('sanitizes user sessions by stripping password field', () => {
    const user = {
      id: 'user-123',
      name: 'John Doe',
      username: 'johndoe',
      password: 'plainOrHashedPassword',
      age: 30
    };

    const sanitized = sanitizeUserSession(user);
    expect(sanitized).toEqual({
      id: 'user-123',
      name: 'John Doe',
      username: 'johndoe',
      age: 30
    });
    expect(sanitized.password).toBeUndefined();
  });

  it('handles null/invalid user in sanitizeUserSession', () => {
    expect(sanitizeUserSession(null)).toBeNull();
    expect(sanitizeUserSession(undefined)).toBeNull();
  });
});
