import { useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles, User as UserIcon } from 'lucide-react'
import api from '../api/client'

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text:
        'Hola, soy el asistente de Sombrerería. Pregúntame sobre carritos, ventas o métricas de la tienda.',
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const history = messages.map((m) => ({ role: m.role, text: m.text }))
    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    setSending(true)
    setError('')

    try {
      const { data } = await api.post('/api/ai/chat', { message: text, history })
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }])
    } catch (err) {
      setError(err.message || 'No se pudo contactar al asistente de IA.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="text-gold-dark" size={22} />
        <div>
          <h1 className="font-serif text-2xl font-bold text-leather-dark">Asistente IA</h1>
          <p className="text-sm text-leather-dark/60">Consulta sobre carritos, ventas y métricas (Gemini).</p>
        </div>
      </div>

      <div className="card flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role !== 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-denim text-white">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-gold text-leather-dark'
                    : 'bg-cream text-leather-dark border border-leather/10'
                }`}
              >
                {m.text}
              </div>
              {m.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leather text-white">
                  <UserIcon size={16} />
                </div>
              )}
            </div>
          ))}
          {sending && <p className="text-xs text-leather-dark/40">El asistente está escribiendo…</p>}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-4 mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 border-t border-leather/10 p-3">
          <input
            className="input"
            placeholder="Escribe tu pregunta…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
