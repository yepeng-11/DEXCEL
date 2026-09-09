<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Role } from '@dexcel/shared';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const role = ref<Role>('admin');
const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const roleOptions: Array<{ value: Role; label: string; hint: string }> = [
  { value: 'admin', label: '管理员', hint: '模板设计 · 发布 · 系统管理' },
  { value: 'user', label: '普通用户', hint: '填报 · 审批 · 查询' },
];

async function submit() {
  if (!username.value.trim() || !password.value) {
    error.value = '请输入账号和密码';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await auth.login(username.value.trim(), password.value, role.value);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.push(redirect);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <div class="login-card">
      <header class="brand">
        <div class="logo">DX</div>
        <div>
          <h1>DEXCEL</h1>
          <p class="subtitle">类 Excel 低代码业务平台</p>
        </div>
      </header>

      <section class="role-select" aria-label="登录身份">
        <button
          v-for="option in roleOptions"
          :key="option.value"
          type="button"
          class="role-card"
          :class="{ active: role === option.value }"
          @click="role = option.value"
        >
          <span class="role-label">{{ option.label }}</span>
          <span class="role-hint">{{ option.hint }}</span>
        </button>
      </section>

      <form @submit.prevent="submit">
        <label class="field">
          <span class="field-label">账号</span>
          <input v-model="username" type="text" autocomplete="username" placeholder="请输入账号" />
        </label>
        <label class="field">
          <span class="field-label">密码</span>
          <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码" />
        </label>

        <p v-if="error" class="error" role="alert">{{ error }}</p>

        <button class="submit" type="submit" :disabled="loading">
          {{ loading ? '登录中…' : `以“${role === 'admin' ? '管理员' : '普通用户'}”身份登录` }}
        </button>
      </form>

      <footer class="hint">
        测试账号：管理员 admin / 123456 · 普通用户 user / 123456
      </footer>
    </div>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 50%, #ecfeff 100%);
  padding: 24px;
}

.login-card {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(30, 64, 175, 0.12);
  padding: 36px 32px 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  color: #fff;
  font-weight: 700;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 1px;
}

h1 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: #64748b;
}

.role-select {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 22px;
}

.role-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.15s ease;
}

.role-card:hover {
  border-color: #93c5fd;
}

.role-card.active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.role-label {
  font-weight: 600;
  color: #0f172a;
  font-size: 15px;
}

.role-hint {
  font-size: 12px;
  color: #64748b;
}

.field {
  display: block;
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: 13px;
  color: #334155;
  margin-bottom: 6px;
}

.field input {
  width: 100%;
  box-sizing: border-box;
  height: 42px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease;
}

.field input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.error {
  color: #dc2626;
  font-size: 13px;
  margin: 0 0 12px;
}

.submit {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #0891b2);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.submit:hover {
  opacity: 0.92;
}

.submit:disabled {
  opacity: 0.6;
  cursor: default;
}

.hint {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px dashed #e2e8f0;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
}
</style>
