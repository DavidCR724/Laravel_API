import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import { Badge, Button, Empty, Loading } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { colors, money, radius } from '../theme'

const ESTADO_TONE = {
  pendiente_pago: 'warning',
  pendiente: 'warning',
  pagado: 'neutral',
  en_transito: 'gold',
  completado: 'success',
  cancelado: 'danger',
}

const ESTADO_LABEL = {
  pendiente_pago: 'Pendiente de pago',
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  en_transito: 'En tránsito',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

const METODO_LABEL = { efectivo: 'Efectivo', tarjeta: 'Tarjeta' }
const METODO_ICON = { efectivo: 'barcode', tarjeta: 'card' }

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX')
}

export default function OrdersScreen() {
  const { user } = useAuth()
  const { pay } = useCart()
  const [orders, setOrders] = useState(null)
  const [paying, setPaying] = useState(null)

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/purchases')
      const mine = (data.data || []).filter((p) => p.user_id === user?.id)
      mine.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setOrders(mine)
    } catch {
      setOrders([])
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  async function handlePay(order) {
    setPaying(order.id)
    try {
      await pay(order.id)
      await load()
      Alert.alert('Pago confirmado', `Tu pedido #${order.id} quedó como pagado.`)
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo confirmar el pago.')
    } finally {
      setPaying(null)
    }
  }

  if (!orders) return <Loading text="Cargando pedidos…" />

  if (orders.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, justifyContent: 'center' }}>
        <Empty
          icon={<Ionicons name="receipt-outline" size={44} color={colors.muted} />}
          title="Aún no tienes pedidos"
          subtitle="Cuando compres, tus pedidos aparecerán aquí."
        />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {orders.map((p) => (
        <View
          key={p.id}
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            padding: 14,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: '800', color: colors.leatherDark }}>Pedido #{p.id}</Text>
            <Badge label={ESTADO_LABEL[p.estado] || p.estado || '—'} tone={ESTADO_TONE[p.estado] || 'neutral'} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{formatDate(p.created_at)}</Text>
            {p.metodo_pago ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={METODO_ICON[p.metodo_pago] || 'cash-outline'} size={13} color={colors.muted} />
                <Text style={{ color: colors.muted, fontSize: 12 }}>{METODO_LABEL[p.metodo_pago] || p.metodo_pago}</Text>
              </View>
            ) : null}
          </View>

          {(p.items || []).map((it) => (
            <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
              <Text style={{ color: colors.leather, flex: 1 }} numberOfLines={1}>
                {it.cantidad ?? 1} × {it.article?.nombre || `Artículo #${it.article_id}`}
              </Text>
              <Text style={{ color: colors.leather }}>{money((Number(it.costo) || 0) * (Number(it.cantidad) || 1))}</Text>
            </View>
          ))}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.muted }}>Total</Text>
            <Text style={{ fontWeight: '800', color: colors.denim }}>{money(p.total)}</Text>
          </View>

          {p.estado === 'pendiente_pago' ? (
            <View style={{ marginTop: 12 }}>
              <Button
                title={p.metodo_pago === 'efectivo' ? 'Confirmar pago en efectivo' : 'Pagar ahora'}
                onPress={() => handlePay(p)}
                loading={paying === p.id}
                icon={<Ionicons name="card" size={18} color={colors.leatherDark} />}
              />
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  )
}
