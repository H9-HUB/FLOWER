import request from './request'
import type { ApiResponse, LoginRequest, LoginResponse } from '../types'

export function login(data: LoginRequest) {
  return request.post<ApiResponse<LoginResponse>>('/admin/login', data)
}

export function logout() {
  return request.post<ApiResponse>('/admin/logout')
}
