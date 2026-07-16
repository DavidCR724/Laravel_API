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

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Barras verticales, una sola serie (magnitud en el tiempo). Color único = gold.
function VBarChart({ data, format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  if (data.length === 0) return <p className="text-sm text-leather-dark/40">Sin datos aún.</p>
  return (
    <div className="flex h-48 items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] font-medium text-leather-dark/60">{format(d.value)}</span>
          <div
            className="w-full rounded-t bg-gold transition-all hover:bg-gold-dark"
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
            title={`${d.label}: ${format(d.value)}`}
          />
          <span className="text-[10px] text-leather-dark/50">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// Barras horizontales, una sola serie (magnitud por identidad). Color único.
function HBarChart({ data, colorClass = 'bg-denim', format = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  if (data.length === 0) return <p className="text-sm text-leather-dark/40">Sin datos aún.</p>
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="w-28 shrink-0 truncate text-xs text-leather-dark/70" title={d.label}>
            {d.label}
          </span>
          <div className="h-4 flex-1 overflow-hidden rounded bg-leather/5">
            <div
              className={`h-full rounded ${colorClass}`}
              style={{ width: `${Math.max(3, (d.value / max) * 100)}%` }}
              title={`${d.label}: ${format(d.value)}`}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-medium text-leather-dark">
            {format(d.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// Distribución por estado: colores de estado reservados, siempre con etiqueta.
const ESTADO_META = {
  pendiente: { label: 'Pendiente', bar: 'bg-amber-400', dot: 'bg-amber-400' },
  completado: { label: 'Completado', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  cancelado: { label: 'Cancelado', bar: 'bg-rose-500', dot: 'bg-rose-500' },
}

function EstadoBreakdown({ counts, total }) {
  const order = ['completado', 'pendiente', 'cancelado']
  if (total === 0) return <p className="text-sm text-leather-dark/40">Sin datos aún.</p>
  return (
    <div className="space-y-3">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-leather/5">
        {order.map((k) => {
          const v = counts[k] || 0
          if (v === 0) return null
          return (
            <div
              key={k}
              className={ESTADO_META[k].bar}
              style={{ width: `${(v / total) * 100}%` }}
              title={`${ESTADO_META[k].label}: ${v}`}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {order.map((k) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-leather-dark/70">
            <span className={`h-2.5 w-2.5 rounded-full ${ESTADO_META[k].dot}`} />
            {ESTADO_META[k].label}: <strong className="text-leather-dark">{counts[k] || 0}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

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

    // Las ventas y los conteos de desempeño excluyen los pedidos cancelados.
    const validas = purchases.filter((p) => p.estado !== 'cancelado')

    const totalVentas = validas.reduce((sum, p) => sum + Number(p.total || 0), 0)

    const productUnits = new Map()
    const clientCounts = new Map()
    const monthTotals = new Map()

    for (const p of validas) {
      const clientName = p.user?.user || `#${p.user_id}`
      clientCounts.set(clientName, (clientCounts.get(clientName) || 0) + 1)

      const d = p.created_at ? new Date(p.created_at) : null
      if (d && !Number.isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthTotals.set(key, (monthTotals.get(key) || 0) + Number(p.total || 0))
      }

      for (const item of p.items || []) {
        const name = item.article?.nombre || `Artículo #${item.article_id}`
        const qty = Number(item.cantidad) || 1
        productUnits.set(name, (productUnits.get(name) || 0) + qty)
      }
    }

    const topProducts = [...productUnits.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }))

    const topProduct = topProducts[0]
    const topClient = [...clientCounts.entries()].sort((a, b) => b[1] - a[1])[0]

    // Últimos 6 meses en orden cronológico.
    const monthly = [...monthTotals.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, value]) => {
        const [y, m] = key.split('-')
        return { label: `${MONTHS[Number(m) - 1]} ${y.slice(2)}`, value }
      })

    const estadoCounts = { pendiente: 0, completado: 0, cancelado: 0 }
    for (const p of purchases) {
      const e = p.estado || 'completado'
      estadoCounts[e] = (estadoCounts[e] || 0) + 1
    }

    return {
      totalVentas,
      totalCompras: validas.length,
      topProduct,
      topClient,
      topProducts,
      monthly,
      estadoCounts,
      totalPedidos: purchases.length,
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
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={DollarSign} label="Ventas acumuladas" value={money(stats.totalVentas)} sub="Sin pedidos cancelados" />
            <KpiCard icon={ShoppingBag} label="Pedidos válidos" value={stats.totalCompras} sub={`${stats.totalPedidos} en total`} />
            <KpiCard
              icon={Award}
              label="Producto más vendido"
              value={stats.topProduct ? stats.topProduct.label : '—'}
              sub={stats.topProduct ? `${stats.topProduct.value} unidades` : 'Sin datos aún'}
            />
            <KpiCard
              icon={UserCheck}
              label="Cliente con más compras"
              value={stats.topClient ? stats.topClient[0] : '—'}
              sub={stats.topClient ? `${stats.topClient[1]} compras` : 'Sin datos aún'}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 font-serif text-lg font-semibold text-leather-dark">Ventas por mes</h2>
              <VBarChart data={stats.monthly} format={money} />
            </div>

            <div className="card">
              <h2 className="mb-4 font-serif text-lg font-semibold text-leather-dark">Productos más vendidos</h2>
              <HBarChart data={stats.topProducts} colorClass="bg-denim" />
            </div>

            <div className="card lg:col-span-2">
              <h2 className="mb-4 font-serif text-lg font-semibold text-leather-dark">Pedidos por estado</h2>
              <EstadoBreakdown counts={stats.estadoCounts} total={stats.totalPedidos} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
