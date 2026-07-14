import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import Modal from '../components/Modal'
import { Alert, Spinner } from '../components/ui'

const ROLES = ['cliente', 'admin']
const emptyForm = { user: '', password: '', rol: 'cliente' }

export default function Users() {
  const { api, user: current } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api('/api/users')
      setUsers((res && res.data) || [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los usuarios.')
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

  function openEdit(u) {
    setEditing(u)
    setForm({ user: u.user || '', password: '', rol: u.rol || 'cliente' })
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
      if (editing) {
        // Actualización parcial: solo enviamos la contraseña si se escribió una.
        const body = { user: form.user.trim(), rol: form.rol }
        if (form.password) body.password = form.password
        await api(`/api/users/${editing.id}`, { method: 'PUT', body })
        setNotice('Usuario actualizado correctamente.')
      } else {
        await api('/api/users', {
          method: 'POST',
          body: { user: form.user.trim(), password: form.password, rol: form.rol },
        })
        setNotice('Usuario creado correctamente.')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setFormError(err.message || 'No se pudo guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await api(`/api/users/${deleting.id}`, { method: 'DELETE' })
      setNotice('Usuario eliminado correctamente.')
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el usuario.')
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Usuarios</h1>
          <p className="text-sm text-slate-500">Administra las cuentas del sistema.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + Nuevo usuario
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
            <Spinner label="Cargando usuarios…" />
          </div>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay usuarios.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">#</th>
                  <th className="th">Usuario</th>
                  <th className="th">Rol</th>
                  <th className="th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSelf = current && current.id === u.id
                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="td text-slate-400">{u.id}</td>
                      <td className="td font-medium text-slate-800">
                        {u.user}
                        {isSelf && <span className="ml-2 text-xs text-slate-400">(tú)</span>}
                      </td>
                      <td className="td">
                        <span
                          className={`badge ${
                            u.rol === 'admin'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.rol}
                        </span>
                      </td>
                      <td className="td">
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>
                            Editar
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleting(u)}
                            disabled={isSelf}
                            title={isSelf ? 'No puedes eliminar tu propia cuenta' : undefined}
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
          title={editing ? `Editar usuario #${editing.id}` : 'Nuevo usuario'}
          onClose={() => setModalOpen(false)}
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
              <label className="label">Nombre de usuario</label>
              <input
                className="input"
                value={form.user}
                onChange={(e) => setField('user', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">
                Contraseña {editing && <span className="text-xs text-slate-400">(opcional al editar)</span>}
              </label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder={editing ? 'Dejar en blanco para no cambiarla' : ''}
                minLength={6}
                required={!editing}
              />
            </div>

            <div>
              <label className="label">Rol</label>
              <select
                className="input"
                value={form.rol}
                onChange={(e) => setField('rol', e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* ----------------------------- Confirmar borrado ------------------------- */}
      {deleting && (
        <Modal
          title="Eliminar usuario"
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
            ¿Seguro que deseas eliminar a <strong>{deleting.user}</strong> (#{deleting.id})?
          </p>
        </Modal>
      )}
    </div>
  )
}
