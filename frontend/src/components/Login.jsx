import { useState } from 'react'
import { apiRequest } from '../api'

// Formulario de login. Al iniciar sesión llama onLogin(data) con el token/usuario.
export default function Login({ baseUrl, notify, onLogin, onClose }) {
  const [username, setUsername] = useState('cliente')
  const [password, setPassword] = useState('cliente123')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await apiRequest(baseUrl, '/api/login', {
        method: 'POST',
        body: { user: username, password },
      })
      onLogin(data)
    } catch (err) {
      notify(`No se pudo iniciar sesión: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="card login" onSubmit={submit}>
      <div className="row between">
        <strong>Iniciar sesión</strong>
        <button type="button" className="link" onClick={onClose}>
          ✕
        </button>
      </div>
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
      <button disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
      <p className="hint">
        Ejemplos: <code>admin / admin123</code> · <code>cliente / cliente123</code>
      </p>
    </form>
  )
}
