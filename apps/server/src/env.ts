import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const cache = new Map<string, string>();

/** 读取 .env（向上查找），不存在的键回退默认值；仅本地开发用途 */
export function loadEnv(): Record<string, string> {
  if (cache.size === 0) {
    let dir = process.cwd();
    for (let i = 0; i < 5; i++) {
      const file = join(dir, '.env');
      if (existsSync(file)) {
        for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
          const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
          if (m && !cache.has(m[1])) cache.set(m[1], m[2]);
        }
        break;
      }
      const parent = join(dir, '..');
      if (parent === dir) break;
      dir = parent;
    }
  }
  return Object.fromEntries(cache);
}

export function env(key: string, fallback: string): string {
  const value = process.env[key] ?? loadEnv()[key];
  return value === undefined || value === '' ? fallback : value;
}
