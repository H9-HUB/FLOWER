import axios from 'axios'

let mockEnabled = true

export function enableMock() {
  mockEnabled = true
}

export function disableMock() {
  mockEnabled = false
}

const mockData: Record<string, any> = {
  '/api/admin/login': {
    code: 200,
    message: 'success',
    data: {
      token: 'mock-token-123456',
      userInfo: {
        id: 1,
        username: 'admin',
        role: 'Admin'
      }
    }
  },
  '/api/admin/stat/overview': {
    code: 200,
    message: 'success',
    data: {
      todayOrders: 25,
      totalOrders: 279,
      totalRevenue: 126000,
      totalCustomers: 65,
      orderStatusDistribution: {
        pending: 45,
        completed: 200,
        cancelled: 34
      }
    }
  }
}

function generateProducts(page: number, pageSize: number, keyword?: string) {
  const categories = ['玫瑰', '百合', '郁金香', '康乃馨', '向日葵']
  const allProducts = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `${categories[i % categories.length]}${i + 1}`,
    category: categories[i % categories.length],
    categoryId: (i % categories.length) + 1,
    price: Math.floor(Math.random() * 100) + 20,
    stock: Math.floor(Math.random() * 100),
    status: Math.random() > 0.3 ? 'on' : 'off',
    description: `这是一款精美的${categories[i % categories.length]}`
  }))

  let filteredProducts = allProducts
  if (keyword) {
    filteredProducts = allProducts.filter(p => p.name.includes(keyword))
  }

  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    code: 200,
    message: 'success',
    data: {
      list: filteredProducts.slice(start, end),
      total: filteredProducts.length,
      page,
      pageSize
    }
  }
}

function generateOrders(page: number, pageSize: number, status?: string) {
  const statuses = ['pending', 'completed', 'cancelled']
  const allOrders = Array.from({ length: 30 }, (_, i) => {
    const orderStatus = statuses[i % statuses.length]
    return {
      id: i + 1,
      orderNo: `ORD${String(i + 1).padStart(6, '0')}`,
      receiver: `客户${i + 1}`,
      amount: Math.floor(Math.random() * 500) + 50,
      status: orderStatus,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  })

  let filteredOrders = allOrders
  if (status && status !== 'all') {
    filteredOrders = allOrders.filter(o => o.status === status)
  }

  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    code: 200,
    message: 'success',
    data: {
      list: filteredOrders.slice(start, end),
      total: filteredOrders.length,
      page,
      pageSize
    }
  }
}

function generateUsers(page: number, pageSize: number, role?: string) {
  const roles = ['Admin', 'User']
  const allUsers = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    username: `user${i + 1}`,
    nickname: `用户${i + 1}`,
    role: i === 0 ? 'Admin' : roles[i % roles.length]
  }))

  let filteredUsers = allUsers
  if (role && role !== 'all') {
    filteredUsers = allUsers.filter(u => u.role === role)
  }

  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    code: 200,
    message: 'success',
    data: {
      list: filteredUsers.slice(start, end),
      total: filteredUsers.length,
      page,
      pageSize
    }
  }
}

const mockCategories = [
  { id: 1, name: '玫瑰', parentId: null, sort: 1, children: [] },
  { id: 2, name: '百合', parentId: null, sort: 2, children: [] },
  { id: 3, name: '郁金香', parentId: null, sort: 3, children: [] },
  { id: 4, name: '康乃馨', parentId: null, sort: 4, children: [] },
  { id: 5, name: '向日葵', parentId: null, sort: 5, children: [] }
]

function handleMockRequest(config: any) {
  const url = `${config.baseURL || ''}${config.url || ''}`
  const method = config.method?.toLowerCase()

  if (url.includes('/admin/login') && method === 'post') {
    return mockData['/api/admin/login']
  }

  if (url.includes('/admin/stat/overview') && method === 'get') {
    return mockData['/api/admin/stat/overview']
  }

  if (url.includes('/admin/product') && method === 'get') {
    const params = new URLSearchParams(config.params || {})
    const page = parseInt(params.get('page') || '1')
    const pageSize = parseInt(params.get('pageSize') || '10')
    const keyword = params.get('keyword') || ''
    return generateProducts(page, pageSize, keyword)
  }

  if (url.match(/\/admin\/product\/\d+\/status/) && method === 'put') {
    return { code: 200, message: 'success', data: null }
  }

  if (url.match(/\/admin\/product\/\d+$/) && method === 'put') {
    return { code: 200, message: 'success', data: null }
  }

  if (url.includes('/admin/product') && method === 'post') {
    return { code: 200, message: 'success', data: null }
  }

  if (url.match(/\/admin\/product\/\d+$/) && method === 'delete') {
    return { code: 200, message: 'success', data: null }
  }

  if (url.includes('/admin/order') && method === 'get') {
    const params = new URLSearchParams(config.params || {})
    const page = parseInt(params.get('page') || '1')
    const pageSize = parseInt(params.get('pageSize') || '10')
    const status = params.get('status') || ''
    return generateOrders(page, pageSize, status)
  }

  if (url.match(/\/admin\/order\/\d+\/(deliver|cancel)/) && method === 'put') {
    return { code: 200, message: 'success', data: null }
  }

  if (url.includes('/admin/user') && method === 'get') {
    const params = new URLSearchParams(config.params || {})
    const page = parseInt(params.get('page') || '1')
    const pageSize = parseInt(params.get('pageSize') || '10')
    const role = params.get('role') || ''
    return generateUsers(page, pageSize, role)
  }

  if (url.match(/\/admin\/user\/\d+\/pwd/) && method === 'put') {
    return { code: 200, message: 'success', data: null }
  }

  if (url.includes('/admin/category') && method === 'get') {
    return { code: 200, message: 'success', data: mockCategories }
  }

  if (url.includes('/admin/category') && method === 'post') {
    return { code: 200, message: 'success', data: null }
  }

  if (url.match(/\/admin\/category\/\d+$/) && method === 'put') {
    return { code: 200, message: 'success', data: null }
  }

  if (url.match(/\/admin\/category\/\d+$/) && method === 'delete') {
    return { code: 200, message: 'success', data: null }
  }

  return { code: 404, message: 'Mock data not found', data: null }
}

export function setupMock() {
  const originalAdapter = axios.defaults.adapter
  axios.defaults.adapter = async function (config) {
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`

    if (mockEnabled && (fullUrl.startsWith('/api/admin') || fullUrl.includes('/api/admin'))) {
      try {
        // eslint-disable-next-line no-console
        console.debug('[mock] intercept', fullUrl, config.method)
      } catch (e) {}
      await new Promise(resolve => setTimeout(resolve, 300))
      const mockResponse = handleMockRequest(config)
      return {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    }

    if (originalAdapter && typeof originalAdapter === 'function') {
      return originalAdapter(config)
    }

    throw new Error('No adapter found')
  }
}
