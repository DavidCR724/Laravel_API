import { useEffect, useMemo, useState } from 'react'
import { Award, DollarSign, ShoppingBag, UserCheck } from 'lucide-react'
import api from '../api/client'

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card border-t-4 border-t-gold">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-leather-dark/50">{label}</p>
          <p className="mt-1 font-serif text-2xl font-bold text-leather-dark">{value}</p>
          {sub && <p className="mt-1 text-xs text-leather-dark/50">{sub}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)

export default function Dashboard() {
  const [purchases, setPurchases] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/api/purchases')
      .then((res) => setPurchases(res.data?.data || []))
      .catch((err) => setError(err.message || 'No se pudo cargar el historial de ventas.'))
  }, [])

  const stats = useMemo(() => {
    if (!purchases) return null

    const totalVentas = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0)

    const productCounts = new Map()
    const clientCounts = new Map()

    for (const p of purchases) {
      const clientName = p.user?.user || `#${p.user_id}`
      clientCounts.set(clientName, (clientCounts.get(clientName) || 0) + 1)

      for (const item of p.items || []) {
        const name = item.article?.nombre || `Artículo #${item.article_id}`
        productCounts.set(name, (productCounts.get(name) || 0) + 1)
      }
    }

    const topProduct = [...productCounts.entries()].sort((a, b) => b[1] - a[1])[0]
    const topClient = [...clientCounts.entries()].sort((a, b) => b[1] - a[1])[0]

    return {
      totalVentas,
      totalCompras: purchases.length,
      topProduct,
      topClient,
    }
  }, [purchases])

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold text-leather-dark">Estadísticas</h1>
      <p className="mb-6 text-sm text-leather-dark/60">Resumen general del desempeño de la tienda.</p>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!purchases && !error && <p className="text-sm text-leather-dark/50">Cargando…</p>}

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={DollarSign} label="Ventas acumuladas" value={money(stats.totalVentas)} />
          <KpiCard icon={ShoppingBag} label="Compras totales" value={stats.totalCompras} />
          <KpiCard
            icon={Award}
            label="Producto más vendido"
            value={stats.topProduct ? stats.topProduct[0] : '—'}
            sub={stats.topProduct ? `${stats.topProduct[1]} unidades` : 'Sin datos aún'}
          />
          <KpiCard
            icon={UserCheck}
            label="Cliente con más compras"
            value={stats.topClient ? stats.topClient[0] : '—'}
            sub={stats.topClient ? `${stats.topClient[1]} compras` : 'Sin datos aún'}
          />
        </div>
      )}
    </div>
  )
}
