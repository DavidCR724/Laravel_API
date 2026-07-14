import { useState } from 'react'
import { Plus, X } from 'lucide-react'

// Atributos típicos de un sombrero, como accesos rápidos.
const SUGGESTED = ['talla', 'color', 'material', 'estilo_ala']

function toRows(obj) {
  if (!obj || typeof obj !== 'object') return []
  return Object.keys(obj).map((k) => {
    const v = obj[k]
    const value = v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v)
    return { key: k, value }
  })
}

function rowsToObject(rows) {
  const out = {}
  rows.forEach(({ key, value }) => {
    const k = key.trim()
    if (!k) return
    const t = value.trim()
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        out[k] = JSON.parse(t)
        return
      } catch {
        // si no es JSON válido, se guarda como texto plano
      }
    }
    out[k] = value
  })
  return out
}

// Formulario dinámico para "caracteristicas" (columna JSONB de Article).
// Emite el objeto resultante vía onChange cada vez que cambia.
export default function CaracteristicasEditor({ initialValue, onChange }) {
  const [rows, setRows] = useState(() => toRows(initialValue))

  function update(next) {
    setRows(next)
    onChange(rowsToObject(next))
  }

  const usedKeys = rows.map((r) => r.key)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label mb-0">Características (atributos dinámicos)</span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => update([...rows, { key: '', value: '' }])}
        >
          <Plus size={14} /> Agregar
        </button>
      </div>

      {rows.length === 0 && (
        <p className="mb-2 text-xs text-leather-dark/50">
          Sin características. Agrega atributos como talla, color, material o estilo de ala.
        </p>
      )}

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="input"
              placeholder="atributo (ej. talla)"
              value={row.key}
              onChange={(e) =>
                update(rows.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)))
              }
            />
            <input
              className="input"
              placeholder="valor (ej. M)"
              value={row.value}
              onChange={(e) =>
                update(rows.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))
              }
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm text-rose-600"
              onClick={() => update(rows.filter((_, idx) => idx !== i))}
              aria-label="Quitar característica"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {SUGGESTED.filter((k) => !usedKeys.includes(k)).map((k) => (
          <button
            key={k}
            type="button"
            className="badge bg-denim/10 text-denim hover:bg-denim/20"
            onClick={() => update([...rows, { key: k, value: '' }])}
          >
            + {k}
          </button>
        ))}
      </div>
    </div>
  )
}
