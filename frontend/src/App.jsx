import { useState, useEffect } from 'react'
import { apiRequest } from './api'

export default function App() {
  // La dirección de la API es configurable (el servidor está en otra máquina).
  const [baseUrl, setBaseUrl] = useState(
    () => localStorage.getItem('baseUrl') || 'http://localhost:8000'
  )
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null')
  )

  const [username, setUsername] = useState('cliente')
  const [password, setPassword] = useState('cliente123')

  const [products, setProducts] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem('baseUrl', baseUrl)
  }, [baseUrl])

  function saveSession(data) {
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  function clearSession() {
    setToken('')
    setUser(null)
    setProducts([])
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const data = await apiRequest(baseUrl, '/api/login', {
        method: 'POST',
        body: { user: username, password },
      })
      saveSession(data)
      setMessage('Sesión iniciada. El token dura 5 minutos.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadProducts() {
    setError('')
    setMessage('')
    try {
      const data = await apiRequest(baseUrl, '/api/articles', { token })
      setProducts(data.data || [])
      setMessage(`${(data.data || []).length} producto(s) cargados.`)
    } catch (err) {
      setError(err.message)
    }
  }

  async function checkSession() {
    setError('')
    setMessage('')
    try {
      const data = await apiRequest(baseUrl, '/api/me', { token })
      setMessage(`Sesión válida: ${data.data.user} (${data.data.rol}).`)
    } catch (err) {
      setError(err.message)
      if (err.status === 401) clearSession()
    }
  }

  async function handleLogout() {
    if (token) {
      try {
        await apiRequest(baseUrl, '/api/logout', { method: 'POST', token })
      } catch (e) {
        // aunque falle (p. ej. token expirado), cerramos localmente
      }
    }
    clearSession()
    setMessage('')
  }

  // ------------------------------ Vista de login ------------------------------
  if (!token) {
    return (
      <div className="container">
        <h1>Laravel API · Front</h1>
        <form onSubmit={handleLogin} className="card">
          <label>
            Dirección de la API
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://IP_DEL_SERVIDOR:8000"
            />
          </label>
          <label>
            Usuario
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button disabled={loading}>
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>
        {error && <p className="error">⚠️ {error}</p>}
        <p className="hint">
          Escribe la dirección donde corre la API (el servidor Ubuntu), por
          ejemplo <code>http://192.168.1.50:8000</code>. Cuentas de ejemplo:
          <br />
          <code>admin / admin123</code> · <code>cliente / cliente123</code>
        </p>
      </div>
    )
  }

  // ----------------------------- Vista autenticada ----------------------------
  return (
    <div className="container">
      <div className="topbar">
        <div>
          <strong>{user?.user}</strong> <span className="badge">{user?.rol}</span>
          <div className="muted">API: {baseUrl}</div>
        </div>
        <button className="secondary" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

      <div className="actions">
        <button onClick={loadProducts}>Cargar productos</button>
        <button className="secondary" onClick={checkSession}>
          Comprobar sesión (/me)
        </button>
      </div>

      {message && <p className="ok">{message}</p>}
      {error && <p className="error">⚠️ {error}</p>}

      <h2>Productos</h2>
      {products.length === 0 ? (
        <p className="muted">Aún no hay productos cargados.</p>
      ) : (
        <ul className="list">
          {products.map((p) => (
            <li key={p.id} className="card">
              <div className="row">
                <strong>{p.nombre}</strong>
                <span className="price">${p.costo}</span>
              </div>
              <div className="muted">{p.descripcion}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
