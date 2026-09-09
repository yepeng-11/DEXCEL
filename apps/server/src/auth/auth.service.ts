import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import type { Role, UserInfo } from '@dexcel/shared';
import { hashPassword, verifyPassword } from './password.util';
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

  /**
   * 登录：校验账号、口令与所选页面一致。
   * 角色规则：管理员可进入管理员页面或用户页面；普通用户只能进入用户页面。
   */
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
    if (role === 'admin' && user.role !== 'admin') {
      throw new UnauthorizedException('普通用户账号无法进入管理员页面，请选择“用户页面”登录');
    }
    const sid = randomUUID();
    const info: UserInfo = { id: user.id, username: user.username, displayName: user.display_name, role: user.role };
    this.sessions.set(sid, { user: info, expiresAt: Date.now() + SESSION_TTL_MS });
    return { ...info, sid };
  }

  /**
   * 注册：开放注册仅限普通用户（role 固定为 'user'）。
   * 管理员账号由现有管理员在系统内开通，不走自助注册。
   */
  async register(username: string, password: string, displayName: string): Promise<UserInfo & { sid: string }> {
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
      throw new UnauthorizedException('账号需为 3-32 位字母、数字或下划线');
    }
    if (password.length < 6 || password.length > 64) {
      throw new UnauthorizedException('密码长度需为 6-64 位');
    }
    const name = (displayName || username).slice(0, 64);
    const [dup] = await this.database.db.query<UserRow[]>(
      'SELECT id FROM sys_user WHERE username = ? LIMIT 1',
      [username],
    );
    if (dup.length > 0) {
      throw new UnauthorizedException('该账号已被注册，请换一个');
    }
    const [result] = await this.database.db.query(
      'INSERT INTO sys_user (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
      [username, hashPassword(password), name, 'user'],
    );
    const id = Number((result as { insertId: number }).insertId);
    const sid = randomUUID();
    const info: UserInfo = { id, username, displayName: name, role: 'user' };
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
