// Helper mínimo para llamar a la API de Laravel con fetch.
// baseUrl = dirección donde corre la API (p. ej. http://192.168.1.50:8000).

export async function apiRequest(baseUrl, path, options = {}) {
  const { method = 'GET', token = null, body = null } = options

  const url = String(baseUrl).replace(/\/+$/, '') + path

  const headers = { Accept: 'application/json' }
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch (e) {
    // respuesta sin cuerpo JSON
  }

  if (!res.ok) {
    const message = data && data.message ? data.message : `Error ${res.status}`
    const error = new Error(message)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}
