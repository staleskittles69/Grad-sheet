export type Role = 'STUDENT' | 'FACULTY' | 'ADMIN'

export interface User {
  id: string
  email: string
  role: Role
}

export interface ApiResponse<T> {
  success: boolean
  message: string | null
  data: T | null
  error: string | null
  timestamp: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  fullName: string
  rollNumber: string
  phone?: string
}
