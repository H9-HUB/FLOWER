import request from './request'
import type { ApiResponse, StatOverview } from '../types'

export function getOverview(dateType: 'day' | 'week' | 'month') {
  return request.get<ApiResponse<StatOverview>>('/admin/stat/overview', {
    params: { dateType }
  })
}
