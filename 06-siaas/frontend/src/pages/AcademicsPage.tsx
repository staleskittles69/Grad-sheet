import { useQuery } from '@tanstack/react-query'
import { getAcademics } from '../api/academics'
import type { SubjectResult } from '../types/academics'

function SubjectRow({ s }: { s: SubjectResult }) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-6">
        <span className="text-xs font-mono text-slate-500">{s.code}</span>
        <p className="text-sm text-slate-200 mt-0.5">{s.name}</p>
      </td>
      <td className="py-3 px-4 text-center text-sm text-slate-400">{s.credits}</td>
      <td className="py-3 px-4 text-center text-sm text-slate-300">{s.internal}</td>
      <td className="py-3 px-4 text-center text-sm text-slate-300">{s.external}</td>
      <td className="py-3 px-4 text-center text-sm text-slate-300">{s.lab}</td>
      <td className="py-3 px-4 text-center text-sm text-slate-300">{s.assignment}</td>
      <td className="py-3 px-4 text-center text-sm font-semibold text-white">{s.total}</td>
      <td className="py-3 px-4 text-center text-sm font-medium text-slate-300">{s.grade}</td>
      <td className="py-3 px-6 text-center text-sm font-bold text-violet-300">{s.gradePoints.toFixed(1)}</td>
    </tr>
  )
}

export default function AcademicsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['academics'],
    queryFn: getAcademics,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading academics…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">Failed to load academics data.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Academics</h1>

      <div className="space-y-8">
        {data.semesters.map((sem) => (
          <div
            key={sem.semesterName}
            className="rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Semester header */}
            <div className="px-6 py-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200">{sem.semesterName}</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                SGPA: {sem.sgpa.toFixed(2)}
              </span>
            </div>

            {/* Marks table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left py-3 px-6 text-xs text-slate-500 font-medium uppercase tracking-wider">Subject</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Cr.</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Int.</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Ext.</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Lab</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Assgn.</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Total</th>
                    <th className="py-3 px-4 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">Grade</th>
                    <th className="py-3 px-6 text-center text-xs text-slate-500 font-medium uppercase tracking-wider">GP</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.subjects.map((s) => (
                    <SubjectRow key={s.code} s={s} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
