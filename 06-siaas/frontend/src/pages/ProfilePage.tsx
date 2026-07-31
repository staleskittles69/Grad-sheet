import { useQuery } from '@tanstack/react-query'
import { getProfile } from '../api/profile'

export default function ProfilePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Loading profile…</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">Failed to load profile.</p>
      </div>
    )
  }

  const initials = data.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-8">Profile</h1>

      {/* Avatar + name */}
      <div className="flex items-center gap-6 mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-violet-300">{initials}</span>
        </div>
        <div>
          <p className="text-xl font-semibold text-white">{data.fullName}</p>
          <p className="text-slate-400 text-sm mt-0.5">{data.email}</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Roll Number', value: data.rollNumber },
          { label: 'Semester',    value: `Semester ${data.semester}` },
          { label: 'Section',     value: `Section ${data.section}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-white font-medium">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
