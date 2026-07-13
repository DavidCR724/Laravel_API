import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { apiFetch } from '../api/client'

// Claves de localStorage (el panel corre en su propio origen: puerto 5174).
const LS = {
  url: 'admin_apiUrl',
  token: 'admin_token',
  user: 'admin_user',
}

const DEFAULT_API_URL = 'http://localhost:8000'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [apiUrl, setApiUrlState] = useState(() => localStorage.getItem(LS.url) || DEFAULT_API_URL)
  const [token, setToken] = useState(() => localStorage.getItem(LS.token) || '')
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem(LS.user) || 'null'))

  const setApiUrl = useCallback((url) => {
    const clean = String(url).trim().replace(/\/+$/, '')
    setApiUrlState(clean)
    localStorage.setItem(LS.url, clean)
  }, [])

  const clearSession = useCallback(() => {
    setToken('')
    setUser(null)
    localStorage.removeItem(LS.token)
    localStorage.removeItem(LS.user)
  }, [])

  // Interceptor de 401: al detectar token expirado, cierra la sesión local.
  const onUnauthorized = useCallback(() => {
    clearSession()
  }, [clearSession])

  // Petición autenticada: inyecta baseUrl, token y el manejador de 401.
  const api = useCallback(
    (path, options = {}) => apiFetch(apiUrl, path, { ...options, token, onUnauthorized }),
    [apiUrl, token, onUnauthorized]
  )

  const login = useCallback(
    async (username, password) => {
      const data = await apiFetch(apiUrl, '/api/login', {
        method: 'POST',
        body: { user: username, password },
      })

      // Esta consola es solo para administradores.
      if (!data || !data.user || data.user.rol !== 'admin') {
        const err = new Error('Esta consola es solo para administradores.')
        err.status = 403
        throw err
      }

      setToken(data.token)
      setUser(data.user)
      localStorage.setItem(LS.token, data.token)
      localStorage.setItem(LS.user, JSON.stringify(data.user))
      return data
    },
    [apiUrl]
  )

  const logout = useCallback(async () => {
    if (token) {
      try {
        await apiFetch(apiUrl, '/api/logout', { method: 'POST', token })
      } catch (e) {
        // aunque el token ya haya expirado, cerramos localmente
      }
    }
    clearSession()
  }, [apiUrl, token, clearSession])

  const value = useMemo(
    () => ({
      apiUrl,
      setApiUrl,
      token,
      user,
      api,
      login,
      logout,
      isAuthenticated: Boolean(token && user && user.rol === 'admin'),
    }),
    [apiUrl, setApiUrl, token, user, api, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
