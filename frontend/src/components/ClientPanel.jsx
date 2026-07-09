import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '../api'

// Panel del CLIENTE: agregar un producto al carrito y comprar (checkout).
export default function ClientPanel({ baseUrl, token, user, notify, onAuthError }) {
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState('')
  const [cart, setCart] = useState(null) // carrito completo (con items)

  const loadProducts = useCallback(async () => {
    try {
      const p = await apiRequest(baseUrl, '/api/articles', { token })
      setProducts(p.data || [])
    } catch (err) {
      notify(err.message, 'error')
    }
  }, [baseUrl, token, notify])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Selecciona el primer producto por defecto.
  useEffect(() => {
    if (!selected && products.length) setSelected(String(products[0].id))
  }, [products, selected])

  // Crea un carrito si aún no existe.
  async function ensureCart() {
    if (cart) return cart
    const res = await apiRequest(baseUrl, '/api/carts', {
      method: 'POST',
      token,
      body: { user_id: user.id },
    })
    const nuevo = { ...res.data, items: [] }
    setCart(nuevo)
    return nuevo
  }

  async function refreshCart(cartId) {
    const res = await apiRequest(baseUrl, `/api/carts/${cartId}`, { token })
    setCart(res.data)
  }

  async function addToCart() {
    if (!selected) return
    try {
      const c = await ensureCart()
      await apiRequest(baseUrl, '/api/cart-items', {
        method: 'POST',
        token,
        body: { cart_id: c.id, article_id: Number(selected) },
      })
      await refreshCart(c.id)
      notify('Producto agregado al carrito.', 'ok')
    } catch (err) {
      onAuthError(err)
      notify(err.message, 'error')
    }
  }

  async function buy() {
    if (!cart) {
      notify('El carrito está vacío.', 'error')
      return
    }
    try {
      const res = await apiRequest(baseUrl, '/api/purchases', {
        method: 'POST',
        token,
        body: { cart_id: cart.id },
      })
      notify(`Compra realizada. Total: $${res.data.total}`, 'ok')
      setCart(null)
    } catch (err) {
      onAuthError(err)
      notify(err.message, 'error')
    }
  }

  const items = cart && cart.items ? cart.items : []

  return (
    <section className="panel">
      <h2>Comprar (cliente)</h2>
      <div className="row">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} — ${p.costo}
            </option>
          ))}
        </select>
        <button onClick={addToCart}>Agregar al carrito</button>
      </div>

      {items.length > 0 && (
        <div className="card">
          <strong>Carrito #{cart.id}</strong>
          <ul className="list">
            {items.map((it) => (
              <li key={it.id} className="row between">
                <span>{it.article ? it.article.nombre : `Producto #${it.article_id}`}</span>
                <span className="price">${it.article ? it.article.costo : '—'}</span>
              </li>
            ))}
          </ul>
          <div className="row between">
            <span>
              Total: <strong>${cart.costo_total}</strong>
            </span>
            <button onClick={buy}>Comprar</button>
          </div>
        </div>
      )}
    </section>
  )
}
