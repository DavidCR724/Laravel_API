import axios from 'axios'

// Claves de localStorage (el panel corre en su propio origen: puerto 5174).
export const LS = {
  url: 'admin_api_url',
  token: 'admin_token',
  user: 'admin_user',
}

export const DEFAULT_API_URL = 'http://192.168.1.110:8000'

const api = axios.create({
  headers: { Accept: 'application/json' },
})

// Cada petición toma la URL base y el token vigentes de localStorage, así
// AuthContext puede cambiarlos (login/logout/cambio de servidor) sin
// necesidad de recrear el cliente.
api.interceptors.request.use((config) => {
  const apiUrl = localStorage.getItem(LS.url) || DEFAULT_API_URL
  config.baseURL = apiUrl.replace(/\/+$/, '')

  const token = localStorage.getItem(LS.token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Extrae siempre un mensaje legible (incluidos los errores 422 de validación
// de Laravel) y centraliza el cierre de sesión cuando el token ya no sirve.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const res = error.response

    if (!res) {
      error.message = 'No se pudo conectar con la API. Revisa la dirección configurada y que el servidor esté encendido.'
      return Promise.reject(error)
    }

    if (res.status === 401) {
      localStorage.removeItem(LS.token)
      localStorage.removeItem(LS.user)
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    const data = res.data
    if (res.status === 422 && data?.errors) {
      const first = Object.values(data.errors)[0]
      error.message = (first && first[0]) || error.message
    } else if (data?.message) {
      error.message = data.message
    }

    return Promise.reject(error)
  }
)

export default api
