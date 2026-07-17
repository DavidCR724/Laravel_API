import { useEffect, useState } from 'react'
import { Ban, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import api from '../api/client'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

export default function Clients() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ user: '', nombre: '', correo: '', telefono: '', rol: 'cliente' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  function load() {
    api
      .get('/api/users')
      .then((res) => setUsers(res.data?.data || []))
      .catch((err) => setError(err.message || 'No se pudieron cargar los usuarios.'))
  }

  useEffect(load, [])

  function openEdit(u) {
    setEditing(u)
    setForm({
      user: u.user || '',
      nombre: u.nombre || '',
      correo: u.correo || '',
      telefono: u.telefono || '',
      rol: u.rol || 'cliente',
    })
    setFormError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await api.put(`/api/users/${editing.id}`, {
        user: form.user,
        nombre: form.nombre || null,
        correo: form.correo || null,
        telefono: form.telefono || null,
        rol: form.rol,
      })
      setModalOpen(false)
      load()
    } catch (err) {
      setFormError(err.message || 'No se pudo guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(u) {
    if (u.id === currentUser?.id) {
      alert('No puedes eliminar tu propio usuario.')
      return
    }
    if (!confirm(`¿Eliminar al usuario "${u.user}"?`)) return
    try {
      await api.delete(`/api/users/${u.id}`)
      load()
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el usuario.')
    }
  }

  async function handleToggleActive(u) {
    if (u.id === currentUser?.id) {
      alert('No puedes deshabilitar tu propio usuario.')
      return
    }
    const disabling = u.activo
    const verb = disabling ? 'deshabilitar' : 'habilitar'
    if (
      disabling &&
      !confirm(`¿Deshabilitar al usuario "${u.user}"? No podrá iniciar sesión y se cerrará su sesión actual.`)
    )
      return
    try {
      await api.put(`/api/users/${u.id}`, { activo: !u.activo })
      load()
    } catch (err) {
      alert(err.message || `No se pudo ${verb} el usuario.`)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-leather-dark">Gestión de usuarios</h1>
        <p className="text-sm text-leather-dark/60">
          Usuarios registrados. El alta se hace desde la app; aquí puedes editar, bloquear o eliminar.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-leather/10">
              <th className="th">Usuario</th>
              <th className="th">Nombre</th>
              <th className="th">Correo</th>
              <th className="th">Teléfono</th>
              <th className="th">Rol</th>
              <th className="th">Estado</th>
              <th className="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-leather/5">
            {users?.map((u) => (
              <tr key={u.id}>
                <td className="td font-medium">{u.user}</td>
                <td className="td">{u.nombre || <span className="text-leather-dark/30">—</span>}</td>
                <td className="td">{u.correo || <span className="text-leather-dark/30">—</span>}</td>
                <td className="td">{u.telefono || <span className="text-leather-dark/30">—</span>}</td>
                <td className="td">
                  <span
                    className={`badge ${
                      u.rol === 'admin' ? 'bg-gold/20 text-leather-dark' : 'bg-denim/10 text-denim'
                    }`}
                  >
                    {u.rol}
                  </span>
                </td>
                <td className="td">
                  <span
                    className={`badge ${
                      u.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {u.activo ? 'Activo' : 'Deshabilitado'}
                  </span>
                </td>
                <td className="td text-right">
                  <div className="inline-flex gap-1">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleToggleActive(u)}
                      title={u.activo ? 'Deshabilitar usuario' : 'Habilitar usuario'}
                    >
                      {u.activo ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)} title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users && users.length === 0 && (
          <p className="p-4 text-sm text-leather-dark/50">Todavía no hay usuarios.</p>
        )}
        {!users && !error && <p className="p-4 text-sm text-leather-dark/50">Cargando…</p>}
      </div>

      {modalOpen && (
        <Modal title="Editar usuario" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {formError}
              </div>
            )}

            <div className="mb-4">
              <label className="label">Usuario</label>
              <input
                className="input"
                required
                value={form.user}
                onChange={(e) => setForm({ ...form, user: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="label">Nombre completo</label>
              <input
                className="input"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Correo</label>
                <input
                  type="email"
                  className="input"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input
                  className="input"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="label">Rol</label>
              <select
                className="input"
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
              >
                <option value="cliente">cliente</option>
                <option value="admin">admin</option>
              </select>
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
