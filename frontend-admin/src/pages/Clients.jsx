import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import api from '../api/client'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = { user: '', password: '', rol: 'cliente' }

export default function Clients() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  function load() {
    api
      .get('/api/users')
      .then((res) => setUsers(res.data?.data || []))
      .catch((err) => setError(err.message || 'No se pudieron cargar los clientes.'))
  }

  useEffect(load, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(u) {
    setEditing(u)
    setForm({ user: u.user, password: '', rol: u.rol })
    setFormError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      if (editing) {
        const payload = { user: form.user, rol: form.rol }
        if (form.password) payload.password = form.password
        await api.put(`/api/users/${editing.id}`, payload)
      } else {
        await api.post('/api/users', form)
      }
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-leather-dark">Gestión de clientes</h1>
          <p className="text-sm text-leather-dark/60">Usuarios registrados en el sistema.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="border-b border-leather/10">
              <th className="th">Usuario</th>
              <th className="th">Rol</th>
              <th className="th text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-leather/5">
            {users?.map((u) => (
              <tr key={u.id}>
                <td className="td font-medium">{u.user}</td>
                <td className="td">
                  <span
                    className={`badge ${
                      u.rol === 'admin' ? 'bg-gold/20 text-leather-dark' : 'bg-denim/10 text-denim'
                    }`}
                  >
                    {u.rol}
                  </span>
                </td>
                <td className="td text-right">
                  <div className="inline-flex gap-1">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>
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
        <Modal title={editing ? 'Editar usuario' : 'Nuevo usuario'} onClose={() => setModalOpen(false)}>
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
              <label className="label">
                Contraseña {editing && <span className="font-normal text-leather-dark/40">(dejar vacío para no cambiarla)</span>}
              </label>
              <input
                type="password"
                className="input"
                required={!editing}
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
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
