export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface LoginRequest {
  phone: string
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  userInfo: {
    id: number
    username: string
    role: string
  }
}

export interface StatOverview {
  todayOrders: number
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  orderStatusDistribution: {
    pending: number
    completed: number
    cancelled: number
  }
}

export interface Product {
  id: number
  name: string
  category: string
  categoryId: number
  price: number
  stock: number
  status: 'on' | 'off'
  image?: string
  description?: string
}

export interface Order {
  id: number
  orderNo: string
  receiver: string
  amount: number
  status: 'pending' | 'completed' | 'cancelled'
  createdAt: string
}

export interface User {
  id: number
  username: string
  nickname: string
  role: 'Admin' | 'User'
}

export interface Category {
  id: number
  name: string
  parentId: number | null
  sort: number
  children?: Category[]
}

export interface PageParams {
  page: number
  pageSize: number
  keyword?: string
  status?: string
  role?: string
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}
