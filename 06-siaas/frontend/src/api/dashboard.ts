import client from './client'
import type { ApiResponse } from '../types/auth'
import type { DashboardData } from '../types/dashboard'

export const getDashboard = () =>
  client
    .get<ApiResponse<DashboardData>>('/student/dashboard')
    .then((r) => r.data.data!)
