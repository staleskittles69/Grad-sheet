import client from './client'
import type { ApiResponse } from '../types/auth'
import type { AcademicsData } from '../types/academics'

export const getAcademics = () =>
  client.get<ApiResponse<AcademicsData>>('/student/academics').then((r) => r.data.data!)
