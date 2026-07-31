import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'

const GRADES = [
  { label: 'O  — 10',  points: 10 },
  { label: 'A+ — 9',   points: 9  },
  { label: 'A  — 8',   points: 8  },
  { label: 'B+ — 7',   points: 7  },
  { label: 'B  — 6',   points: 6  },
  { label: 'C  — 5',   points: 5  },
  { label: 'P  — 4',   points: 4  },
  { label: 'F  — 0',   points: 0  },
]

function computeSgpa(subjects: { credits: number; gradePoints: number }[]): number {
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0)
  if (totalCredits === 0) return 0
  const totalPoints = subjects.reduce((sum, s) => sum + s.gradePoints * s.credits, 0)
  return Math.round((totalPoints / totalCredits) * 100) / 100
}

export default function CGPAPlannerPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  const [overrides, setOverrides] = useState<Record<string, number>>({})

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading planner…</p>
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

  const hypotheticalSubjects = data.subjects.map((s) => ({
    credits: s.credits,
    gradePoints: overrides[s.code] ?? s.gradePoints,
  }))

  const projectedSgpa = computeSgpa(hypotheticalSubjects)
  const delta = projectedSgpa - data.sgpa
  const hasChanges = Object.keys(overrides).length > 0

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">CGPA Planner</h1>
      <p className="text-slate-500 text-sm mb-8">
        Adjust grades below to see how your SGPA would change this semester
      </p>

      {/* SGPA comparison */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Current SGPA</p>
          <p className="text-3xl font-bold text-white">{data.sgpa.toFixed(2)}</p>
        </div>
        <div
          className={`rounded-2xl border p-6 ${
            delta > 0
              ? 'border-green-500/30 bg-green-500/10'
              : delta < 0
              ? 'border-red-500/30 bg-red-500/10'
              : 'border-white/10 bg-white/[0.03]'
          }`}
        >
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Projected SGPA</p>
          <p
            className={`text-3xl font-bold ${
              delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-white'
            }`}
          >
            {projectedSgpa.toFixed(2)}
          </p>
          {hasChanges && delta !== 0 && (
            <p className={`text-xs mt-1 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {delta > 0 ? '+' : ''}{delta.toFixed(2)} from current
            </p>
          )}
        </div>
      </div>

      {/* Subject grade selectors */}
      <div className="space-y-3">
        {data.subjects.map((s) => {
          const selectedPoints = overrides[s.code] ?? s.gradePoints
          const changed = overrides[s.code] !== undefined && overrides[s.code] !== s.gradePoints
          return (
            <div
              key={s.code}
              className={`rounded-2xl border p-4 flex items-center justify-between gap-4 ${
                changed ? 'border-violet-500/30 bg-violet-500/[0.05]' : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">{s.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {s.code} · {s.credits} cr. · current: {s.grade} ({s.gradePoints})
                </p>
              </div>
              <select
                value={selectedPoints}
                onChange={(e) =>
                  setOverrides((prev) => ({ ...prev, [s.code]: Number(e.target.value) }))
                }
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 shrink-0"
              >
                {GRADES.map((g) => (
                  <option key={g.label} value={g.points} className="bg-[#0a0a1a]">
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {hasChanges && (
        <button
          onClick={() => setOverrides({})}
          className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors underline"
        >
          Reset to current grades
        </button>
      )}
    </div>
  )
}
