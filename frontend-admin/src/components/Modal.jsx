import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-leather-dark/40 p-4">
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-xl bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-leather/10 px-5 py-4">
          <h3 className="font-serif text-lg font-semibold text-leather-dark">{title}</h3>
          <button className="btn-ghost rounded-md p-1" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
