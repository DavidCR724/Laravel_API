import { useState } from 'react'
import { Alert, ScrollView, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Badge, Button } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { colors, radius } from '../theme'

function Row({ icon, label, value }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
      <Ionicons name={icon} size={18} color={colors.gold} />
      <View>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
        <Text style={{ color: colors.leatherDark, fontWeight: '600' }}>{value || '—'}</Text>
      </View>
    </View>
  )
}

export default function AccountScreen({ navigation }) {
  const { user, isAuthenticated, logout, apiUrl, setApiUrl } = useAuth()
  const [url, setUrl] = useState(apiUrl)
  const [savedMsg, setSavedMsg] = useState('')

  async function saveUrl() {
    await setApiUrl(url)
    setSavedMsg('Dirección guardada. Vuelve a cargar el catálogo.')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {isAuthenticated ? (
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <View style={{ backgroundColor: colors.gold, borderRadius: radius.pill, padding: 12 }}>
              <Ionicons name="person" size={24} color={colors.leatherDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.leatherDark }}>
                {user?.nombre || user?.user}
              </Text>
              <Badge label={user?.rol || 'cliente'} tone="gold" />
            </View>
          </View>

          <Row icon="at-outline" label="Usuario" value={user?.user} />
          <Row icon="mail-outline" label="Correo" value={user?.correo} />
          <Row icon="call-outline" label="Teléfono" value={user?.telefono} />

          <View style={{ marginTop: 12, gap: 10 }}>
            <Button
              title="Mis pedidos"
              variant="dark"
              onPress={() => navigation.navigate('Orders')}
              icon={<Ionicons name="receipt-outline" size={18} color={colors.white} />}
            />
            <Button
              title="Cerrar sesión"
              variant="danger"
              onPress={() =>
                Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Salir', style: 'destructive', onPress: logout },
                ])
              }
              icon={<Ionicons name="log-out-outline" size={18} color={colors.white} />}
            />
          </View>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
          }}
        >
          <Ionicons name="person-circle-outline" size={54} color={colors.muted} />
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.leatherDark, marginTop: 8 }}>
            Estás como invitado
          </Text>
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
            Inicia sesión para comprar, ver tus pedidos y reseñar productos.
          </Text>
          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            <Button title="Iniciar sesión" onPress={() => navigation.navigate('Login')} />
            <Button title="Crear cuenta" variant="secondary" onPress={() => navigation.navigate('Register')} />
          </View>
        </View>
      )}

      {/* Configuración del servidor */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontWeight: '800', color: colors.leatherDark, marginBottom: 8 }}>Servidor de la API</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
          En un teléfono real usa la IP de la PC donde corre Laravel (no "localhost").
        </Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          placeholder="http://192.168.1.110:8000"
          placeholderTextColor={colors.muted}
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingHorizontal: 12,
            paddingVertical: 12,
            color: colors.leatherDark,
            marginBottom: 10,
          }}
        />
        <Button title="Guardar dirección" variant="secondary" onPress={saveUrl} />
        {savedMsg ? <Text style={{ color: colors.success, marginTop: 8 }}>{savedMsg}</Text> : null}
      </View>
    </ScrollView>
  )
}
