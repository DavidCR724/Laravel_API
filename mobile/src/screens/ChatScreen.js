import { useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import { colors, radius } from '../theme'

const WELCOME = {
  role: 'model',
  text: '¡Hola! Soy el asistente de la Sombrerería. Pregúntame por estilos, materiales, tallas o pídeme una recomendación. 🎩',
}

function Bubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <View
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        backgroundColor: isUser ? colors.denim : colors.white,
        borderRadius: radius.lg,
        borderTopRightRadius: isUser ? 4 : radius.lg,
        borderTopLeftRadius: isUser ? radius.lg : 4,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 10,
        maxWidth: '82%',
        borderWidth: isUser ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: isUser ? colors.white : colors.leatherDark, lineHeight: 20 }}>{text}</Text>
    </View>
  )
}

export default function ChatScreen() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    const nextMessages = [...messages, { role: 'user', text }]
    setMessages(nextMessages)
    setSending(true)

    // Historial para el backend (sin el mensaje de bienvenida local).
    const history = messages
      .filter((m) => m !== WELCOME)
      .map((m) => ({ role: m.role, text: m.text }))

    try {
      const { data } = await api.post('/api/ai/chat', { message: text, history })
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: '⚠️ ' + (err.message || 'No pude responder en este momento.') },
      ])
    } finally {
      setSending(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.text} />
        ))}
        {sending && <Bubble role="model" text="Escribiendo…" />}
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 10,
          gap: 8,
          borderTopWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.white,
        }}
      >
        <TextInput
          placeholder="Escribe tu mensaje…"
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          style={{
            flex: 1,
            backgroundColor: colors.cream,
            borderRadius: radius.pill,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: colors.leatherDark,
          }}
        />
        <Pressable
          onPress={send}
          disabled={sending}
          style={{ backgroundColor: colors.gold, borderRadius: radius.pill, padding: 12, opacity: sending ? 0.6 : 1 }}
        >
          <Ionicons name="send" size={18} color={colors.leatherDark} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
