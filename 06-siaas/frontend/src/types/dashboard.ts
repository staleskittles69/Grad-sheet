export interface SubjectStats {
  code: string
  name: string
  credits: number
  total: number
  grade: string
  gradePoints: number
  attendancePercent: number
  weak: boolean
}

export interface DashboardData {
  cgpa: number
  sgpa: number
  attendancePercent: number
  avgScore: number
  weakSubjectsCount: number
  activeSemesterName: string
  subjects: SubjectStats[]
}
