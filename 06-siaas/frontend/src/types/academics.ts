export interface SubjectResult {
  code: string
  name: string
  credits: number
  internal: number
  external: number
  lab: number
  assignment: number
  total: number
  grade: string
  gradePoints: number
}

export interface SemesterRecord {
  semesterName: string
  sgpa: number
  subjects: SubjectResult[]
}

export interface AcademicsData {
  semesters: SemesterRecord[]
}
