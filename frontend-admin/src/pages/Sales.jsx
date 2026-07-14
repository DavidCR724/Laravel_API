import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import api from '../api/client'

const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-MX')
}

// Aplana compras -> una fila por artículo comprado (más fácil de buscar y leer).
function flatten(purchases) {
  const rows = []
  for (const p of purchases) {
    const cliente = p.user?.user || `#${p.user_id}`
    const fecha = formatDate(p.created_at)
    const items = p.items || []

    if (items.length === 0) {
      rows.push({
        key: `${p.id}-empty`,
        purchaseId: p.id,
        cliente,
        fecha,
        producto: '—',
        costo: 0,
        total: p.total,
      })
      continue
    }

    for (const item of items) {
      rows.push({
        key: `${p.id}-${item.id}`,
        purchaseId: p.id,
        cliente,
        fecha,
        producto: item.article?.nombre || `Artículo #${item.article_id}`,
        costo: item.costo,
        total: p.total,
      })
    }
  }
  return rows
}

export default function Sales() {
  const [purchases, setPurchases] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    api
      .get('/api/purchases')
      .then((res) => setPurchases(res.data?.data || []))
      .catch((err) => setError(err.message || 'No se pudo cargar el historial de ventas.'))
  }, [])

  const rows = useMemo(() => (purchases ? flatten(purchases) : []), [purchases])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      [r.producto, r.cliente, r.fecha, String(r.costo), String(r.total)]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [rows, query])

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-bold text-leather-dark">Historial de ventas</h1>
      <p className="mb-4 text-sm text-leather-dark/60">
        Busca por producto, cliente, fecha o precio.
      </p>

      <div className="relative mb-4 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-leather-dark/40" />
        <input
          className="input pl-9"
          placeholder="Buscar…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-leather/10">
              <th className="th">Compra</th>
              <th className="th">Cliente</th>
              <th className="th">Producto</th>
              <th className="th">Fecha</th>
              <th className="th">Precio</th>
              <th className="th">Total de la compra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-leather/5">
            {filtered.map((r) => (
              <tr key={r.key}>
                <td className="td">#{r.purchaseId}</td>
                <td className="td">{r.cliente}</td>
                <td className="td font-medium">{r.producto}</td>
                <td className="td">{r.fecha}</td>
                <td className="td">{money(r.costo)}</td>
                <td className="td">{money(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases && filtered.length === 0 && (
          <p className="p-4 text-sm text-leather-dark/50">Sin resultados para "{query}".</p>
        )}
        {!purchases && !error && <p className="p-4 text-sm text-leather-dark/50">Cargando…</p>}
      </div>
    </div>
  )
}
