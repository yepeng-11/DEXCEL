<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Role } from '@dexcel/shared';
import { useAuthStore } from '../stores/auth';
import illustration from '../assets/login-illustration.png';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

type Mode = 'login' | 'register';
const mode = ref<Mode>('login');
const role = ref<Role>('user');
const username = ref('');
const password = ref('');
const confirmEmailPassword = ref('');
const displayName = ref('');
const error = ref('');
const loading = ref(false);

const roleOptions: Array<{ value: Role; label: string; hint: string }> = [
  { value: 'admin', label: '管理员页面', hint: '模板设计 · 发布 · 系统管理' },
  { value: 'user', label: '用户页面', hint: '填报 · 审批 · 查询' },
];

const submitLabel = computed(() => {
  if (loading.value) return '请稍候…';
  if (mode.value === 'register') return '注册并进入';
  return role.value === 'admin' ? '登录管理员页面' : '登录用户页面';
});

function switchMode(target: Mode) {
  mode.value = target;
  error.value = '';
}

async function submit() {
  error.value = '';
  if (!username.value.trim() || !password.value) {
    error.value = '请输入账号和密码';
    return;
  }
  if (mode.value === 'register') {
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username.value.trim())) {
      error.value = '账号需为 3-32 位字母、数字或下划线';
      return;
    }
    if (password.value.length < 6) {
      error.value = '密码至少 6 位';
      return;
    }
    if (password.value !== confirmEmailPassword.value) {
      error.value = '两次输入的密码不一致';
      return;
    }
  }
  loading.value = true;
  try {
    if (mode.value === 'login') {
      await auth.login(username.value.trim(), password.value, role.value);
    } else {
      await auth.register(username.value.trim(), password.value, displayName.value.trim());
    }
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
    await router.push(redirect);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '操作失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="auth-page">
    <!-- 背景装饰云朵 -->
    <span class="cloud c1" />
    <span class="cloud c2" />
    <span class="cloud c3" />

    <div class="card">
      <!-- 左侧：品牌与插画 -->
      <aside class="visual">
        <img class="visual-img" :src="illustration" alt="" />
        <div class="visual-mask" />
        <div class="brand">
          <span class="brand-mark">芯</span>
          <span class="brand-name">诺泰芯 <em>· DEXCEL</em></span>
        </div>
        <div class="tagline">
          <h2>让业务回到表格，<br />让数据沉淀为资产</h2>
          <p>会 Excel 就会用的低代码业务平台，模板配置即发布，录入审批全流程。</p>
        </div>
      </aside>

      <!-- 右侧：表单 -->
      <section class="panel">
        <h1 class="title">{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</h1>
        <p class="subtitle">
          {{ mode === 'login' ? '选择进入的页面，开始今天的工作' : '注册后即成为平台用户，管理员账号请联系管理员开通' }}
        </p>

        <form @submit.prevent="submit">
          <!-- 登录：选择进入的页面 -->
          <div v-if="mode === 'login'" class="role-select">
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
          </div>

          <!-- 注册：昵称 -->
          <label v-if="mode === 'register'" class="field">
            <input v-model="displayName" type="text" placeholder="昵称（选填，默认同账号）" autocomplete="nickname" />
          </label>

          <label class="field">
            <input v-model="username" type="text" placeholder="账号" autocomplete="username" />
          </label>

          <label class="field">
            <input v-model="password" type="password" placeholder="密码" autocomplete="current-password" />
          </label>

          <label v-if="mode === 'register'" class="field">
            <input v-model="confirmEmailPassword" type="password" placeholder="确认密码" autocomplete="new-password" />
          </label>

          <p v-if="error" class="error" role="alert">{{ error }}</p>

          <button class="submit" type="submit" :disabled="loading">{{ submitLabel }}</button>
        </form>

        <p class="switch-row">
          <template v-if="mode === 'login'">还没有账号？<a @click.prevent="switchMode('register')">立即注册</a></template>
          <template v-else>已有账号？<a @click.prevent="switchMode('login')">直接登录</a></template>
        </p>

        <p v-if="mode === 'login'" class="hint">测试账号：admin / 123456（管理员） · user / 123456（用户）</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #dfe7fb 0%, #d4d9f7 45%, #cfe0f5 100%);
  position: relative;
  overflow: hidden;
  padding: 32px 16px;
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.55);
  border-radius: 999px;
  filter: blur(2px);
}

.cloud.c1 { width: 200px; height: 52px; top: 9%; left: 12%; }
.cloud.c2 { width: 130px; height: 36px; top: 18%; right: 10%; }
.cloud.c3 { width: 90px; height: 28px; bottom: 12%; left: 22%; }

.card {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: min(920px, 100%);
  min-height: 560px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(38, 55, 130, 0.28);
}

/* ---- 左侧视觉区 ---- */
.visual {
  position: relative;
  min-height: 380px;
}

.visual-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.visual-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 60, 0.34) 0%, rgba(15, 23, 60, 0.02) 40%, rgba(15, 23, 60, 0.55) 100%);
}

.brand {
  position: absolute;
  top: 22px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  z-index: 1;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f7df9, #22d3ee);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  box-shadow: 0 4px 14px rgba(34, 100, 246, 0.45);
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(15, 23, 60, 0.5);
}

.brand-name em {
  font-style: normal;
  font-size: 12px;
  font-weight: 500;
  opacity: 0.85;
}

.tagline {
  position: absolute;
  left: 26px;
  right: 26px;
  bottom: 26px;
  color: #fff;
  z-index: 1;
}

.tagline h2 {
  margin: 0 0 10px;
  font-size: 22px;
  line-height: 1.45;
  text-shadow: 0 2px 10px rgba(15, 23, 60, 0.55);
}

.tagline p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.92;
  text-shadow: 0 1px 6px rgba(15, 23, 60, 0.55);
}

/* ---- 右侧表单区 ---- */
.panel {
  background: #fff;
  padding: 48px 44px 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  margin: 0 0 6px;
  font-size: 26px;
  color: #1e293b;
  text-align: center;
}

.subtitle {
  margin: 0 0 24px;
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
}

.role-select {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.role-card {
  border: 1.5px solid #e4ebf8;
  border-radius: 12px;
  background: #f7faff;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: all 0.15s ease;
}

.role-card:hover {
  border-color: #a5c3fa;
}

.role-card.active {
  border-color: #4a6cf7;
  background: #eef3ff;
  box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.12);
}

.role-label {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.role-hint {
  font-size: 11px;
  color: #8fa3c4;
}

.field {
  display: block;
  margin-bottom: 14px;
}

.field input {
  width: 100%;
  box-sizing: border-box;
  height: 46px;
  border: 1px solid #dbe7fb;
  border-radius: 999px;
  background: #f2f6fe;
  padding: 0 18px;
  font-size: 14px;
  color: #1e293b;
  outline: none;
  transition: all 0.15s ease;
}

.field input::placeholder {
  color: #9fb3d4;
}

.field input:focus {
  border-color: #4a6cf7;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.1);
}

.error {
  color: #dc2626;
  font-size: 13px;
  margin: 0 0 12px;
}

.submit {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #5b8def, #4a6cf7);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.1s ease;
}

.submit:hover {
  opacity: 0.92;
}

.submit:active {
  transform: scale(0.99);
}

.submit:disabled {
  opacity: 0.6;
  cursor: default;
}

.switch-row {
  margin: 18px 0 0;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
}

.switch-row a {
  color: #4a6cf7;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.hint {
  margin: 14px 0 0;
  padding-top: 14px;
  border-top: 1px dashed #e4ebf8;
  font-size: 12px;
  color: #b3c0d6;
  text-align: center;
}

@media (max-width: 760px) {
  .card {
    grid-template-columns: 1fr;
  }

  .visual {
    min-height: 200px;
  }

  .tagline {
    display: none;
  }
}
</style>
