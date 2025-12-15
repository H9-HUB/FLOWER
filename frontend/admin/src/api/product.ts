import request from './request'
import type { ApiResponse, Product, PageParams, PageResult } from '../types'

export function getProductList(params: PageParams) {
  return request.get<ApiResponse<PageResult<Product>>>('/admin/product', { params })
}

export function addProduct(data: Partial<Product>) {
  return request.post<ApiResponse>('/admin/product', data)
}

export function updateProduct(id: number, data: Partial<Product>) {
  return request.put<ApiResponse>(`/admin/product/${id}`, data)
}

export function deleteProduct(id: number) {
  return request.delete<ApiResponse>(`/admin/product/${id}`)
}

export function updateProductStatus(id: number, status: 'on' | 'off') {
  return request.put<ApiResponse>(`/admin/product/${id}/status`, { status })
}

export function batchUpdateStatus(categoryId: number, status: 'on' | 'off') {
  return request.put<ApiResponse>('/admin/product/batch/status', { categoryId, status })
}

export function uploadProductImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<ApiResponse<{ url: string }>>('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
