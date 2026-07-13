import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Alert, Spinner } from '../components/ui'

export default function Login() {
  const { apiUrl, setApiUrl, login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state && location.state.from) || '/'

  const [urlDraft, setUrlDraft] = useState(apiUrl)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Si ya hay sesión, no tiene sentido mostrar el login.
  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      setApiUrl(urlDraft)
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-4xl">🎩</div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-800">Sombrerería · Admin</h1>
          <p className="text-sm text-slate-500">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <Alert type="error">{error}</Alert>}

          <div>
            <label className="label" htmlFor="apiUrl">
              Dirección de la API
            </label>
            <input
              id="apiUrl"
              className="input"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="http://localhost:8000"
            />
            <p className="mt-1 text-xs text-slate-400">
              URL donde corre Laravel (p. ej. <code>php artisan serve</code>).
            </p>
          </div>

          <div>
            <label className="label" htmlFor="user">
              Usuario
            </label>
            <input
              id="user"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <Spinner label="Entrando…" /> : 'Iniciar sesión'}
          </button>

          <p className="text-center text-xs text-slate-400">
            Credenciales de ejemplo (seeder): <strong>admin</strong> / <strong>admin123</strong>
          </p>
        </form>
      </div>
    </div>
  )
}
