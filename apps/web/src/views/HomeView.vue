<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();

async function handleLogout() {
  await auth.logout();
  await router.push('/login');
}
</script>

<template>
  <main class="home">
    <nav class="topbar">
      <span class="brand">DEXCEL</span>
      <span class="spacer" />
      <span class="user-chip" :class="auth.user?.role">
        {{ auth.user?.role === 'admin' ? '管理员' : '普通用户' }}
      </span>
      <span class="username">{{ auth.user?.displayName }}</span>
      <button class="logout" @click="handleLogout">退出登录</button>
    </nav>

    <section class="welcome">
      <h1>欢迎，{{ auth.user?.displayName }}</h1>
      <p>
        {{
          auth.user?.role === 'admin'
            ? '你已进入管理设计端：后续将在此搭建模板、数据关系、规则、权限与流程（M1-B 轨开发中）。'
            : '你已进入工作人员端：后续将在此办理业务、录入、审批与查询（M1-C 轨开发中）。'
        }}
      </p>
    </section>
  </main>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: #f6f8fb;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  padding: 0 24px;
  height: 56px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
}

.brand {
  font-weight: 700;
  color: #2563eb;
  letter-spacing: 0.5px;
}

.spacer {
  flex: 1;
}

.user-chip {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
}

.user-chip.admin {
  background: #eff6ff;
  color: #2563eb;
}

.user-chip.user {
  background: #ecfdf5;
  color: #059669;
}

.username {
  color: #334155;
  font-size: 14px;
}

.logout {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}

.logout:hover {
  border-color: #93c5fd;
  color: #2563eb;
}

.welcome {
  max-width: 720px;
  margin: 72px auto;
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.06);
}

.welcome h1 {
  margin: 0 0 12px;
  color: #0f172a;
}

.welcome p {
  color: #64748b;
  line-height: 1.8;
  margin: 0;
}
</style>
