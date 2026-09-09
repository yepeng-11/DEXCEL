import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
  ],
});

/** 全局守卫：未登录访问受保护页面时跳转登录页 */
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.checked) await auth.fetchMe();
  if (to.meta.public) return true;
  return auth.user ? true : { name: 'login', query: { redirect: to.fullPath } };
});

export default router;
