import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserInfo } from '@dexcel/shared';
import { authApi } from '../api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null);
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

  async function login(username: string, password: string, role: 'admin' | 'user') {
    const { user: info } = await authApi.login({ username, password, role });
    user.value = info;
  }

  async function logout() {
    await authApi.logout().catch(() => undefined);
    user.value = null;
  }

  return { user, checked, fetchMe, login, logout };
});
