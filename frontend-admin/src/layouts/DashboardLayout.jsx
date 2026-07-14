import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bot,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Users as UsersIcon,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Estadísticas', end: true, icon: LayoutDashboard },
  { to: '/productos', label: 'Productos', end: false, icon: Package },
  { to: '/clientes', label: 'Clientes', end: false, icon: UsersIcon },
  { to: '/ventas', label: 'Historial de ventas', end: false, icon: Receipt },
  { to: '/asistente-ia', label: 'Asistente IA', end: false, icon: Bot },
]

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-leather-dark">
          <Crown size={20} />
        </div>
        <div>
          <p className="font-serif text-base font-bold leading-tight text-white">Sombrerería</p>
          <p className="text-xs text-white/50">Panel de administración</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, end, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-gold text-leather-dark shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-gold'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default function DashboardLayout() {
  const { user, apiUrl, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-full bg-cream">
      {/* Sidebar de escritorio */}
      <aside className="hidden w-64 shrink-0 flex-col bg-denim md:flex">
        <SidebarContent />
      </aside>

      {/* Sidebar móvil (overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="flex w-64 flex-col bg-denim shadow-xl">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
          <button
            className="flex-1 bg-leather-dark/50"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-leather/10 bg-white px-4 py-3 md:px-6">
          <button
            className="btn-ghost rounded-md p-1.5 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-leather-dark/50 sm:inline" title={apiUrl}>
              API: {apiUrl}
            </span>
            <span className="text-sm text-leather-dark">
              <strong>{user?.user}</strong>
              <span className="badge ml-2 bg-gold/20 text-leather-dark">{user?.rol}</span>
            </span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              <LogOut size={14} /> Salir
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
