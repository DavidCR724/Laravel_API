import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, RefreshControl, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import ProductCard from '../components/ProductCard'
import { Empty, ErrorBox, Loading } from '../components/UI'
import { useCart } from '../context/CartContext'
import { colors, radius } from '../theme'

export default function HomeScreen({ navigation }) {
  const { add } = useCart()
  const [articles, setArticles] = useState(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      const { data } = await api.get('/api/articles')
      setArticles(data.data || [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar el catálogo.')
      setArticles([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !articles) return articles || []
    return articles.filter((a) =>
      [a.nombre, a.descripcion, JSON.stringify(a.caracteristicas || {})]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [articles, query])

  async function handleAdd(article) {
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
        Alert.alert('Error', err.message || 'No se pudo agregar al carrito.')
      }
    }
  }

  if (!articles) return <Loading text="Cargando catálogo…" />

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Barra de búsqueda estilo marketplace */}
      <View style={{ backgroundColor: colors.gold, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 6 }}>
        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.pill,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            height: 42,
          }}
        >
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            placeholder="Buscar sombreros…"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, marginLeft: 8, color: colors.leatherDark }}
          />
          {query ? (
            <Ionicons name="close-circle" size={18} color={colors.muted} onPress={() => setQuery('')} />
          ) : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 10 }}>
            <ErrorBox message={error} />
            <Text style={{ fontSize: 13, color: colors.muted }}>
              {filtered.length} producto{filtered.length === 1 ? '' : 's'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            article={item}
            onPress={() => navigation.navigate('ProductDetail', { id: item.id, nombre: item.nombre })}
            onAdd={() => handleAdd(item)}
          />
        )}
        ListEmptyComponent={
          <Empty
            icon={<Ionicons name="cube-outline" size={40} color={colors.muted} />}
            title="Sin resultados"
            subtitle="Prueba con otra búsqueda."
          />
        }
      />
    </View>
  )
}
