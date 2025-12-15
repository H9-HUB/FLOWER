import request from './request'
import type { ApiResponse, User, PageParams, PageResult } from '../types'

export function getUserList(params: PageParams) {
  return request.get<ApiResponse<PageResult<User>>>('/admin/user', { params })
}

export function resetPassword(id: number) {
  return request.put<ApiResponse>(`/admin/user/${id}/pwd`, { password: '123456' })
}
