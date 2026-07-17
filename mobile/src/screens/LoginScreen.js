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

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      await login(identifier.trim(), password)
      navigation.goBack()
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 32 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ backgroundColor: colors.gold, borderRadius: radius.pill, padding: 16 }}>
            <Ionicons name="person" size={32} color={colors.leatherDark} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.leatherDark, marginTop: 12 }}>
            Iniciar sesión
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>Usa tu usuario o correo</Text>
        </View>

        <ErrorBox message={error} />

        <Field
          label="Usuario o correo"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="cliente o correo@ejemplo.mx"
        />
        <Field
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••"
        />

        <Button title="Entrar" onPress={handleLogin} loading={loading} />

        <View style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: colors.muted }}>¿No tienes cuenta?</Text>
          <Button
            title="Crear cuenta"
            variant="secondary"
            onPress={() => navigation.replace('Register')}
            style={{ marginTop: 8, alignSelf: 'stretch' }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
