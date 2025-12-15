<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/auth'
import { storage } from '../utils/storage'

const router = useRouter()

const form = ref({
  phone: '',
  username: '',
  password: ''
})

const loading = ref(false)

async function handleLogin() {
  if (!form.value.phone || !form.value.username || !form.value.password) {
    alert('请输入手机号、用户名和密码')
    return
  }
  
  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(form.value.phone)) {
    alert('请输入有效的手机号')
    return
  }

  loading.value = true

  try {
    const res = await login(form.value) as any
    if (res && res.data) {
      storage.setToken(res.data.token)
      storage.setUserInfo(res.data.userInfo)
      router.push('/dashboard')
    } else {
      alert('登录失败：服务器返回数据异常')
    }
  } catch (error: any) {
    console.error('Login failed:', error)
    const errorMessage = error.response?.data?.message || error.message || '登录失败，请检查手机号、用户名和密码'
    alert(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">Floral Admin</h1>
        <p class="login-subtitle">花卉商城管理系统</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">手机号</label>
          <input
            v-model="form.phone"
            type="text"
            class="form-input"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </div>

        <div class="form-group">
          <label class="form-label">用户名</label>
          <input
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="请输入用户名"
          />
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
          />
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="login-tips">
        <p>请输入管理员手机号、用户名和密码</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-white) 100%);
}

.login-card {
  background-color: var(--color-white);
  border-radius: var(--border-radius);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: var(--color-text);
  margin-bottom: 8px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 14px;
  color: var(--color-text);
  background-color: var(--color-white);
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.login-btn {
  width: 100%;
  padding: 12px;
  background-color: var(--color-primary);
  color: var(--color-white);
  border-radius: var(--border-radius);
  font-size: 16px;
  font-weight: 500;
  margin-top: 8px;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-tips {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 12px;
}
</style>
