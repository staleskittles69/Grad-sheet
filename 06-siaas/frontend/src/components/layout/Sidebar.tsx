import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  Calculator,
  Lightbulb,
  FileText,
  Bell,
  User,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const NAV_ITEMS = [
  { to: '/dashboard',       label: 'Dashboard',      Icon: LayoutDashboard },
  { to: '/academics',       label: 'Academics',       Icon: BookOpen },
  { to: '/attendance',      label: 'Attendance',      Icon: CalendarCheck },
  { to: '/analytics',       label: 'Analytics',       Icon: TrendingUp },
  { to: '/planner',         label: 'CGPA Planner',    Icon: Calculator },
  { to: '/recommendations', label: 'Recommendations', Icon: Lightbulb },
  { to: '/reports',         label: 'Reports',         Icon: FileText },
  { to: '/notifications',   label: 'Notifications',   Icon: Bell },
  { to: '/profile',         label: 'Profile',         Icon: User },
]

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-white/[0.03] border-r border-white/10">
      {/* Brand */}
      <div className="px-6 py-7">
        <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent tracking-wide">
          SIAAS
        </span>
        <p className="text-slate-500 text-xs mt-0.5">Academic Intelligence</p>
      </div>

      {/* Nav */}
      <nav aria-label="Main navigation" className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-violet-500/20 text-violet-300 font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`
            }
          >
            <Icon size={17} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 mb-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all"
        >
          <LogOut size={17} strokeWidth={1.75} />
          Logout
        </button>
      </div>
    </aside>
  )
}
