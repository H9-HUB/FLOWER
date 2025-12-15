import { createRouter, createWebHistory } from 'vue-router'
import { storage } from '../utils/storage'
import AdminLayout from '../layouts/AdminLayout.vue'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Products from '../views/Products.vue'
import Orders from '../views/Orders.vue'
import Users from '../views/Users.vue'
import Categories from '../views/Categories.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/',
      component: AdminLayout,
      redirect: '/dashboard',
      children: [
        {
          path: '/dashboard',
          name: 'Dashboard',
          component: Dashboard
        },
        {
          path: '/products',
          name: 'Products',
          component: Products
        },
        {
          path: '/orders',
          name: 'Orders',
          component: Orders
        },
        {
          path: '/users',
          name: 'Users',
          component: Users
        },
        {
          path: '/categories',
          name: 'Categories',
          component: Categories
        }
      ]
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const token = storage.getToken()

  if (to.path === '/login') {
    if (token) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    if (token) {
      next()
    } else {
      next('/login')
    }
  }
})

export default router
