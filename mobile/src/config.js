// Dirección por defecto de la API. En un dispositivo físico DEBE ser la IP de
// la máquina donde corre Laravel (no "localhost"), p. ej. http://192.168.1.110:8000.
// El usuario puede cambiarla desde la pantalla de Cuenta.
export const DEFAULT_API_URL = 'http://192.168.1.110:8000'

export const STORAGE_KEYS = {
  apiUrl: 'sombreria_api_url',
  token: 'sombreria_token',
  user: 'sombreria_user',
}
