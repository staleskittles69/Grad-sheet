import client from './client'
import type { ApiResponse } from '../types/auth'
import type { ProfileData } from '../types/profile'

export const getProfile = () =>
  client.get<ApiResponse<ProfileData>>('/student/profile').then((r) => r.data.data!)
