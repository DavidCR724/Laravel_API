import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', end: true, icon: '📊' },
  { to: '/articulos', label: 'Artículos', end: false, icon: '🎩' },
  { to: '/usuarios', label: 'Usuarios', end: false, icon: '👤' },
]

export default function Layout() {
  const { user, apiUrl, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-full">
      {/* -------------------------------- Sidebar -------------------------------- */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 text-slate-200 md:flex">
        <div className="flex items-center gap-2 border-b border-slate-800 px-6 py-5">
          <span className="text-2xl">🎩</span>
          <div>
            <p className="text-sm font-semibold text-white">Sombrerería</p>
            <p className="text-xs text-slate-400">Panel de administración</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          <p className="truncate" title={apiUrl}>
            API: <span className="text-slate-300">{apiUrl}</span>
          </p>
        </div>
      </aside>

      {/* --------------------------------- Main ---------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          {/* Nav compacta para móvil */}
          <nav className="flex gap-1 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-2 py-1 text-sm ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-600'
                  }`
                }
              >
                {item.icon}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-600">
              <strong className="text-slate-800">{user?.user}</strong>
              <span className="badge ml-2 bg-indigo-100 text-indigo-700">{user?.rol}</span>
            </span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
