import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Button, ErrorBox } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { colors, radius } from '../theme'

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.leather, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={{
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: 12,
          paddingVertical: 12,
          color: colors.leatherDark,
        }}
        {...props}
      />
    </View>
  )
}

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth()
  const [form, setForm] = useState({ user: '', nombre: '', correo: '', telefono: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  async function handleRegister() {
    setError('')
    setLoading(true)
    try {
      await register({
        user: form.user.trim(),
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        telefono: form.telefono.trim() || null,
        password: form.password,
      })
      navigation.goBack()
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={{ backgroundColor: colors.gold, borderRadius: radius.pill, padding: 16 }}>
            <Ionicons name="person-add" size={30} color={colors.leatherDark} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.leatherDark, marginTop: 12 }}>Crear cuenta</Text>
        </View>

        <ErrorBox message={error} />

        <Field label="Nombre completo" value={form.nombre} onChangeText={set('nombre')} placeholder="Tu nombre" />
        <Field label="Usuario" value={form.user} onChangeText={set('user')} autoCapitalize="none" placeholder="usuario" />
        <Field
          label="Correo"
          value={form.correo}
          onChangeText={set('correo')}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="correo@ejemplo.mx"
        />
        <Field label="Teléfono (opcional)" value={form.telefono} onChangeText={set('telefono')} keyboardType="phone-pad" placeholder="951..." />
        <Field label="Contraseña" value={form.password} onChangeText={set('password')} secureTextEntry placeholder="mínimo 6 caracteres" />

        <Button title="Registrarme" onPress={handleRegister} loading={loading} />

        <View style={{ marginTop: 16 }}>
          <Button title="Ya tengo cuenta" variant="secondary" onPress={() => navigation.replace('Login')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
