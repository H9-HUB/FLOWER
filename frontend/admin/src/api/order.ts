import request from './request'
import type { ApiResponse, Order, PageParams, PageResult } from '../types'

export function getOrderList(params: PageParams) {
  return request.get<ApiResponse<PageResult<Order>>>('/admin/order', { params })
}

export function deliverOrder(id: number) {
  return request.put<ApiResponse>(`/admin/order/${id}/deliver`)
}

export function cancelOrder(id: number) {
  return request.put<ApiResponse>(`/admin/order/${id}/cancel`)
}
