import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ContentsView from '../views/ContentsView.vue'
import api from '../services/api'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresAuth: false }
  },
  {
    path: '/contents',
    name: 'Contents',
    component: ContentsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    redirect: '/contents'
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// ナビゲーションガード - 認証チェック
router.beforeEach((to, from, next) => {
  const isAuthenticated = api.isAuthenticated()
  const requiresAuth = to.meta.requiresAuth

  // 認証が必要なページなのに未認証の場合
  if (requiresAuth && !isAuthenticated) {
    next('/login')
  }
  // ログインページなのに既に認証済みの場合
  else if (to.path === '/login' && isAuthenticated) {
    next('/contents')
  }
  // その他の場合はそのまま進む
  else {
    next()
  }
})

export default router
