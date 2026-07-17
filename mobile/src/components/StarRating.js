import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme'

// Muestra 5 estrellas. Si se pasa onChange, es interactivo (para calificar).
export default function StarRating({ value = 0, size = 16, onChange }) {
  const stars = [1, 2, 3, 4, 5]
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {stars.map((i) => {
        const name = i <= Math.round(value) ? 'star' : 'star-outline'
        const star = <Ionicons name={name} size={size} color={colors.gold} />
        if (!onChange) return <View key={i}>{star}</View>
        return (
          <Pressable key={i} onPress={() => onChange(i)} hitSlop={6}>
            {star}
          </Pressable>
        )
      })}
    </View>
  )
}
