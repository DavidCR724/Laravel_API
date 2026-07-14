import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Alert, Spinner, StatCard } from '../components/ui'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const LOW_STOCK = 5

export default function Dashboard() {
  const { api } = useAuth()
  const [articles, setArticles] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [a, u] = await Promise.all([api('/api/articles'), api('/api/users')])
        if (!active) return
        setArticles((a && a.data) || [])
        setUsers((u && u.data) || [])
      } catch (err) {
        if (active) setError(err.message || 'No se pudieron cargar las métricas.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [api])

  const metrics = useMemo(() => {
    const totalArticulos = articles.length
    const unidades = articles.reduce((s, a) => s + Number(a.stock || 0), 0)
    const valor = articles.reduce((s, a) => s + Number(a.costo || 0) * Number(a.stock || 0), 0)
    const precioProm = totalArticulos
      ? articles.reduce((s, a) => s + Number(a.costo || 0), 0) / totalArticulos
      : 0
    const bajos = articles
      .filter((a) => Number(a.stock || 0) < LOW_STOCK)
      .sort((x, y) => Number(x.stock || 0) - Number(y.stock || 0))

    const admins = users.filter((u) => u.rol === 'admin').length
    const clientes = users.filter((u) => u.rol === 'cliente').length

    return {
      totalArticulos,
      unidades,
      valor,
      precioProm,
      bajos,
      totalUsuarios: users.length,
      admins,
      clientes,
    }
  }, [articles, users])

  if (loading) {
    return (
      <div className="pt-10">
        <Spinner label="Cargando métricas…" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Resumen del catálogo, inventario y usuarios.</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Catálogo e inventario */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Artículos" value={metrics.totalArticulos} accent="indigo" />
        <StatCard
          label="Unidades en stock"
          value={metrics.unidades}
          accent="emerald"
          hint="Suma de existencias"
        />
        <StatCard
          label="Valor de inventario"
          value={currency.format(metrics.valor)}
          accent="slate"
          hint="Σ costo × stock"
        />
        <StatCard
          label="Precio promedio"
          value={currency.format(metrics.precioProm)}
          accent="amber"
        />
      </div>

      {/* Usuarios */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Usuarios totales" value={metrics.totalUsuarios} accent="indigo" />
        <StatCard label="Administradores" value={metrics.admins} accent="rose" />
        <StatCard label="Clientes" value={metrics.clientes} accent="emerald" />
      </div>

      {/* Stock bajo */}
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            Stock bajo <span className="text-slate-400">(&lt; {LOW_STOCK} unidades)</span>
          </h2>
          <Link to="/articulos" className="text-sm font-medium text-indigo-600 hover:underline">
            Gestionar artículos →
          </Link>
        </div>

        {metrics.bajos.length === 0 ? (
          <p className="text-sm text-slate-500">Todo el catálogo tiene stock suficiente. 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="th">Artículo</th>
                  <th className="th">Costo</th>
                  <th className="th">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.bajos.map((a) => (
                  <tr key={a.id}>
                    <td className="td font-medium text-slate-800">{a.nombre}</td>
                    <td className="td">{currency.format(Number(a.costo || 0))}</td>
                    <td className="td">
                      <span
                        className={`badge ${
                          Number(a.stock || 0) === 0
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {a.stock ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Nota: las métricas de <strong>ventas/ingresos</strong> requieren un endpoint de administrador
        para <code>purchases</code> (hoy las compras están limitadas al rol cliente). Puedo añadirlo
        al backend si lo necesitas.
      </p>
    </div>
  )
}
