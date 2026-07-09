import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '../api'

// Panel del ADMIN: CRUD de productos y de usuarios (de forma básica).
export default function AdminPanel({ baseUrl, token, notify, onAuthError }) {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ nombre: '', descripcion: '', costo: '' })
  const [editingId, setEditingId] = useState(null)

  const [users, setUsers] = useState([])
  const [userForm, setUserForm] = useState({ user: '', password: '', rol: 'cliente' })

  const loadProducts = useCallback(async () => {
    try {
      const p = await apiRequest(baseUrl, '/api/articles', { token })
      setProducts(p.data || [])
    } catch (err) {
      notify(err.message, 'error')
    }
  }, [baseUrl, token, notify])

  const loadUsers = useCallback(async () => {
    try {
      const u = await apiRequest(baseUrl, '/api/users', { token })
      setUsers(u.data || [])
    } catch (err) {
      onAuthError(err)
      notify(`Usuarios: ${err.message}`, 'error')
    }
  }, [baseUrl, token, notify, onAuthError])

  useEffect(() => {
    loadProducts()
    loadUsers()
  }, [loadProducts, loadUsers])

  // ------------------------------- Productos --------------------------------
  async function saveProduct(e) {
    e.preventDefault()
    const body = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      costo: Number(form.costo),
    }
    try {
      if (editingId) {
        await apiRequest(baseUrl, `/api/articles/${editingId}`, { method: 'PUT', token, body })
        notify('Producto actualizado.', 'ok')
      } else {
        await apiRequest(baseUrl, '/api/articles', { method: 'POST', token, body })
        notify('Producto creado.', 'ok')
      }
      setForm({ nombre: '', descripcion: '', costo: '' })
      setEditingId(null)
      loadProducts()
    } catch (err) {
      onAuthError(err)
      notify(err.message, 'error')
    }
  }

  function editProduct(p) {
    setEditingId(p.id)
    setForm({ nombre: p.nombre, descripcion: p.descripcion, costo: p.costo })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ nombre: '', descripcion: '', costo: '' })
  }

  async function deleteProduct(id) {
    try {
      await apiRequest(baseUrl, `/api/articles/${id}`, { method: 'DELETE', token })
      notify('Producto borrado.', 'ok')
      loadProducts()
    } catch (err) {
      onAuthError(err)
      notify(err.message, 'error')
    }
  }

  // -------------------------------- Usuarios --------------------------------
  async function createUser(e) {
    e.preventDefault()
    try {
      await apiRequest(baseUrl, '/api/users', { method: 'POST', token, body: userForm })
      notify('Usuario creado.', 'ok')
      setUserForm({ user: '', password: '', rol: 'cliente' })
      loadUsers()
    } catch (err) {
      onAuthError(err)
      notify(err.message, 'error')
    }
  }

  async function deleteUser(id) {
    try {
      await apiRequest(baseUrl, `/api/users/${id}`, { method: 'DELETE', token })
      notify('Usuario borrado.', 'ok')
      loadUsers()
    } catch (err) {
      onAuthError(err)
      notify(err.message, 'error')
    }
  }

  return (
    <section className="panel admin">
      <h2>Administración (admin)</h2>

      <h3>Productos</h3>
      <form className="card" onSubmit={saveProduct}>
        <strong>{editingId ? `Editar producto #${editingId}` : 'Nuevo producto'}</strong>
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />
        <input
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
        />
        <input
          placeholder="Costo"
          type="number"
          step="0.01"
          value={form.costo}
          onChange={(e) => setForm({ ...form, costo: e.target.value })}
        />
        <div className="row">
          <button>{editingId ? 'Guardar cambios' : 'Crear'}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={cancelEdit}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <ul className="list">
        {products.map((p) => (
          <li key={p.id} className="card">
            <div className="row between">
              <span>
                <strong>{p.nombre}</strong> — ${p.costo}
              </span>
              <span className="row">
                <button className="secondary" onClick={() => editProduct(p)}>
                  Editar
                </button>
                <button className="danger" onClick={() => deleteProduct(p.id)}>
                  Borrar
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <h3>Usuarios</h3>
      <form className="card" onSubmit={createUser}>
        <strong>Nuevo usuario</strong>
        <input
          placeholder="Usuario"
          value={userForm.user}
          onChange={(e) => setUserForm({ ...userForm, user: e.target.value })}
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={userForm.password}
          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
        />
        <select
          value={userForm.rol}
          onChange={(e) => setUserForm({ ...userForm, rol: e.target.value })}
        >
          <option value="cliente">cliente</option>
          <option value="admin">admin</option>
        </select>
        <button>Crear usuario</button>
      </form>

      <ul className="list">
        {users.map((u) => (
          <li key={u.id} className="card row between">
            <span>
              #{u.id} <strong>{u.user}</strong> <span className="badge">{u.rol}</span>
            </span>
            <button className="danger" onClick={() => deleteUser(u.id)}>
              Borrar
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
