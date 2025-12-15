<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storage } from '../utils/storage'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const userInfo = computed(() => storage.getUserInfo())

const menuItems = [
  { path: '/dashboard', icon: '📊', label: '仪表盘' },
  { path: '/products', icon: '🌸', label: '商品管理' },
  { path: '/orders', icon: '📦', label: '订单管理' },
  { path: '/users', icon: '👥', label: '用户管理' },
  { path: '/categories', icon: '📁', label: '分类管理' }
]

function toggleSidebar() {
  collapsed.value = !collapsed.value
}

function handleLogout() {
  if (confirm('确认退出登录？')) {
    storage.clear()
    router.push('/login')
  }
}

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <span v-if="!collapsed">Floral Admin</span>
          <span v-else>FA</span>
        </div>
      </div>
      <nav class="sidebar-menu">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="menu-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span v-if="!collapsed" class="menu-label">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <div class="main-container">
      <header class="header">
        <button class="toggle-btn" @click="toggleSidebar">
          {{ collapsed ? '☰' : '✕' }}
        </button>
        <div class="header-right">
          <span class="user-name">Hello, {{ userInfo?.username }}</span>
          <button class="logout-btn" @click="handleLogout">退出</button>
        </div>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background-color: var(--color-white);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: width var(--transition-speed);
  overflow: hidden;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-primary-light);
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-primary);
}

.sidebar-menu {
  padding: var(--spacing-md) 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px var(--spacing-md);
  color: var(--color-text);
  transition: all var(--transition-speed);
  cursor: pointer;
  text-decoration: none;
}

.menu-item:hover {
  background-color: var(--color-primary-light);
}

.menu-item.active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
  border-right: 3px solid var(--color-primary);
}

.menu-icon {
  font-size: 20px;
  margin-right: var(--spacing-md);
  min-width: 20px;
}

.sidebar.collapsed .menu-icon {
  margin-right: 0;
}

.menu-label {
  white-space: nowrap;
}

.main-container {
  flex: 1;
  margin-left: var(--sidebar-width);
  transition: margin-left var(--transition-speed);
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed + .main-container {
  margin-left: var(--sidebar-collapsed-width);
}

.header {
  height: var(--header-height);
  background-color: var(--color-white);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  position: sticky;
  top: 0;
  z-index: 99;
}

.toggle-btn {
  background: none;
  font-size: 20px;
  color: var(--color-text);
  padding: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-name {
  color: var(--color-text-secondary);
}

.logout-btn {
  padding: 6px 16px;
  background-color: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
}

.logout-btn:hover {
  opacity: 0.9;
}

.content {
  flex: 1;
  padding: var(--spacing-lg);
  background-color: var(--color-bg);
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }

  .main-container {
    margin-left: 0;
  }
}
</style>
