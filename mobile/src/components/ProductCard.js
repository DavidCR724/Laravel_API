import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, money, radius } from '../theme'
import ProductThumb from './ProductThumb'

// Tarjeta estilo marketplace: miniatura + info + precio + botón agregar.
export default function ProductCard({ article, onPress, onAdd }) {
  const car = article.caracteristicas || {}
  const sinStock = Number(article.stock) <= 0

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <ProductThumb article={article} />

      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Text numberOfLines={2} style={{ fontSize: 15, fontWeight: '600', color: colors.leatherDark }}>
            {article.nombre}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
            {[car.material, car.color, car.talla ? `Talla ${car.talla}` : null].filter(Boolean).join(' · ')}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.denim }}>{money(article.costo)}</Text>
          {onAdd && (
            <Pressable
              onPress={sinStock ? undefined : onAdd}
              hitSlop={6}
              style={{
                backgroundColor: sinStock ? colors.border : colors.gold,
                borderRadius: radius.pill,
                padding: 8,
              }}
            >
              <Ionicons name="cart" size={18} color={sinStock ? colors.muted : colors.leatherDark} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  )
}
