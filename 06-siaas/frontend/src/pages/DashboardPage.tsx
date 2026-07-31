import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'
import type { SubjectStats } from '../types/dashboard'

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        accent
          ? 'border-violet-500/30 bg-violet-500/10'
          : 'border-white/10 bg-white/5'
      }`}
    >
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function SubjectRow({ s }: { s: SubjectStats }) {
  const attColor =
    s.attendancePercent < 75
      ? 'text-red-400'
      : s.attendancePercent < 85
      ? 'text-yellow-400'
      : 'text-green-400'

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-6 pr-4">
        <span className="text-xs font-mono text-slate-500">{s.code}</span>
        <p className="text-sm text-slate-200 mt-0.5">{s.name}</p>
      </td>
      <td className="py-3 px-4 text-center text-sm text-white">{s.total.toFixed(1)}</td>
      <td className="py-3 px-4 text-center text-sm font-medium text-slate-300">{s.grade}</td>
      <td className="py-3 px-4 text-center text-sm font-bold text-violet-300">{s.gradePoints.toFixed(1)}</td>
      <td className={`py-3 px-4 text-center text-sm font-medium ${attColor}`}>
        {s.attendancePercent.toFixed(1)}%
      </td>
      <td className="py-3 pl-4 pr-6">
        {s.weak && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            Weak
          </span>
        )}
      </td>
    </tr>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading dashboard…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">Failed to load dashboard data.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{data.activeSemesterName}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <StatCard label="CGPA" value={data.cgpa.toFixed(2)} sub="Cumulative" accent />
        <StatCard label="SGPA" value={data.sgpa.toFixed(2)} sub="This semester" />
        <StatCard label="Attendance" value={`${data.attendancePercent.toFixed(1)}%`} sub="Overall" />
        <StatCard label="Avg Score" value={`${data.avgScore.toFixed(1)}%`} sub="Current semester" />
        <StatCard
          label="Weak Subjects"
          value={data.weakSubjectsCount}
          sub="Need attention"
          accent={data.weakSubjectsCount > 0}
        />
      </div>

      {/* Subject table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-slate-300">Subject Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-6 text-xs text-slate-500 font-medium uppercase tracking-wider">Subject</th>
                <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Total</th>
                <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Grade</th>
                <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">GP</th>
                <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Attendance</th>
                <th className="py-3 pr-6 text-xs text-slate-500 font-medium uppercase tracking-wider" aria-label="Status" />
              </tr>
            </thead>
            <tbody>
              {data.subjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                    No subjects this semester.
                  </td>
                </tr>
              ) : (
                data.subjects.map((s) => <SubjectRow key={s.code} s={s} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
