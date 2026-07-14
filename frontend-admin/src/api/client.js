// Cliente HTTP sobre fetch que actúa como "interceptor":
//  - adjunta el header Authorization: Bearer <token> en cada petición,
//  - centraliza el manejo de errores (incluido el 401 por token expirado),
//  - extrae el primer mensaje útil de los errores de validación 422.

function buildUrl(baseUrl, path) {
  return String(baseUrl).replace(/\/+$/, '') + path
}

export async function apiFetch(baseUrl, path, options = {}) {
  const { method = 'GET', token = null, body = null, onUnauthorized = null } = options

  const headers = { Accept: 'application/json' }
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res
  try {
    res = await fetch(buildUrl(baseUrl, path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    const err = new Error(
      'No se pudo conectar con la API. Revisa la URL configurada y que el servidor esté encendido.'
    )
    err.status = 0
    throw err
  }

  let data = null
  try {
    data = await res.json()
  } catch (e) {
    // respuesta sin cuerpo JSON
  }

  // Token expirado / inválido: dispara el cierre de sesión centralizado.
  if (res.status === 401 && typeof onUnauthorized === 'function') {
    onUnauthorized()
  }

  if (!res.ok) {
    const error = new Error((data && data.message) || `Error ${res.status}`)
    error.status = res.status
    error.data = data

    if (res.status === 422 && data && data.errors) {
      const first = Object.values(data.errors)[0]
      if (first && first[0]) error.message = first[0]
    }
    throw error
  }

  return data
}
