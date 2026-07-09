import { useEffect, useState, useCallback } from 'react'
import { apiRequest } from '../api'

// Catálogo público: productos y reseñas (GET). Lo puede ver cualquiera (invitado).
export default function Catalog({ baseUrl, token, notify }) {
  const [products, setProducts] = useState([])
  const [reviews, setReviews] = useState([])

  const load = useCallback(async () => {
    try {
      const p = await apiRequest(baseUrl, '/api/articles', { token })
      setProducts(p.data || [])
    } catch (err) {
      notify(`Productos: ${err.message}`, 'error')
    }
    try {
      const r = await apiRequest(baseUrl, '/api/reviews', { token })
      setReviews(r.data || [])
    } catch (err) {
      notify(`Reseñas: ${err.message}`, 'error')
    }
  }, [baseUrl, token, notify])

  useEffect(() => {
    load()
  }, [load])

  return (
    <section>
      <div className="row between">
        <h2>Productos</h2>
        <button className="secondary" onClick={load}>
          Recargar
        </button>
      </div>
      {products.length === 0 ? (
        <p className="muted">Sin productos (o revisa la dirección de la API).</p>
      ) : (
        <ul className="list">
          {products.map((p) => (
            <li key={p.id} className="card">
              <div className="row between">
                <strong>{p.nombre}</strong>
                <span className="price">${p.costo}</span>
              </div>
              <div className="muted">{p.descripcion}</div>
            </li>
          ))}
        </ul>
      )}

      <h2>Reseñas</h2>
      {reviews.length === 0 ? (
        <p className="muted">Sin reseñas.</p>
      ) : (
        <ul className="list">
          {reviews.map((r) => (
            <li key={r.id} className="card">
              <div className="row between">
                <strong>{r.article ? r.article.nombre : `Producto #${r.article_id}`}</strong>
                <span className="stars">
                  {'★'.repeat(r.calificacion)}
                  {'☆'.repeat(5 - r.calificacion)}
                </span>
              </div>
              <div className="muted">{r.descripcion}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
