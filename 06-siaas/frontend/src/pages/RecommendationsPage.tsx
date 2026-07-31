import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import type { DashboardData } from '../types/dashboard'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'
import type { ReactNode } from 'react'

type RecType = 'warning' | 'info' | 'success'

interface Recommendation {
  type: RecType
  title: string
  body: string
}

const ICONS: Record<RecType, ReactNode> = {
  warning: <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />,
  info:    <Info          size={18} className="text-blue-400 shrink-0 mt-0.5" />,
  success: <CheckCircle  size={18} className="text-green-400 shrink-0 mt-0.5" />,
}

const CARD_STYLES: Record<RecType, string> = {
  warning: 'border-red-500/30 bg-red-500/[0.07]',
  info:    'border-blue-500/30 bg-blue-500/[0.07]',
  success: 'border-green-500/30 bg-green-500/[0.07]',
}

function buildRecommendations(data: DashboardData): Recommendation[] {
  const recs: Recommendation[] = []

  for (const s of data.subjects) {
    if (s.attendancePercent < 75) {
      recs.push({
        type: 'warning',
        title: `Critical attendance: ${s.name}`,
        body: `Your attendance is ${s.attendancePercent.toFixed(1)}%. Falling below 75% risks debarment from exams.`,
      })
    }
    if (s.total < 60) {
      recs.push({
        type: 'info',
        title: `Low score: ${s.name}`,
        body: `Current total is ${s.total.toFixed(1)}. Focus on internal assessments to improve your grade.`,
      })
    }
  }

  if (data.cgpa >= 8.5) {
    recs.push({
      type: 'success',
      title: 'Excellent academic standing',
      body: `CGPA of ${data.cgpa.toFixed(2)} is outstanding. Maintain this consistency for strong final results.`,
    })
  }

  if (recs.length === 0) {
    recs.push({
      type: 'success',
      title: 'All clear!',
      body: 'No immediate concerns detected. Keep up the consistent performance.',
    })
  }

  return recs
}

export default function RecommendationsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading recommendations…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">Failed to load data.</p>
      </div>
    )
  }

  const recs = buildRecommendations(data)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Recommendations</h1>
      <p className="text-slate-500 text-sm mb-8">
        Personalised insights based on your current performance
      </p>

      <div className="space-y-4">
        {recs.map((r, i) => (
          <div key={i} className={`rounded-2xl border p-5 flex gap-4 ${CARD_STYLES[r.type]}`}>
            {ICONS[r.type]}
            <div>
              <p className="text-sm font-semibold text-white">{r.title}</p>
              <p className="text-sm text-slate-400 mt-1">{r.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
