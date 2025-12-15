<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getUserList, resetPassword } from '../api/user'
import type { User } from '../types'

const users = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const roleFilter = ref('all')

const roleOptions = [
  { value: 'all', label: '全部' },
  { value: 'Admin', label: '管理员' },
  { value: 'User', label: '用户' }
]

async function loadUsers() {
  try {
    const res = await getUserList({
      page: page.value,
      pageSize: pageSize.value,
      role: roleFilter.value === 'all' ? '' : roleFilter.value
    }) as any
    if (res && res.data) {
      users.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('Failed to load users:', error)
    alert('加载用户列表失败')
  }
}

function handleRoleChange() {
  page.value = 1
  loadUsers()
}

function handlePageChange(newPage: number) {
  page.value = newPage
  loadUsers()
}

async function handleResetPassword(user: User) {
  if (!confirm(`确认重置用户 ${user.username} 的密码为 123456？`)) return

  try {
    await resetPassword(user.id)
    alert('密码重置成功')
  } catch (error: any) {
    console.error('Failed to reset password:', error)
    const errorMessage = error.response?.data?.message || error.message || '重置密码失败'
    alert(errorMessage)
  }
}

function getRoleText(role: string) {
  return role === 'Admin' ? '管理员' : '用户'
}

function getRoleClass(role: string) {
  return role === 'Admin' ? 'role-admin' : 'role-user'
}

function getTotalPages() {
  return Math.ceil(total.value / pageSize.value)
}

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="users">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
    </div>

    <div class="toolbar card">
      <div class="filter-box">
        <label class="filter-label">角色：</label>
        <select v-model="roleFilter" class="form-input" @change="handleRoleChange">
          <option v-for="option in roleOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="table-container card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>昵称</th>
            <th>角色</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.nickname }}</td>
            <td>
              <span class="role-badge" :class="getRoleClass(user.role)">
                {{ getRoleText(user.role) }}
              </span>
            </td>
            <td>
              <button class="btn-text" @click="handleResetPassword(user)">重置密码</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button :disabled="page === 1" @click="handlePageChange(page - 1)">上一页</button>
        <span>第 {{ page }} / {{ getTotalPages() }} 页</span>
        <button :disabled="page >= getTotalPages()" @click="handlePageChange(page + 1)">
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users {
  max-width: 1400px;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
}

.toolbar {
  margin-bottom: var(--spacing-lg);
}

.filter-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-label {
  font-weight: 500;
  color: var(--color-text);
}

.filter-box .form-input {
  width: 200px;
}

.table-container {
  overflow-x: auto;
}

.btn-text {
  background: none;
  color: var(--color-primary);
  padding: 4px 8px;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-admin {
  background-color: #e3f2fd;
  color: #2196f3;
}

.role-user {
  background-color: #f3e5f5;
  color: #9c27b0;
}
</style>
