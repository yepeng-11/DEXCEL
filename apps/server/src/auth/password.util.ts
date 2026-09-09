import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * 口令哈希：scrypt + 随机盐，存储格式 `scrypt:<salt>:<hash>`
 * 为什么不用 bcrypt：零额外依赖，node:crypto 足够；替换为 bcrypt/argon2 时只改本文件
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plain, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const candidate = scryptSync(plain, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
