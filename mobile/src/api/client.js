import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEFAULT_API_URL, STORAGE_KEYS } from '../config'

// Cliente axios compartido. La URL base y el token se leen de AsyncStorage en
// cada petición, para que el login/logout/cambio de servidor tengan efecto sin
// recrear el cliente.
const api = axios.create({
  headers: { Accept: 'application/json' },
  timeout: 20000,
})

api.interceptors.request.use(async (config) => {
  const apiUrl = (await AsyncStorage.getItem(STORAGE_KEYS.apiUrl)) || DEFAULT_API_URL
  config.baseURL = apiUrl.replace(/\/+$/, '')

  const token = await AsyncStorage.getItem(STORAGE_KEYS.token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const res = error.response
    if (!res) {
      error.message =
        'No se pudo conectar con la API. Revisa la dirección del servidor y que Laravel esté encendido.'
      return Promise.reject(error)
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
