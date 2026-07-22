import { useEffect, useMemo, useState } from 'react'
import { Ban, CheckCircle, Eye, Pencil, Plus, Trash2, Truck, X } from 'lucide-react'
import api from '../api/client'
import Modal from '../components/Modal'

const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-MX')
}

const ESTADOS = ['pendiente_pago', 'pagado', 'en_transito', 'completado', 'cancelado']

const ESTADO_STYLES = {
  pendiente_pago: 'bg-amber-100 text-amber-700',
  pendiente: 'bg-amber-100 text-amber-700',
  pagado: 'bg-sky-100 text-sky-700',
  en_transito: 'bg-indigo-100 text-indigo-700',
  completado: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-rose-100 text-rose-700',
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

function EstadoBadge({ estado }) {
  return (
    <span className={`badge ${ESTADO_STYLES[estado] || 'bg-denim/10 text-denim'}`}>
      {ESTADO_LABEL[estado] || estado || '—'}
    </span>
  )
}

const EMPTY_FORM = { user_id: '', estado: 'pendiente_pago', items: [] }

// Suma de (costo unitario * cantidad) de todas las líneas.
function computeTotal(items) {
  return items.reduce((sum, it) => sum + (Number(it.costo) || 0) * (Number(it.cantidad) || 0), 0)
}

function countUnits(purchase) {
  return (purchase.items || []).reduce((sum, it) => sum + (Number(it.cantidad) || 1), 0)
}

export default function Orders() {
  const [purchases, setPurchases] = useState(null)
  const [articles, setArticles] = useState([])
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [detail, setDetail] = useState(null)

  function load() {
    api
      .get('/api/purchases')
      .then((res) => setPurchases(res.data?.data || []))
      .catch((err) => setError(err.message || 'No se pudieron cargar los pedidos.'))
  }

  useEffect(() => {
    load()
    api.get('/api/articles').then((res) => setArticles(res.data?.data || [])).catch(() => {})
    api.get('/api/users').then((res) => setUsers(res.data?.data || [])).catch(() => {})
  }, [])

  const articlesById = useMemo(() => {
    const map = new Map()
    for (const a of articles) map.set(a.id, a)
    return map
  }, [articles])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, items: [] })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(p) {
    setEditing(p)
    setForm({
      user_id: p.user_id,
      estado: p.estado || 'pendiente_pago',
      items: (p.items || []).map((it) => ({
        article_id: it.article_id,
        cantidad: it.cantidad ?? 1,
        costo: it.costo,
      })),
    })
    setFormError('')
    setModalOpen(true)
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { article_id: '', cantidad: 1, costo: '' }] }))
  }

  function removeItem(idx) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  function updateItem(idx, patch) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }))
  }

  // Al elegir un artículo, precarga su costo actual como costo unitario.
  function onSelectArticle(idx, articleId) {
    const article = articlesById.get(Number(articleId))
    updateItem(idx, {
      article_id: articleId ? Number(articleId) : '',
      costo: article ? article.costo : '',
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.items.length === 0) {
      setFormError('Agrega al menos un artículo al pedido.')
      return
    }
    if (form.items.some((it) => !it.article_id)) {
      setFormError('Selecciona el artículo en cada línea.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        user_id: Number(form.user_id),
        estado: form.estado,
        items: form.items.map((it) => ({
          article_id: Number(it.article_id),
          cantidad: Number(it.cantidad) || 1,
          costo: it.costo === '' || it.costo === null ? undefined : Number(it.costo),
        })),
      }
      if (editing) {
        await api.put(`/api/admin/purchases/${editing.id}`, payload)
      } else {
        await api.post('/api/admin/purchases', payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setFormError(err.message || 'No se pudo guardar el pedido.')
    } finally {
      setSaving(false)
    }
  }

  // Avanza el estado del pedido (p. ej. pagado -> en_transito -> completado).
  async function setEstado(p, estado) {
    try {
      await api.put(`/api/admin/purchases/${p.id}`, { estado })
      load()
    } catch (err) {
      alert(err.message || 'No se pudo actualizar el estado.')
    }
  }

  async function handleCancel(p) {
    if (!confirm(`¿Cancelar el pedido #${p.id}? Se conservará en el historial como "cancelado".`)) return
    try {
      await api.patch(`/api/admin/purchases/${p.id}/cancel`)
      load()
    } catch (err) {
      alert(err.message || 'No se pudo cancelar el pedido.')
    }
  }

  async function handleDelete(p) {
    if (!confirm(`¿Eliminar definitivamente el pedido #${p.id}? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`/api/admin/purchases/${p.id}`)
      load()
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el pedido.')
    }
  }

  const formTotal = computeTotal(form.items)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-leather-dark">Gestión de pedidos</h1>
          <p className="text-sm text-leather-dark/60">Crea, edita, cancela o elimina pedidos.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nuevo pedido
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-leather/10">
              <th className="th">Pedido</th>
              <th className="th">Cliente</th>
              <th className="th">Fecha</th>
              <th className="th">Artículos</th>
              <th className="th">Total</th>
              <th className="th">Estado</th>
              <th className="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-leather/5">
            {purchases?.map((p) => (
              <tr key={p.id}>
                <td className="td font-medium">#{p.id}</td>
                <td className="td">{p.user?.user || `#${p.user_id}`}</td>
                <td className="td">{formatDate(p.created_at)}</td>
                <td className="td">{countUnits(p)}</td>
                <td className="td">{money(p.total)}</td>
                <td className="td">
                  <EstadoBadge estado={p.estado} />
                </td>
                <td className="td text-right">
                  <div className="inline-flex gap-1">
                    <button className="btn btn-secondary btn-sm" onClick={() => setDetail(p)} title="Ver detalle">
                      <Eye size={14} />
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)} title="Editar">
                      <Pencil size={14} />
                    </button>
                    {p.estado === 'pagado' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEstado(p, 'en_transito')}
                        title="Marcar en tránsito"
                      >
                        <Truck size={14} />
                      </button>
                    )}
                    {p.estado === 'en_transito' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEstado(p, 'completado')}
                        title="Marcar entregado"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCancel(p)}
                      disabled={p.estado === 'cancelado'}
                      title="Cancelar"
                    >
                      <Ban size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases && purchases.length === 0 && (
          <p className="p-4 text-sm text-leather-dark/50">Todavía no hay pedidos.</p>
        )}
        {!purchases && !error && <p className="p-4 text-sm text-leather-dark/50">Cargando…</p>}
      </div>

      {/* Modal crear / editar */}
      {modalOpen && (
        <Modal title={editing ? `Editar pedido #${editing.id}` : 'Nuevo pedido'} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {formError}
              </div>
            )}

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Cliente</label>
                <select
                  className="input"
                  required
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                >
                  <option value="">Selecciona un cliente…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.user} ({u.rol})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Estado</label>
                <select
                  className="input"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                >
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Artículos</label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                <Plus size={14} /> Agregar artículo
              </button>
            </div>

            <div className="mb-4 space-y-2">
              {form.items.length === 0 && (
                <p className="rounded-lg border border-dashed border-leather/20 p-3 text-sm text-leather-dark/50">
                  Sin artículos. Usa “Agregar artículo”.
                </p>
              )}
              {form.items.map((it, idx) => {
                const subtotal = (Number(it.costo) || 0) * (Number(it.cantidad) || 0)
                return (
                  <div key={idx} className="flex flex-wrap items-end gap-2 rounded-lg border border-leather/10 p-2">
                    <div className="min-w-[160px] flex-1">
                      <label className="label text-xs">Artículo</label>
                      <select
                        className="input"
                        value={it.article_id}
                        onChange={(e) => onSelectArticle(idx, e.target.value)}
                      >
                        <option value="">Selecciona…</option>
                        {articles.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <label className="label text-xs">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        value={it.cantidad}
                        onChange={(e) => updateItem(idx, { cantidad: e.target.value })}
                      />
                    </div>
                    <div className="w-28">
                      <label className="label text-xs">Costo unit.</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input"
                        value={it.costo}
                        onChange={(e) => updateItem(idx, { costo: e.target.value })}
                      />
                    </div>
                    <div className="w-28">
                      <label className="label text-xs">Subtotal</label>
                      <div className="px-1 py-2 text-sm font-medium text-leather-dark">{money(subtotal)}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm mb-1 !px-1.5"
                      onClick={() => removeItem(idx)}
                      title="Quitar línea"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="mb-5 flex items-center justify-end gap-3 border-t border-leather/10 pt-3">
              <span className="text-sm text-leather-dark/60">Total del pedido</span>
              <span className="font-serif text-xl font-bold text-leather-dark">{money(formTotal)}</span>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal detalle */}
      {detail && (
        <Modal title={`Pedido #${detail.id}`} onClose={() => setDetail(null)} wide>
          <div className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-leather-dark/50">Cliente</p>
              <p className="font-medium">{detail.user?.user || `#${detail.user_id}`}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-leather-dark/50">Fecha</p>
              <p className="font-medium">{formatDate(detail.created_at)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-leather-dark/50">Estado</p>
              <EstadoBadge estado={detail.estado} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-leather-dark/50">Total</p>
              <p className="font-serif text-lg font-bold">{money(detail.total)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-leather-dark/50">Forma de pago</p>
              <p className="font-medium">{METODO_LABEL[detail.metodo_pago] || '—'}</p>
            </div>
            {detail.referencia_pago && (
              <div>
                <p className="text-xs uppercase tracking-wide text-leather-dark/50">Referencia</p>
                <p className="font-mono text-sm">{detail.referencia_pago}</p>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-leather/10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-leather/10">
                  <th className="th">Producto</th>
                  <th className="th">Cantidad</th>
                  <th className="th">Costo unit.</th>
                  <th className="th">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-leather/5">
                {(detail.items || []).map((it) => (
                  <tr key={it.id}>
                    <td className="td font-medium">{it.article?.nombre || `Artículo #${it.article_id}`}</td>
                    <td className="td">{it.cantidad ?? 1}</td>
                    <td className="td">{money(it.costo)}</td>
                    <td className="td">{money((Number(it.costo) || 0) * (Number(it.cantidad) || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(detail.items || []).length === 0 && (
              <p className="p-4 text-sm text-leather-dark/50">Este pedido no tiene artículos.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
