import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/client'
import { DEFAULT_API_URL, STORAGE_KEYS } from '../config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [apiUrl, setApiUrlState] = useState(DEFAULT_API_URL)
  const [ready, setReady] = useState(false)

  // Rehidrata sesión y configuración al abrir la app.
  useEffect(() => {
    ;(async () => {
      try {
        const [storedUrl, storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.apiUrl),
          AsyncStorage.getItem(STORAGE_KEYS.token),
          AsyncStorage.getItem(STORAGE_KEYS.user),
        ])
        if (storedUrl) setApiUrlState(storedUrl)
        if (storedToken) setToken(storedToken)
        if (storedUser) setUser(JSON.parse(storedUser))
      } catch {
        // ignora errores de lectura
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const setApiUrl = useCallback(async (url) => {
    const clean = String(url).trim().replace(/\/+$/, '')
    setApiUrlState(clean)
    await AsyncStorage.setItem(STORAGE_KEYS.apiUrl, clean)
  }, [])

  const persistSession = useCallback(async (tok, usr) => {
    setToken(tok)
    setUser(usr)
    await AsyncStorage.setItem(STORAGE_KEYS.token, tok)
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(usr))
  }, [])

  const login = useCallback(
    async (identifier, password) => {
      const { data } = await api.post('/api/login', { user: identifier, password })
      await persistSession(data.token, data.user)
      return data.user
    },
    [persistSession]
  )

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/api/register', payload)
      await persistSession(data.token, data.user)
      return data.user
    },
    [persistSession]
  )

  const logout = useCallback(async () => {
    try {
      if (token) await api.post('/api/logout')
    } catch {
      // el token puede haber expirado; cerramos localmente igual
    }
    setToken(null)
    setUser(null)
    await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user])
  }, [token])

  const value = useMemo(
    () => ({
      user,
      token,
      apiUrl,
      ready,
      isAuthenticated: Boolean(token),
      isGuest: !token,
      setApiUrl,
      login,
      register,
      logout,
    }),
    [user, token, apiUrl, ready, setApiUrl, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
