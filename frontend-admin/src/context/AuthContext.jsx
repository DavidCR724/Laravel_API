import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import api, { DEFAULT_API_URL, LS } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [apiUrl, setApiUrlState] = useState(() => localStorage.getItem(LS.url) || DEFAULT_API_URL)
  const [token, setToken] = useState(() => localStorage.getItem(LS.token) || '')
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS.user) || 'null')
    } catch {
      return null
    }
  })

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

  // Regla de negocio estricta: solo usuarios con rol "admin" pueden entrar a
  // esta consola. Si el backend autentica correctamente pero el rol no es
  // admin, revocamos el token recién emitido (no lo dejamos "vivo" sin uso) y
  // rechazamos el acceso.
  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/api/login', { user: username, password })

    if (!data?.user || data.user.rol !== 'admin') {
      try {
        await api.post('/api/logout', null, {
          headers: { Authorization: `Bearer ${data?.token}` },
        })
      } catch {
        // si la revocación falla, igual rechazamos el acceso localmente
      }
      throw new Error('Acceso denegado: Área exclusiva de administración.')
    }

    setToken(data.token)
    setUser(data.user)
    localStorage.setItem(LS.token, data.token)
    localStorage.setItem(LS.user, JSON.stringify(data.user))

    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      if (token) await api.post('/api/logout')
    } catch {
      // el token puede ya haber expirado; igual cerramos la sesión local
    }
    clearSession()
  }, [token, clearSession])

  const value = useMemo(
    () => ({
      apiUrl,
      setApiUrl,
      token,
      user,
      login,
      logout,
      isAuthenticated: Boolean(token && user?.rol === 'admin'),
    }),
    [apiUrl, setApiUrl, token, user, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
