import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user, token } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(false)

  // Obtiene (o crea) el carrito del usuario en el servidor.
  const ensureCart = useCallback(async () => {
    const { data } = await api.get('/api/carts')
    const mine = (data.data || []).filter((c) => c.user_id === user.id)
    let c = mine[0]
    if (!c) {
      const res = await api.post('/api/carts', { user_id: user.id })
      c = { ...res.data.data, items: [] }
    }
    return c
  }, [user])

  const refresh = useCallback(async () => {
    if (!token || !user) {
      setCart(null)
      return
    }
    setLoading(true)
    try {
      const base = await ensureCart()
      const { data } = await api.get(`/api/carts/${base.id}`)
      setCart(data.data)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [token, user, ensureCart])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = useCallback(
    async (articleId) => {
      if (!token) throw new Error('Inicia sesión para agregar productos al carrito.')
      const base = await ensureCart()
      await api.post('/api/cart-items', { cart_id: base.id, article_id: articleId })
      await refresh()
    },
    [token, ensureCart, refresh]
  )

  const remove = useCallback(
    async (itemId) => {
      await api.delete(`/api/cart-items/${itemId}`)
      await refresh()
    },
    [refresh]
  )

  // Genera el pedido a partir del carrito con la forma de pago elegida
  // ('efectivo' o 'tarjeta'). El pedido nace 'pendiente_pago'; el cobro se
  // confirma después con pay(). Devuelve el pedido creado (incluye la
  // referencia del código de barras cuando es efectivo).
  const checkout = useCallback(
    async (metodoPago) => {
      if (!cart?.id) throw new Error('Tu carrito está vacío.')
      const { data } = await api.post('/api/purchases', { cart_id: cart.id, metodo_pago: metodoPago })
      await refresh()
      return data.data
    },
    [cart, refresh]
  )

  // Confirma el pago (simulado) de un pedido pendiente. Sirve para tarjeta y
  // para efectivo (cuando el cliente "paga" en tienda con el código de barras).
  const pay = useCallback(async (purchaseId) => {
    const { data } = await api.post(`/api/purchases/${purchaseId}/pay`)
    return data.data
  }, [])

  const items = cart?.items || []

  const value = useMemo(
    () => ({
      cart,
      items,
      count: items.length,
      total: Number(cart?.costo_total || 0),
      loading,
      refresh,
      add,
      remove,
      checkout,
      pay,
    }),
    [cart, items, loading, refresh, add, remove, checkout, pay]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
