/**
 * DEXCEL 前后端共享契约
 * 契约先行：A 轨每交付一个 API，先在此提交类型与示例，见 docs/execution-plan.md 第六节。
 */

/** 统一 API 错误响应 */
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

/** 字段数据类型（M1 首批） */
export enum FieldDataType {
  Text = 'text',
  Number = 'number',
  Date = 'date',
  Option = 'option',
  Ref = 'ref',
}

/** 关联取数策略（plan.md 6.2 #3） */
export enum FetchStrategy {
  /** 实时引用：读取当前来源数据 */
  Live = 'live',
  /** 取数快照：选定时的值存入业务记录 */
  Snapshot = 'snapshot',
}

/** 平台角色：管理设计端账号 / 工作人员端账号 */
export type Role = 'admin' | 'user';

/** 登录用户信息（不含口令） */
export interface UserInfo {
  id: number;
  username: string;
  displayName: string;
  role: Role;
}
