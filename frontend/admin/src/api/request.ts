import axios, { AxiosInstance, AxiosResponse } from 'axios'
// import { setupMock, disableMock } from '../mock'
import { storage } from '../utils/storage'
import type { ApiResponse } from '../types'

// 不使用 mock，直接使用真实后端 API
// 如果需要使用 mock 数据，请取消下面的注释：
// import { setupMock } from '../mock'
// setupMock()

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const token = storage.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (res.code === 200) {
      return res as any
    } else {
      alert(res.message || 'Request failed')
      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      storage.clear()
      window.location.href = '/login'
    }
    alert(error.response?.data?.message || error.message || 'Network error')
    return Promise.reject(error)
  }
)

export default request
