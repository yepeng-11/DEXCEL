import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Role, UserInfo } from '@dexcel/shared';
import { authApi } from '../api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null);
  /** 登录时进入的页面视图：管理员页面 / 用户页面 */
  const viewRole = ref<Role>('user');
  /** 是否已完成过一次会话检查（避免路由守卫闪烁跳转） */
  const checked = ref(false);

  async function fetchMe(): Promise<UserInfo | null> {
    try {
      user.value = (await authApi.me()).user;
    } catch {
      user.value = null;
    } finally {
      checked.value = true;
    }
    return user.value;
  }

  async function login(username: string, password: string, role: Role) {
    const { user: info } = await authApi.login({ username, password, role });
    user.value = info;
    viewRole.value = role;
  }

  async function register(username: string, password: string, displayName: string) {
    const { user: info } = await authApi.register({ username, password, displayName });
    user.value = info;
    viewRole.value = 'user';
  }

  async function logout() {
    await authApi.logout().catch(() => undefined);
    user.value = null;
  }

  return { user, viewRole, checked, fetchMe, login, register, logout };
});
