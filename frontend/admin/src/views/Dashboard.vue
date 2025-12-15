<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js'
import { getOverview } from '../api/dashboard'
import type { StatOverview } from '../types'


Chart.register(PieController, ArcElement, Tooltip, Legend)

const dateType = ref<'day' | 'week' | 'month'>('day')
const stats = ref<StatOverview>({
  todayOrders: 0,
  totalOrders: 0,
  totalRevenue: 0,
  totalCustomers: 0,
  orderStatusDistribution: {
    pending: 0,
    completed: 0,
    cancelled: 0
  }
})

let chartInstance: Chart | null = null

async function loadData() {
  try {
    const res = await getOverview(dateType.value) as any
    if (res && res.data) {
      const data = res.data
      
      // 确保数据正确映射
      stats.value = {
        todayOrders: Number(data.todayOrders) || 0,
        totalOrders: Number(data.totalOrders) || 0,
        totalRevenue: Number(data.totalRevenue) || 0,
        totalCustomers: Number(data.totalCustomers) || 0,
        orderStatusDistribution: {
          pending: Number(data.orderStatusDistribution?.pending ?? data.orderStatusDistribution?.['pending']) || 0,
          completed: Number(data.orderStatusDistribution?.completed ?? data.orderStatusDistribution?.['completed']) || 0,
          cancelled: Number(data.orderStatusDistribution?.cancelled ?? data.orderStatusDistribution?.['cancelled']) || 0
        }
      }
      
      // 等待 DOM 更新后再渲染图表
      await nextTick()
      renderChart()
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

function renderChart() {
  const canvas = document.getElementById('orderStatusChart') as HTMLCanvasElement
  if (!canvas) {
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  const distribution = stats.value.orderStatusDistribution

  // 销毁旧图表实例
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  // 创建新图表
  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['未支付', '已完成', '已取消'],
      datasets: [
        {
          data: [
            distribution.pending || 0,
            distribution.completed || 0,
            distribution.cancelled || 0
          ],
          backgroundColor: ['#ff9800', '#4caf50', '#f44336']
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = context.parsed || 0
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
              return `${label}: ${value} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

onMounted(() => {
  loadData()
})

watch(dateType, () => {
  loadData()
})
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h2 class="page-title">仪表盘</h2>
      <div class="date-filter">
        <button
          class="filter-btn"
          :class="{ active: dateType === 'day' }"
          @click="dateType = 'day'"
        >
          天
        </button>
        <button
          class="filter-btn"
          :class="{ active: dateType === 'week' }"
          @click="dateType = 'week'"
        >
          周
        </button>
        <button
          class="filter-btn"
          :class="{ active: dateType === 'month' }"
          @click="dateType = 'month'"
        >
          月
        </button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-info">
          <div class="stat-label">今日订单</div>
          <div class="stat-value">{{ stats.todayOrders }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-info">
          <div class="stat-label">订单总数</div>
          <div class="stat-value">{{ stats.totalOrders }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <div class="stat-label">总收入</div>
          <div class="stat-value">¥{{ stats.totalRevenue.toLocaleString() }}</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-label">客户总数</div>
          <div class="stat-value">{{ stats.totalCustomers }}</div>
        </div>
      </div>
    </div>

    <div class="chart-section card">
      <h3 class="chart-title">订单状态分布</h3>
      <div class="chart-container">
        <canvas id="orderStatusChart"></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
}

.date-filter {
  display: flex;
  gap: var(--spacing-sm);
}

.filter-btn {
  padding: 6px 16px;
  background-color: var(--color-white);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
}

.filter-btn.active {
  background-color: var(--color-primary);
  color: var(--color-white);
  border-color: var(--color-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background-color: var(--color-white);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  box-shadow: var(--box-shadow);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: transform var(--transition-speed);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 36px;
  background-color: var(--color-primary-light);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text);
}

.chart-section {
  max-width: 600px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
}

.chart-container {
  height: 300px;
}
</style>
