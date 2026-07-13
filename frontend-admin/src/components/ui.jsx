// Pequeños componentes de UI reutilizables.

export function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      {label}
    </div>
  )
}

export function Alert({ type = 'info', children, onClose }) {
  if (!children) return null
  const styles = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  }
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-2 text-sm ${
        styles[type] || styles.info
      }`}
    >
      <span>{children}</span>
      {onClose && (
        <button className="opacity-60 hover:opacity-100" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      )}
    </div>
  )
}

export function StatCard({ label, value, hint, accent = 'indigo' }) {
  const accents = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    slate: 'text-slate-700',
  }
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accents[accent] || accents.indigo}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
