import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Lock, ServerCog, User as UserIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { apiUrl, setApiUrl, login } = useAuth()
  const navigate = useNavigate()

  const [urlDraft, setUrlDraft] = useState(apiUrl)
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      setApiUrl(urlDraft)
      await login(user, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-denim px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-leather-dark shadow-lg">
            <Crown size={28} />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white">Sombrerería</h1>
          <p className="text-sm text-white/60">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="card border-t-4 border-t-gold">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="label">Usuario</label>
            <div className="relative">
              <UserIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leather-dark/40" />
              <input
                className="input pl-9"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Contraseña</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leather-dark/40" />
              <input
                type="password"
                className="input pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <details className="mb-4 rounded-lg border border-leather/15 bg-cream/60 px-3 py-2">
            <summary className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-leather-dark/70">
              <ServerCog size={14} /> Dirección de la API
            </summary>
            <input
              className="input mt-2"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="http://192.168.1.110:8000"
            />
            <p className="mt-1 text-[11px] text-leather-dark/50">
              Ej.: http://192.168.1.110:8000 si el backend corre en otra máquina/VM.
            </p>
          </details>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
