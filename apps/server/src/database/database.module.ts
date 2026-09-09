import { Global, Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { createPool, type Pool } from 'mysql2/promise';
import { env } from '../env';
import { MIGRATIONS } from './migrations';
import { hashPassword } from '../auth/password.util';
import type { RowDataPacket } from 'mysql2';

/**
 * 数据服务基座（plan.md 6.3 架构护栏"数据服务"边界）
 * - mysql2 连接池，全部数据访问经由此模块
 * - 启动时执行幂等迁移与种子数据
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor() {
    this.pool = createPool({
      host: env('DB_HOST', '127.0.0.1'),
      port: Number(env('DB_PORT', '3306')),
      user: env('DB_USER', 'root'),
      password: env('DB_PASSWORD', ''),
      database: env('DB_NAME', 'dexcel'),
      connectionLimit: 10,
      charset: 'utf8mb4',
      timezone: 'Z',
    });
  }

  get db(): Pool {
    return this.pool;
  }

  async onModuleInit(): Promise<void> {
    for (const migration of MIGRATIONS) {
      await this.pool.query(migration.sql);
      this.logger.log(`migration ok: ${migration.name}`);
    }
    await this.seedUsers();
  }

  /** 种子账号：admin / 123456（管理员），user / 123456（普通用户） */
  private async seedUsers(): Promise<void> {
    const seeds = [
      { username: 'admin', displayName: '系统管理员', role: 'admin' as const },
      { username: 'user', displayName: '普通用户', role: 'user' as const },
    ];
    for (const seed of seeds) {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        'SELECT id FROM sys_user WHERE username = ?',
        [seed.username],
      );
      if (rows.length > 0) continue;
      await this.pool.query(
        'INSERT INTO sys_user (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)',
        [seed.username, hashPassword('123456'), seed.displayName, seed.role],
      );
      this.logger.log(`seed user: ${seed.username} (${seed.role})`);
    }
  }
}

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
