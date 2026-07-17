import { useCallback, useEffect, useState } from 'react'
import { Alert, ScrollView, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ProductThumb from '../components/ProductThumb'
import StarRating from '../components/StarRating'
import { Badge, Button, ErrorBox, Loading } from '../components/UI'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { colors, money, radius } from '../theme'

export default function ProductDetailScreen({ route, navigation }) {
  const { id } = route.params
  const { isAuthenticated } = useAuth()
  const { add } = useCart()

  const [article, setArticle] = useState(null)
  const [reviews, setReviews] = useState([])
  const [error, setError] = useState('')

  const [calif, setCalif] = useState(5)
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const [a, r] = await Promise.all([
        api.get(`/api/articles/${id}`),
        api.get(`/api/articles/${id}/reviews`),
      ])
      setArticle(a.data.data)
      setReviews(r.data.data || [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar el producto.')
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const promedio = reviews.length
    ? reviews.reduce((s, r) => s + Number(r.calificacion || 0), 0) / reviews.length
    : 0

  async function handleAdd() {
    try {
      await add(article.id)
      Alert.alert('Agregado', `"${article.nombre}" se agregó a tu carrito.`)
    } catch (err) {
      if (String(err.message).includes('Inicia sesión')) {
        Alert.alert('Inicia sesión', err.message, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') },
        ])
      } else {
        Alert.alert('Error', err.message)
      }
    }
  }

  async function enviarResena() {
    if (!texto.trim()) {
      Alert.alert('Falta la reseña', 'Escribe tu opinión antes de enviar.')
      return
    }
    setSending(true)
    try {
      await api.post('/api/reviews', { article_id: article.id, calificacion: calif, descripcion: texto.trim() })
      setTexto('')
      setCalif(5)
      Alert.alert('¡Gracias!', 'Tu reseña se publicó correctamente.')
      load()
    } catch (err) {
      Alert.alert('No se pudo publicar', err.message || 'Solo puedes reseñar productos que has comprado.')
    } finally {
      setSending(false)
    }
  }

  if (!article) {
    return error ? (
      <View style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
        <ErrorBox message={error} />
      </View>
    ) : (
      <Loading />
    )
  }

  const car = article.caracteristicas || {}

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <ProductThumb article={article} size={180} rounded={radius.xl} />
      </View>

      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.leatherDark }}>{article.nombre}</Text>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.denim, marginTop: 4 }}>{money(article.costo)}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <StarRating value={promedio} />
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          {reviews.length ? `${promedio.toFixed(1)} · ${reviews.length} reseña(s)` : 'Sin reseñas aún'}
        </Text>
      </View>

      <Text style={{ marginTop: 12, color: colors.leather, lineHeight: 20 }}>{article.descripcion}</Text>

      {/* Características */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {Object.entries(car).map(([k, v]) => (
          <Badge key={k} label={`${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`} />
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <Button title="Agregar al carrito" onPress={handleAdd} icon={<Ionicons name="cart" size={18} color={colors.leatherDark} />} />
      </View>

      {/* Reseñas */}
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.leatherDark, marginTop: 24, marginBottom: 8 }}>
        Reseñas
      </Text>

      {reviews.length === 0 && <Text style={{ color: colors.muted }}>Este producto todavía no tiene reseñas.</Text>}

      {reviews.map((r) => (
        <View
          key={r.id}
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.md,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '700', color: colors.leatherDark }}>{r.user?.user || 'Cliente'}</Text>
            <StarRating value={r.calificacion} size={14} />
          </View>
          <Text style={{ color: colors.leather, marginTop: 4 }}>{r.descripcion}</Text>
        </View>
      ))}

      {/* Formulario de reseña (solo autenticados) */}
      {isAuthenticated ? (
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.md,
            padding: 14,
            marginTop: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontWeight: '700', color: colors.leatherDark, marginBottom: 8 }}>Escribe una reseña</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
            Solo puedes reseñar productos que has comprado.
          </Text>
          <StarRating value={calif} size={28} onChange={setCalif} />
          <TextInput
            placeholder="¿Qué te pareció el producto?"
            placeholderTextColor={colors.muted}
            value={texto}
            onChangeText={setTexto}
            multiline
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: 10,
              minHeight: 70,
              marginTop: 10,
              marginBottom: 10,
              color: colors.leatherDark,
              textAlignVertical: 'top',
            }}
          />
          <Button title="Publicar reseña" variant="dark" onPress={enviarResena} loading={sending} />
        </View>
      ) : (
        <View style={{ marginTop: 12 }}>
          <Button
            title="Inicia sesión para reseñar"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      )}
    </ScrollView>
  )
}
