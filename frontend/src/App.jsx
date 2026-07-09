import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from './api'
import Login from './components/Login'
import Catalog from './components/Catalog'
import ClientPanel from './components/ClientPanel'
import AdminPanel from './components/AdminPanel'

export default function App() {
  // La dirección de la API es configurable (el servidor está en otra máquina).
  const [baseUrl, setBaseUrl] = useState(
    () => localStorage.getItem('baseUrl') || 'http://localhost:8000'
  )
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null')
  )
  const [showLogin, setShowLogin] = useState(false)
  const [notice, setNotice] = useState(null) // { type: 'ok'|'error'|'info', text }

  useEffect(() => {
    localStorage.setItem('baseUrl', baseUrl)
  }, [baseUrl])

  // Muestra un mensaje (éxito/error/info) en el banner superior.
  const notify = useCallback((text, type = 'info') => {
    setNotice({ text, type })
  }, [])

  // Manejo central de errores de autenticación: si un token expiró (401),
  // cerramos la sesión localmente.
  const handleAuthError = useCallback(
    (err) => {
      if (err && err.status === 401 && token) {
        setToken('')
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        notify('Tu sesión expiró o el token no es válido. Inicia sesión otra vez.', 'error')
      }
    },
    [token, notify]
  )

  function onLogin(data) {
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setShowLogin(false)
    notify(
      `Sesión iniciada: ${data.user.user} (${data.user.rol}). El token dura 5 min.`,
      'ok'
    )
  }

  async function logout() {
    if (token) {
      try {
        await apiRequest(baseUrl, '/api/logout', { method: 'POST', token })
      } catch (e) {
        // aunque falle (token ya expirado), cerramos localmente
      }
    }
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    notify('Sesión cerrada.', 'info')
  }

  // Demo de manejo de errores: intenta un endpoint restringido (solo admin).
  async function tryRestricted() {
    try {
      const data = await apiRequest(baseUrl, '/api/users', { token })
      notify(`Acceso permitido: ${(data.data || []).length} usuario(s).`, 'ok')
    } catch (err) {
      handleAuthError(err)
      notify(`Error controlado (${err.status || 'red'}): ${err.message}`, 'error')
    }
  }

  return (
    <div className="container">
      {/* ---------------------------- Barra superior ---------------------------- */}
      <header className="header">
        <label className="apiField">
          <span>Dirección de la API</span>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://IP_DEL_SERVIDOR:8000"
          />
        </label>

        <div className="session">
          {user ? (
            <>
              <span className="who">
                <strong>{user.user}</strong> <span className="badge">{user.rol}</span>
              </span>
              <button className="secondary" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <button onClick={() => setShowLogin((v) => !v)}>Iniciar sesión</button>
          )}
        </div>
      </header>

      {showLogin && !user && (
        <Login
          baseUrl={baseUrl}
          notify={notify}
          onLogin={onLogin}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* ------------------------------- Banner -------------------------------- */}
      {notice && (
        <div
          className={`banner ${notice.type}`}
          onClick={() => setNotice(null)}
          title="Clic para cerrar"
        >
          {notice.text}
        </div>
      )}

      {!user && (
        <p className="hint">
          Estás como <strong>invitado</strong>: puedes ver productos y reseñas.
          Inicia sesión para comprar (cliente) o administrar (admin).
        </p>
      )}

      {/* ----------------------- Público: productos y reseñas ------------------- */}
      <Catalog baseUrl={baseUrl} token={token} notify={notify} />

      {/* ------------------------- Panel de cliente ---------------------------- */}
      {user && user.rol === 'cliente' && (
        <ClientPanel
          baseUrl={baseUrl}
          token={token}
          user={user}
          notify={notify}
          onAuthError={handleAuthError}
        />
      )}

      {/* -------------------------- Panel de admin ----------------------------- */}
      {user && user.rol === 'admin' && (
        <AdminPanel
          baseUrl={baseUrl}
          token={token}
          notify={notify}
          onAuthError={handleAuthError}
        />
      )}

      {/* --------------------- Demo de manejo de errores ----------------------- */}
      <section className="panel">
        <h2>Demo de manejo de errores</h2>
        <p className="muted">
          Prueba a pedir un recurso restringido (<code>GET /api/users</code>, solo
          admin). Sin sesión responde 401, como cliente 403; el error se captura y
          se muestra en el banner, sin romper la app.
        </p>
        <button className="secondary" onClick={tryRestricted}>
          Intentar ver /api/users
        </button>
      </section>
    </div>
  )
}
