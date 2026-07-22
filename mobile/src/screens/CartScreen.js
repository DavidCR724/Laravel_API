import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ProductThumb from '../components/ProductThumb'
import ProductCard from '../components/ProductCard'
import { Button, Empty, Loading } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { colors, money, radius } from '../theme'

function AiRecommendations({ count, onOpen, onAdd }) {
  const [recs, setRecs] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchRecs = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/ai/recommendations')
      setRecs(data.data || [])
      setMotivo(data.motivo || '')
    } catch {
      setRecs([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Se recalcula cada vez que cambia la cantidad de artículos del carrito.
  useEffect(() => {
    fetchRecs()
  }, [count, fetchRecs])

  return (
    <View style={{ marginTop: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Ionicons name="sparkles" size={18} color={colors.gold} />
        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.leatherDark }}>Recomendado para ti</Text>
      </View>
      {motivo ? <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 10 }}>{motivo}</Text> : null}

      {loading && !recs ? (
        <Text style={{ color: colors.muted }}>La IA está pensando…</Text>
      ) : recs && recs.length ? (
        recs.map((a) => <ProductCard key={a.id} article={a} onPress={() => onOpen(a)} onAdd={() => onAdd(a)} />)
      ) : (
        <Text style={{ color: colors.muted }}>Sin recomendaciones por ahora.</Text>
      )}
    </View>
  )
}

export default function CartScreen({ navigation }) {
  const { isAuthenticated } = useAuth()
  const { items, total, count, loading, remove, add, refresh } = useCart()

  useEffect(() => {
    if (isAuthenticated) refresh()
  }, [isAuthenticated, refresh])

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, justifyContent: 'center' }}>
        <Empty
          icon={<Ionicons name="cart-outline" size={44} color={colors.muted} />}
          title="Tu carrito te espera"
          subtitle="Inicia sesión para agregar productos, comprar y recibir recomendaciones con IA."
        />
        <View style={{ paddingHorizontal: 24 }}>
          <Button title="Iniciar sesión" onPress={() => navigation.navigate('Login')} />
        </View>
      </View>
    )
  }

  if (loading && count === 0) return <Loading text="Cargando carrito…" />

  function handleCheckout() {
    navigation.navigate('Payment')
  }

  async function handleAddRec(article) {
    try {
      await add(article.id)
      Alert.alert('Agregado', `"${article.nombre}" se agregó a tu carrito.`)
    } catch (err) {
      Alert.alert('Error', err.message)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.leatherDark, marginBottom: 12 }}>Mi carrito</Text>

      {count === 0 ? (
        <Empty
          icon={<Ionicons name="cart-outline" size={40} color={colors.muted} />}
          title="Tu carrito está vacío"
          subtitle="Agrega sombreros desde el catálogo."
        />
      ) : (
        <>
          {items.map((it) => (
            <View
              key={it.id}
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.lg,
                padding: 12,
                marginBottom: 10,
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <ProductThumb article={it.article} size={64} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2} style={{ fontWeight: '600', color: colors.leatherDark }}>
                  {it.article?.nombre || `Artículo #${it.article_id}`}
                </Text>
                <Text style={{ color: colors.denim, fontWeight: '800', marginTop: 4 }}>
                  {money(it.article?.costo)}
                </Text>
              </View>
              <Pressable onPress={() => remove(it.id)} hitSlop={8} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </View>
          ))}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: colors.muted }}>Total ({count} art.)</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.leatherDark }}>{money(total)}</Text>
          </View>

          <Button title="Proceder al pago" onPress={handleCheckout} icon={<Ionicons name="card" size={18} color={colors.leatherDark} />} />
        </>
      )}

      {/* Recomendaciones IA según el carrito */}
      <AiRecommendations
        count={count}
        onOpen={(a) => navigation.navigate('ProductDetail', { id: a.id, nombre: a.nombre })}
        onAdd={handleAddRec}
      />
    </ScrollView>
  )
}
