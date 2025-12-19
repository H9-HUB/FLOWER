<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { Chart, ArcElement, Tooltip, Legend, PieController, CategoryScale, LinearScale, PointElement, LineElement, LineController, Filler } from 'chart.js'
import { getOverview } from '../api/dashboard'
import type { StatOverview } from '../types'


Chart.register(PieController, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, LineController, Filler)

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
let revenueChartInstance: Chart | null = null
let revenueLabels: string[] = []
let revenueValues: number[] = []

function parseMoney(v: any): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    // 移除非数字、非小数点、非负号的字符（例如货币符号和千分位逗号）
    const cleaned = v.replace(/[^0-9.\-]/g, '')
    const n = Number(cleaned)
    return isNaN(n) ? 0 : n
  }
  return 0
}

// 定时器：在本地时间过午夜时刷新日视图数据
let midnightTimer: number | null = null

function clearMidnightTimer() {
  if (midnightTimer !== null) {
    clearTimeout(midnightTimer)
    midnightTimer = null
  }
}

function scheduleMidnightRefresh() {
  clearMidnightTimer()
  if (dateType.value !== 'day') return
  const now = new Date()
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const ms = nextMidnight.getTime() - now.getTime()
  midnightTimer = window.setTimeout(() => {
    loadData()
    // 递归调度，保证每个午夜都会触发
    scheduleMidnightRefresh()
  }, ms)
}

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
      // 调试输出后端返回的数据，方便排查无数据原因
      // eslint-disable-next-line no-console
      console.debug('[Dashboard] overview data:', data)

      // 为确保显示最近7天的数据，额外请求 week 数据并优先使用其中的序列
      let weeklySeries: any = null
      try {
        const weekRes = await getOverview('week') as any
        if (weekRes && weekRes.data) {
          // eslint-disable-next-line no-console
          console.debug('[Dashboard] week overview data detected')
          weeklySeries = weekRes.data.revenueLast7Days ?? weekRes.data.recentRevenue ?? weekRes.data.dailyRevenue ?? weekRes.data.sales ?? null
        }
      } catch (e) {
        // ignore
      }

      // 解析并更新最近7天收入数据（兼容后端可能的字段名，并自动探测数组字段）
      let series = weeklySeries ?? data.revenueLast7Days ?? data.recentRevenue ?? data.dailyRevenue ?? data.sales ?? null
      if (!series) {
        // 在 data 中查找第一个看起来像收入序列的数组
        for (const key of Object.keys(data)) {
          const v = data[key]
          if (Array.isArray(v) && v.length > 0) {
            const first = v[0]
            if (first && (first.date || first.amount || first.total || (Array.isArray(first) && first.length >= 2))) {
              series = v
              // eslint-disable-next-line no-console
              console.debug(`[Dashboard] detected revenue series at data.${key}`)
              break
            }
          }
        }
      }
      if (Array.isArray(series) && series.length > 0) {
        // 调试打印前几项，便于确认结构（开发时查看控制台后可移除）
        // eslint-disable-next-line no-console
        console.debug('[Dashboard] revenue sample:', series.slice(0, 3))
        // 期望格式: [{ date: '2025-12-01', amount: 123.45 }, ...] 或 [[date, amount], ...]
        // 只取最近7天（数组可能按时间升序或降序）
        const s = series.slice(-7)
        revenueLabels = s.map((item: any) => {
          if (item == null) return ''
          return item.date ?? item.day ?? (Array.isArray(item) ? String(item[0]) : String(item[0] ?? ''))
        })
        revenueValues = s.map((item: any) => {
          if (item == null) return 0
          // 优先尝试常见字段名
          if (typeof item.amount === 'number' || typeof item.amount === 'string') return parseMoney(item.amount)
          if (typeof item.total === 'number' || typeof item.total === 'string') return parseMoney(item.total)
          if (typeof item.value === 'number' || typeof item.value === 'string') return parseMoney(item.value)
          // 有些后端会把金额放在 second field 或 third
          if (Array.isArray(item)) {
            // 找第一个为数字的元素作为金额
            for (let i = 1; i < item.length; i++) {
              const v = item[i]
              if (typeof v === 'number') return v
              if (typeof v === 'string') {
                const parsed = parseMoney(v)
                if (parsed !== 0) return parsed
              }
            }
            // 退回到索引1或0
            return parseMoney(item[1] ?? item[0] ?? 0)
          }
          // 退回：查找任意数值属性
          for (const k of Object.keys(item)) {
            const v = item[k]
            if (typeof v === 'number') return v
            if (typeof v === 'string') {
              const parsed = parseMoney(v)
              if (parsed !== 0) return parsed
            }
          }
          return 0
        })
      } else {
        // 回退：生成最近7天的标签并填充 0
        revenueLabels = []
        revenueValues = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          revenueLabels.push(d.toISOString().slice(0, 10))
          revenueValues.push(0)
        }
      }
      renderRevenueChart()
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

function renderRevenueChart() {
  const canvas = document.getElementById('revenueChart') as HTMLCanvasElement
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const data = {
    labels: revenueLabels,
    datasets: [
      {
        label: '每日收入',
        data: revenueValues,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  // 如果已有实例，更新数据并刷新
  if (revenueChartInstance) {
    try {
      revenueChartInstance.data = data as any
      revenueChartInstance.update()
      return
    } catch (e) {
      revenueChartInstance.destroy()
      revenueChartInstance = null
    }
  }

  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { maxRotation: 0, autoSkip: true }
        },
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            title: (items: any) => items && items.length ? String(items[0].label) : '',
            label: (context: any) => {
              const v = (context.parsed.y) ?? (context.parsed || 0)
              return `收入: ¥${Number(v).toLocaleString()}`
            }
          }
        }
      }
    }
  })
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
  const dataValues = [
    distribution.pending || 0,
    distribution.completed || 0,
    distribution.cancelled || 0
  ]
  const total = dataValues.reduce((a, b) => a + Number(b || 0), 0)

  // 如果已有实例则尝试更新数据并刷新
  if (chartInstance) {
    try {
      chartInstance.data.labels = ['未支付', '已完成', '已取消']
      if (chartInstance.data.datasets && chartInstance.data.datasets[0]) {
        chartInstance.data.datasets[0].data = dataValues
        if (chartInstance.options && chartInstance.options.plugins) {
          // @ts-ignore
          if (chartInstance.options.plugins.legend) chartInstance.options.plugins.legend.display = total > 0
          // @ts-ignore
          if (chartInstance.options.plugins.tooltip) chartInstance.options.plugins.tooltip.enabled = total > 0
        }
        chartInstance.update()
        return
      }
    } catch (e) {
      chartInstance.destroy()
      chartInstance = null
    }
  }

  // 创建新图表（首次或在更新失败后）
  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['未支付', '已完成', '已取消'],
      datasets: [
        {
          data: dataValues,
          backgroundColor: ['#ff9800', '#4caf50', '#f44336']
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          display: total > 0
        },
        tooltip: {
          enabled: total > 0,
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = context.parsed || 0
              const total = (context.dataset.data || []).reduce((a: number, b: number) => a + Number(b || 0), 0)
              const percentage = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0'
              return `${label}: ${value} (${percentage}%)`
            }
          }
        }
      }
    },
    plugins: [
      {
        id: 'noDataPlugin',
        beforeDraw: (chart) => {
          const d = chart.data.datasets && chart.data.datasets[0] ? chart.data.datasets[0].data : []
          const sum = (d || []).reduce((a: number, b: any) => a + Number(b || 0), 0)
          if (sum === 0) {
            const ctx2 = chart.ctx
            const width = chart.width
            const height = chart.height
            ctx2.save()
            ctx2.textAlign = 'center'
            ctx2.textBaseline = 'middle'
            ctx2.fillStyle = '#999'
            ctx2.font = '16px sans-serif'
            ctx2.fillText('暂无数据', width / 2, height / 2)
            ctx2.restore()
          }
        }
      }
    ]
  })
}

onMounted(() => {
  loadData()
  scheduleMidnightRefresh()
})

watch(dateType, () => {
  loadData()
  scheduleMidnightRefresh()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  if (revenueChartInstance) {
    revenueChartInstance.destroy()
    revenueChartInstance = null
  }
  clearMidnightTimer()
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

    <div class="charts-row">
      <div class="chart-section card">
        <h3 class="chart-title">订单状态分布</h3>
        <div class="chart-container">
          <canvas id="orderStatusChart"></canvas>
        </div>
      </div>

      <div class="revenue-section card">
        <h3 class="chart-title">最近7天收入</h3>
        <div class="chart-container">
          <canvas id="revenueChart"></canvas>
        </div>
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

.charts-row {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
  flex-wrap: wrap;
}

.revenue-section {
  flex: 1 1 420px;
  min-width: 320px;
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
