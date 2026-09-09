/**
 * 数据库结构迁移与种子数据（执行入口见 database.module.ts）
 *
 * 说明：M1 早期迁移数量少，直接以代码内 SQL 管理（幂等，CREATE TABLE IF NOT EXISTS）；
 * 迁移文件增多后再切换为 SQL 文件 + _migrations 台账执行器。
 */

export interface Migration {
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    name: '001_create_sys_user',
    sql: `
      CREATE TABLE IF NOT EXISTS sys_user (
        id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username      VARCHAR(64)  NOT NULL COMMENT '登录账号',
        password_hash VARCHAR(255) NOT NULL COMMENT '口令哈希 scrypt:<salt>:<hash>',
        display_name  VARCHAR(64)  NOT NULL COMMENT '显示名称',
        role          ENUM('admin','user') NOT NULL DEFAULT 'user' COMMENT '角色：admin=管理设计端 user=工作人员端',
        status        ENUM('active','disabled') NOT NULL DEFAULT 'active' COMMENT '账号状态',
        created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        UNIQUE KEY uk_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='平台用户表';
    `,
  },
];
