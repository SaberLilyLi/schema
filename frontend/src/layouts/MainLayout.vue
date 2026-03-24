<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Fold,
  Expand,
  House,
  Reading,
  Plus,
  ArrowDown,
  Sunny,
  Moon,
  Grid,
  Stamp,
  DataAnalysis,
  CollectionTag,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useTheme } from '@/composables/useTheme'

interface MenuItemConfig {
  index: string
  label: string
  icon: unknown
  requiredPermissions?: string[]
  permissionMode?: 'all' | 'any'
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const theme = useTheme()

const collapsed = ref(false)
const menuItems: MenuItemConfig[] = [
  { index: '/dashboard', label: '首页', icon: House },
  {
    index: '/knowledge',
    label: '知识库',
    icon: Reading,
    requiredPermissions: ['kb:read'],
    permissionMode: 'all',
  },
  {
    index: '/knowledge/create',
    label: '新建知识',
    icon: Plus,
    requiredPermissions: ['kb:create'],
    permissionMode: 'all',
  },
  {
    index: '/approval-center',
    label: '审批中心',
    icon: Stamp,
    requiredPermissions: ['kb:submit', 'approval:approve'],
    permissionMode: 'any',
  },
  {
    index: '/audit-center',
    label: '审计中心',
    icon: DataAnalysis,
    requiredPermissions: ['audit:read'],
    permissionMode: 'all',
  },
  {
    index: '/tag-manage',
    label: '标签管理',
    icon: CollectionTag,
    requiredPermissions: ['kb:edit'],
    permissionMode: 'all',
  },
  { index: '/common-components', label: '组件展示', icon: Grid },
]

function canShowMenu(menu: MenuItemConfig) {
  if (!menu.requiredPermissions?.length) return true
  if (menu.permissionMode === 'any') {
    return menu.requiredPermissions.some((perm) => userStore.hasPermission(perm))
  }
  return menu.requiredPermissions.every((perm) => userStore.hasPermission(perm))
}

const visibleMenuItems = computed(() => menuItems.filter((menu) => canShowMenu(menu)))

const activeMenu = computed(() => {
  const p = route.path
  if (p.startsWith('/knowledge/create')) return '/knowledge/create'
  if (p.startsWith('/approval-center')) return '/approval-center'
  if (p.startsWith('/audit-center')) return '/audit-center'
  if (p.startsWith('/tag-manage')) return '/tag-manage'
  if (p.startsWith('/knowledge/') && p !== '/knowledge') {
    return '/knowledge'
  }
  if (p.startsWith('/knowledge')) return '/knowledge'
  if (p.startsWith('/common-components')) return '/common-components'
  if (p.startsWith('/dashboard')) return '/dashboard'
  return p
})

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="layout__aside">
      <div class="layout__logo">
        <span v-if="!collapsed" class="layout__logo-text">银行知识库</span>
        <span v-else class="layout__logo-mini">KB</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        router
        class="layout__menu"
      >
        <el-menu-item
          v-for="menu in visibleMenuItems"
          :key="menu.index"
          :index="menu.index"
        >
          <el-icon><component :is="menu.icon" /></el-icon>
          <span>{{ menu.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container direction="vertical" class="layout__right">
      <el-header class="layout__header">
        <el-button
          text
          class="layout__collapse"
          @click="collapsed = !collapsed"
        >
          <el-icon :size="18">
            <Expand v-if="collapsed" />
            <Fold v-else />
          </el-icon>
        </el-button>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item v-if="route.meta.title">
            {{ route.meta.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
        <div class="layout__spacer" />
        <el-tooltip :content="theme.themeLabel" placement="bottom">
          <el-button
            text
            class="layout__theme-btn"
            @click="theme.toggleTheme"
          >
            <el-icon :size="18">
              <Moon v-if="theme.isDark" />
              <Sunny v-else />
            </el-icon>
          </el-button>
        </el-tooltip>
        <el-dropdown trigger="click">
          <span class="layout__user">
            {{ userStore.displayLabel }}
            <el-icon class="layout__caret"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                {{ userStore.user?.username }}
              </el-dropdown-item>
              <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="layout__main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout {
  min-height: 100vh;
}

.layout__aside {
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
  transition: width 0.2s;
}

.layout__logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: var(--el-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.layout__logo-mini {
  font-size: 14px;
}

.layout__menu {
  border-right: none;
}

.layout__right {
  min-width: 0;
}

.layout__header {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  padding: 0 16px;
}

.layout__collapse {
  margin-right: 4px;
}

.layout__spacer {
  flex: 1;
}

.layout__theme-btn {
  color: var(--el-text-color-primary);
}

.layout__user {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.layout__caret {
  font-size: 12px;
}

.layout__main {
  background: var(--el-fill-color-light);
  padding: 20px;
}
</style>
