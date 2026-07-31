import client from './client'
import type { ApiResponse, LoginPayload, RegisterPayload, User } from '../types/auth'

export const login = (payload: LoginPayload) =>
  client.post<ApiResponse<User>>('/auth/login', payload).then((r) => r.data.data!)

export const register = (payload: RegisterPayload) =>
  client.post<ApiResponse<User>>('/auth/register', payload).then((r) => r.data.data!)

export const logout = () =>
  client.post('/auth/logout')

export const getMe = () =>
  client.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data!)
