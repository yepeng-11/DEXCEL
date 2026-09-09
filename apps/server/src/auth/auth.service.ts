import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import type { Role, UserInfo } from '@dexcel/shared';
import { verifyPassword } from './password.util';
import { DatabaseService } from '../database/database.module';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 小时
export const SESSION_COOKIE = 'dexcel_sid';

interface Session {
  user: UserInfo;
  expiresAt: number;
}

export interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  role: Role;
  status: 'active' | 'disabled';
}

/**
 * 内存 Session（plan.md 6.1：单体阶段不引入 Redis）。
 * 服务重启即失效，属预期行为；接入 Redis 时只替换本文件的存储实现。
 */
@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, Session>();

  constructor(private readonly database: DatabaseService) {}

  /** 登录：校验账号、口令与所选角色三者一致 */
  async login(username: string, password: string, role: Role): Promise<UserInfo & { sid: string }> {
    const [rows] = await this.database.db.query<UserRow[]>(
      'SELECT id, username, password_hash, display_name, role, status FROM sys_user WHERE username = ? LIMIT 1',
      [username],
    );
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw new UnauthorizedException('账号或密码不正确');
    }
    if (user.status !== 'active') {
      throw new UnauthorizedException('账号已被停用');
    }
    if (user.role !== role) {
      throw new UnauthorizedException(
        user.role === 'admin' ? '该账号是管理员，请在上方选择“管理员”登录' : '该账号是普通用户，请在上方选择“普通用户”登录',
      );
    }
    const sid = randomUUID();
    const info: UserInfo = { id: user.id, username: user.username, displayName: user.display_name, role: user.role };
    this.sessions.set(sid, { user: info, expiresAt: Date.now() + SESSION_TTL_MS });
    return { ...info, sid };
  }

  getUserBySid(sid: string | undefined): UserInfo | null {
    if (!sid) return null;
    const session = this.sessions.get(sid);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sid);
      return null;
    }
    return session.user;
  }

  logout(sid: string | undefined): void {
    if (sid) this.sessions.delete(sid);
  }
}
