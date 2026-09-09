<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { ApiError } from '@dexcel/shared';

const serverMessage = ref<string>('（未连接）');

onMounted(async () => {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      const body = (await res.json()) as ApiError;
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    const body = (await res.json()) as { status: string };
    serverMessage.value = `后端正常（${body.status}）`;
  } catch (e) {
    serverMessage.value = `后端未连接：${e instanceof Error ? e.message : String(e)}`;
  }
});
</script>

<template>
  <main class="home">
    <h1>DEXCEL</h1>
    <p>类 Excel 低代码业务平台 · 工程骨架已就绪</p>
    <p class="status">后端健康检查：{{ serverMessage }}</p>
  </main>
</template>

<style scoped>
.home {
  max-width: 720px;
  margin: 80px auto;
  font-family: system-ui, sans-serif;
}
.status {
  color: #666;
}
</style>
