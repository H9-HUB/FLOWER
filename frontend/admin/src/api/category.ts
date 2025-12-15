import request from './request'
import type { ApiResponse, Category } from '../types'

export function getCategoryList() {
  return request.get<ApiResponse<Category[]>>('/admin/category')
}

export function addCategory(data: Partial<Category>) {
  return request.post<ApiResponse>('/admin/category', data)
}

export function updateCategory(id: number, data: Partial<Category>) {
  return request.put<ApiResponse>(`/admin/category/${id}`, data)
}

export function deleteCategory(id: number) {
  return request.delete<ApiResponse>(`/admin/category/${id}`)
}
