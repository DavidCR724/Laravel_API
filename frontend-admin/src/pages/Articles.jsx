import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import Modal from '../components/Modal'
import CaracteristicasEditor from '../components/CaracteristicasEditor'
import { Alert, Spinner } from '../components/ui'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const emptyForm = { nombre: '', descripcion: '', costo: '', stock: '0', caracteristicas: {} }

export default function Articles() {
  const { api } = useAuth()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // artículo en edición o null (crear)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api('/api/articles')
      setArticles((res && res.data) || [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los artículos.')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(a) {
    setEditing(a)
    setForm({
      nombre: a.nombre || '',
      descripcion: a.descripcion || '',
      costo: String(a.costo ?? ''),
      stock: String(a.stock ?? 0),
      caracteristicas: a.caracteristicas || {},
    })
    setFormError('')
    setModalOpen(true)
  }

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      const body = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        costo: Number(form.costo),
        stock: Number(form.stock || 0),
        caracteristicas: form.caracteristicas || {},
      }
      if (editing) {
        await api(`/api/articles/${editing.id}`, { method: 'PUT', body })
        setNotice('Artículo actualizado correctamente.')
      } else {
        await api('/api/articles', { method: 'POST', body })
        setNotice('Artículo creado correctamente.')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setFormError(err.message || 'No se pudo guardar el artículo.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await api(`/api/articles/${deleting.id}`, { method: 'DELETE' })
      setNotice('Artículo eliminado correctamente.')
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el artículo.')
      setDeleting(null)
    }
  }

  // Ajuste rápido de stock usando el endpoint dedicado PATCH /articles/{id}/stock.
  async function adjustStock(a, ajuste) {
    try {
      const res = await api(`/api/articles/${a.id}/stock`, { method: 'PATCH', body: { ajuste } })
      const nuevo = res && res.data ? res.data.stock : a.stock
      setArticles((list) => list.map((x) => (x.id === a.id ? { ...x, stock: nuevo } : x)))
    } catch (err) {
      setError(err.message || 'No se pudo ajustar el stock.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Artículos</h1>
          <p className="text-sm text-slate-500">Gestiona el catálogo de sombreros.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Nuevo artículo
        </button>
      </div>

      {notice && (
        <Alert type="ok" onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="card p-0">
        {loading ? (
          <div className="p-6">
            <Spinner label="Cargando artículos…" />
          </div>
        ) : articles.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay artículos todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">#</th>
                  <th className="th">Nombre</th>
                  <th className="th">Costo</th>
                  <th className="th">Stock</th>
                  <th className="th">Características</th>
                  <th className="th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((a) => {
                  const caract = a.caracteristicas && typeof a.caracteristicas === 'object' ? a.caracteristicas : {}
                  const keys = Object.keys(caract)
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="td text-slate-400">{a.id}</td>
                      <td className="td">
                        <p className="font-medium text-slate-800">{a.nombre}</p>
                        <p className="max-w-xs truncate text-xs text-slate-400">{a.descripcion}</p>
                      </td>
                      <td className="td whitespace-nowrap">{currency.format(Number(a.costo || 0))}</td>
                      <td className="td">
                        <div className="flex items-center gap-1">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => adjustStock(a, -1)}
                            disabled={Number(a.stock || 0) <= 0}
                            aria-label="Restar stock"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{a.stock ?? 0}</span>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => adjustStock(a, 1)}
                            aria-label="Sumar stock"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="td">
                        {keys.length === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {keys.slice(0, 3).map((k) => (
                              <span key={k} className="badge bg-slate-100 text-slate-600">
                                {k}: {String(caract[k])}
                              </span>
                            ))}
                            {keys.length > 3 && (
                              <span className="badge bg-slate-100 text-slate-500">
                                +{keys.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="td">
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}>
                            Editar
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleting(a)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --------------------------- Modal crear/editar -------------------------- */}
      {modalOpen && (
        <Modal
          title={editing ? `Editar artículo #${editing.id}` : 'Nuevo artículo'}
          onClose={() => setModalOpen(false)}
          maxWidth="max-w-xl"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner label="Guardando…" /> : 'Guardar'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSave} className="space-y-3">
            {formError && <Alert type="error">{formError}</Alert>}

            <div>
              <label className="label">Nombre</label>
              <input
                className="input"
                value={form.nombre}
                onChange={(e) => setField('nombre', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Descripción</label>
              <textarea
                className="input"
                rows={2}
                value={form.descripcion}
                onChange={(e) => setField('descripcion', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Costo (MXN)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costo}
                  onChange={(e) => setField('costo', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Stock</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setField('stock', e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <CaracteristicasEditor
                key={editing ? editing.id : 'new'}
                initialValue={form.caracteristicas}
                onChange={(obj) => setField('caracteristicas', obj)}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* ----------------------------- Confirmar borrado ------------------------- */}
      {deleting && (
        <Modal
          title="Eliminar artículo"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleting(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Sí, eliminar
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            ¿Seguro que deseas eliminar <strong>{deleting.nombre}</strong> (#{deleting.id})? Esta
            acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  )
}
