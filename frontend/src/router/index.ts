import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录', public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { title: '注册', public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '首页' },
        },
        {
          path: 'knowledge',
          name: 'knowledge-list',
          component: () => import('@/views/knowledge/ArticleListView.vue'),
          meta: { title: '知识库', permission: 'kb:read' },
        },
        {
          path: 'approval-center',
          name: 'approval-center',
          component: () => import('@/views/approval/ApprovalCenterView.vue'),
          meta: { title: '审批中心', permission: 'kb:read' },
        },
        {
          path: 'audit-center',
          name: 'audit-center',
          component: () => import('@/views/audit/AuditCenterView.vue'),
          meta: { title: '审计中心', permission: 'audit:read' },
        },
        {
          path: 'tag-manage',
          name: 'tag-manage',
          component: () => import('@/views/tags/TagManageView.vue'),
          meta: { title: '标签管理', permission: 'kb:edit' },
        },
        {
          path: 'knowledge/create',
          name: 'knowledge-create',
          component: () => import('@/views/knowledge/ArticleEditorPage.vue'),
          meta: { title: '新建知识', permission: 'kb:create' },
        },
        {
          path: 'knowledge/:id',
          name: 'knowledge-detail',
          component: () => import('@/views/knowledge/ArticleDetailView.vue'),
          meta: { title: '知识详情', permission: 'kb:read' },
        },
        {
          path: 'knowledge/:id/edit',
          name: 'knowledge-edit',
          component: () => import('@/views/knowledge/ArticleEditorPage.vue'),
          meta: { title: '编辑知识', permission: 'kb:edit' },
        },
        {
          path: 'common-components',
          name: 'common-components',
          component: () => import('@/views/common/CommonComponentsDemoView.vue'),
          meta: { title: '组件展示' },
        },
        {
          path: '403',
          name: 'forbidden',
          component: () => import('@/views/ForbiddenView.vue'),
          meta: { title: '无权限' },
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const store = useUserStore()

  if (to.meta.public) {
    if ((to.name === 'login' || to.name === 'register') && store.isLoggedIn) {
      return { path: '/dashboard' }
    }
    return true
  }

  if (!store.token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (!store.user) {
    try {
      await store.loadProfile()
    } catch {
      store.logout()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  const perm = to.meta.permission as string | undefined
  if (perm && !store.hasPermission(perm)) {
    return { name: 'forbidden' }
  }

  return true
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : '银行知识库'
  document.title = `${title} · 银行知识库`
})

export default router
