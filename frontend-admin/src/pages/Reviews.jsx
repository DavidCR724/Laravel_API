import { useEffect, useMemo, useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import api from '../api/client'

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-MX')
}

function Stars({ value }) {
  const n = Number(value) || 0
  return (
    <span className="inline-flex items-center gap-0.5" title={`${n} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= n ? 'fill-gold text-gold' : 'text-leather-dark/20'}
        />
      ))}
    </span>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState(null)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [articleId, setArticleId] = useState('')

  function load() {
    api
      .get('/api/reviews')
      .then((res) => setReviews(res.data?.data || []))
      .catch((err) => setError(err.message || 'No se pudieron cargar las reseñas.'))
  }

  useEffect(load, [])

  // Opciones de filtro derivadas de las propias reseñas (usuarios y productos
  // que han dejado / recibido reseñas).
  const { userOptions, articleOptions } = useMemo(() => {
    const uMap = new Map()
    const aMap = new Map()
    for (const r of reviews || []) {
      if (r.user) uMap.set(r.user.id, r.user.user)
      if (r.article) aMap.set(r.article.id, r.article.nombre)
      else if (r.article_id) aMap.set(r.article_id, `Artículo #${r.article_id}`)
    }
    return {
      userOptions: [...uMap.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]))),
      articleOptions: [...aMap.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]))),
    }
  }, [reviews])

  const filtered = useMemo(() => {
    return (reviews || []).filter((r) => {
      if (userId && String(r.user_id) !== String(userId)) return false
      if (articleId && String(r.article_id) !== String(articleId)) return false
      return true
    })
  }, [reviews, userId, articleId])

  const promedio = useMemo(() => {
    if (filtered.length === 0) return null
    const sum = filtered.reduce((s, r) => s + (Number(r.calificacion) || 0), 0)
    return sum / filtered.length
  }, [filtered])

  async function handleDelete(r) {
    if (!confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')) return
    try {
      await api.delete(`/api/reviews/${r.id}`)
      load()
    } catch (err) {
      alert(err.message || 'No se pudo eliminar la reseña.')
    }
  }

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold text-leather-dark">Reseñas</h1>
      <p className="mb-4 text-sm text-leather-dark/60">
        Reseñas de los clientes. Filtra por usuario o por producto.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px]">
          <label className="label">Usuario</label>
          <select className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Todos</option>
            {userOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="label">Producto</label>
          <select className="input" value={articleId} onChange={(e) => setArticleId(e.target.value)}>
            <option value="">Todos</option>
            {articleOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        {(userId || articleId) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setUserId('')
              setArticleId('')
            }}
          >
            Limpiar filtros
          </button>
        )}
        {promedio !== null && (
          <div className="ml-auto flex items-center gap-2 text-sm text-leather-dark/70">
            <span>{filtered.length} reseña(s) · promedio</span>
            <span className="font-serif text-lg font-bold text-leather-dark">{promedio.toFixed(1)}</span>
            <Stars value={Math.round(promedio)} />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-leather/10">
              <th className="th">Usuario</th>
              <th className="th">Producto</th>
              <th className="th">Calificación</th>
              <th className="th">Reseña</th>
              <th className="th">Fecha</th>
              <th className="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-leather/5">
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="td font-medium">{r.user?.user || `#${r.user_id}`}</td>
                <td className="td">{r.article?.nombre || `Artículo #${r.article_id}`}</td>
                <td className="td">
                  <Stars value={r.calificacion} />
                </td>
                <td className="td max-w-md text-leather-dark/80">{r.descripcion || '—'}</td>
                <td className="td">{formatDate(r.created_at)}</td>
                <td className="td text-right">
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r)} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviews && filtered.length === 0 && (
          <p className="p-4 text-sm text-leather-dark/50">No hay reseñas para el filtro seleccionado.</p>
        )}
        {!reviews && !error && <p className="p-4 text-sm text-leather-dark/50">Cargando…</p>}
      </div>
    </div>
  )
}
