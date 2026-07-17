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

  const checkout = useCallback(async () => {
    if (!cart?.id) throw new Error('Tu carrito está vacío.')
    const { data } = await api.post('/api/purchases', { cart_id: cart.id })
    await refresh()
    return data.data
  }, [cart, refresh])

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
    }),
    [cart, items, loading, refresh, add, remove, checkout]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>')
  return ctx
}
