import { useCallback, useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import { Badge, Empty, Loading } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { colors, money, radius } from '../theme'

const ESTADO_TONE = { completado: 'success', pendiente: 'warning', cancelado: 'danger' }

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX')
}

export default function OrdersScreen() {
  const { user } = useAuth()
  const [orders, setOrders] = useState(null)

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
            <Badge label={p.estado || 'completado'} tone={ESTADO_TONE[p.estado] || 'neutral'} />
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>{formatDate(p.created_at)}</Text>

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
        </View>
      ))}
    </ScrollView>
  )
}
