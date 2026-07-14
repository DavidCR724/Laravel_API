import { useEffect, useState } from 'react'
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import api from '../api/client'
import Modal from '../components/Modal'
import CaracteristicasEditor from '../components/CaracteristicasEditor'

const money = (n) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)

const EMPTY_FORM = { nombre: '', descripcion: '', costo: '', stock: 0, caracteristicas: {} }

function CaracteristicasSummary({ caracteristicas }) {
  const entries = Object.entries(caracteristicas || {})
  if (entries.length === 0) return <span className="text-leather-dark/40">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([k, v]) => (
        <span key={k} className="badge bg-denim/10 text-denim">
          {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
        </span>
      ))}
    </div>
  )
}

export default function Products() {
  const [articles, setArticles] = useState(null)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  function load() {
    api
      .get('/api/articles')
      .then((res) => setArticles(res.data?.data || []))
      .catch((err) => setError(err.message || 'No se pudieron cargar los productos.'))
  }

  useEffect(load, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(article) {
    setEditing(article)
    setForm({
      nombre: article.nombre,
      descripcion: article.descripcion,
      costo: article.costo,
      stock: article.stock ?? 0,
      caracteristicas: article.caracteristicas || {},
    })
    setFormError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        costo: Number(form.costo),
        stock: Number(form.stock) || 0,
        caracteristicas: form.caracteristicas,
      }
      if (editing) {
        await api.put(`/api/articles/${editing.id}`, payload)
      } else {
        await api.post('/api/articles', payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setFormError(err.message || 'No se pudo guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(article) {
    if (!confirm(`¿Eliminar "${article.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(`/api/articles/${article.id}`)
      load()
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el producto.')
    }
  }

  async function adjustStock(article, delta) {
    try {
      const { data } = await api.patch(`/api/articles/${article.id}/stock`, { ajuste: delta })
      setArticles((prev) => prev.map((a) => (a.id === article.id ? data.data : a)))
    } catch (err) {
      alert(err.message || 'No se pudo actualizar el stock.')
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-leather-dark">Gestión de productos</h1>
          <p className="text-sm text-leather-dark/60">Catálogo de sombreros de la tienda.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nuevo producto
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
              <th className="th">Nombre</th>
              <th className="th">Costo</th>
              <th className="th">Stock</th>
              <th className="th">Características</th>
              <th className="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-leather/5">
            {articles?.map((a) => (
              <tr key={a.id}>
                <td className="td font-medium">{a.nombre}</td>
                <td className="td">{money(a.costo)}</td>
                <td className="td">
                  <div className="flex items-center gap-1.5">
                    <button
                      className="btn btn-ghost btn-sm !px-1.5"
                      onClick={() => adjustStock(a, -1)}
                      aria-label="Restar stock"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center">{a.stock}</span>
                    <button
                      className="btn btn-ghost btn-sm !px-1.5"
                      onClick={() => adjustStock(a, 1)}
                      aria-label="Sumar stock"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </td>
                <td className="td max-w-xs">
                  <CaracteristicasSummary caracteristicas={a.caracteristicas} />
                </td>
                <td className="td text-right">
                  <div className="inline-flex gap-1">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {articles && articles.length === 0 && (
          <p className="p-4 text-sm text-leather-dark/50">Todavía no hay productos.</p>
        )}
        {!articles && !error && <p className="p-4 text-sm text-leather-dark/50">Cargando…</p>}
      </div>

      {modalOpen && (
        <Modal title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {formError}
              </div>
            )}

            <div className="mb-4">
              <label className="label">Nombre</label>
              <input
                className="input"
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="label">Descripción</label>
              <textarea
                className="input"
                rows={3}
                required
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Costo</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  required
                  value={form.costo}
                  onChange={(e) => setForm({ ...form, costo: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Stock inicial</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-5">
              <CaracteristicasEditor
                initialValue={form.caracteristicas}
                onChange={(val) => setForm((f) => ({ ...f, caracteristicas: val }))}
              />
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
    </div>
  )
}
