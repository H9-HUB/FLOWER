<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getOrderList, deliverOrder, cancelOrder } from '../api/order'
import { formatDate } from '../utils/format'
import type { Order } from '../types'

const orders = ref<Order[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const statusFilter = ref('all')

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '已下单' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

async function loadOrders() {
  try {
    const res = await getOrderList({
      page: page.value,
      pageSize: pageSize.value,
      status: statusFilter.value === 'all' ? '' : statusFilter.value
    }) as any
    if (res && res.data) {
      orders.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('Failed to load orders:', error)
    alert('加载订单列表失败')
  }
}

function handleStatusChange() {
  page.value = 1
  loadOrders()
}

function handlePageChange(newPage: number) {
  page.value = newPage
  loadOrders()
}

async function handleDeliver(order: Order) {
  if (!confirm('确认发货？')) return

  try {
    await deliverOrder(order.id)
    alert('发货成功')
    loadOrders()
  } catch (error: any) {
    console.error('Failed to deliver order:', error)
    const errorMessage = error.response?.data?.message || error.message || '发货失败'
    alert(errorMessage)
  }
}

async function handleCancel(order: Order) {
  if (!confirm('确认取消订单？')) return

  try {
    await cancelOrder(order.id)
    alert('订单已取消')
    loadOrders()
  } catch (error: any) {
    console.error('Failed to cancel order:', error)
    const errorMessage = error.response?.data?.message || error.message || '取消订单失败'
    alert(errorMessage)
  }
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '已下单',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

function getStatusClass(status: string) {
  const map: Record<string, string> = {
    pending: 'status-pending',
    completed: 'status-completed',
    cancelled: 'status-cancelled'
  }
  return map[status] || ''
}

function getTotalPages() {
  return Math.ceil(total.value / pageSize.value)
}

onMounted(() => {
  loadOrders()
})
</script>

<template>
  <div class="orders">
    <div class="page-header">
      <h2 class="page-title">订单管理</h2>
    </div>

    <div class="toolbar card">
      <div class="filter-box">
        <label class="filter-label">订单状态：</label>
        <select v-model="statusFilter" class="form-input" @change="handleStatusChange">
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="table-container card">
      <table class="table">
        <thead>
          <tr>
            <th>订单编号</th>
            <th>收货人</th>
            <th>订单金额</th>
            <th>订单状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.orderNo || '-' }}</td>
            <td>{{ order.receiver || '-' }}</td>
            <td>¥{{ order.amount?.toFixed(2) || '0.00' }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(order.status)">
                {{ getStatusText(order.status) }}
              </span>
            </td>
            <td>{{ formatDate(order.createdAt, 'YYYY-MM-DD HH:mm') }}</td>
            <td>
              <button
                v-if="order.status === 'pending'"
                class="btn-text"
                @click="handleDeliver(order)"
              >
                发货
              </button>
              <button
                v-if="order.status === 'pending'"
                class="btn-text btn-danger"
                @click="handleCancel(order)"
              >
                取消
              </button>
              <span v-if="order.status !== 'pending'" class="text-muted">-</span>
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
.orders {
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
  margin-right: var(--spacing-sm);
}

.btn-text.btn-danger {
  color: var(--color-error);
}

.text-muted {
  color: var(--color-text-secondary);
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background-color: #fff3e0;
  color: #ff9800;
}

.status-completed {
  background-color: #e8f5e9;
  color: #4caf50;
}

.status-cancelled {
  background-color: #ffebee;
  color: #f44336;
}
</style>
