import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api/dashboard'

function AttendanceCard({
  code,
  name,
  attendancePercent,
}: {
  code: string
  name: string
  attendancePercent: number
}) {
  const barColor =
    attendancePercent < 75 ? 'bg-red-500' :
    attendancePercent < 85 ? 'bg-yellow-500' : 'bg-green-500'

  const textColor =
    attendancePercent < 75 ? 'text-red-400' :
    attendancePercent < 85 ? 'text-yellow-400' : 'text-green-400'

  const borderColor =
    attendancePercent < 75 ? 'border-red-500/20' : 'border-white/10'

  return (
    <div className={`rounded-2xl border ${borderColor} bg-white/[0.03] p-5`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-mono text-slate-500">{code}</span>
          <p className="text-sm text-slate-200 mt-0.5">{name}</p>
        </div>
        <span className={`text-2xl font-bold ${textColor}`}>
          {attendancePercent.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${Math.min(attendancePercent, 100)}%` }}
        />
      </div>
      {attendancePercent < 75 && (
        <p className="text-xs text-red-400 mt-2">Below the 75% minimum threshold</p>
      )}
    </div>
  )
}

export default function AttendancePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading attendance…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">Failed to load attendance data.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance</h1>
          <p className="text-slate-500 text-sm mt-1">{data.activeSemesterName}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{data.attendancePercent.toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-1">Overall</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.subjects.map((s) => (
          <AttendanceCard
            key={s.code}
            code={s.code}
            name={s.name}
            attendancePercent={s.attendancePercent}
          />
        ))}
      </div>
    </div>
  )
}
