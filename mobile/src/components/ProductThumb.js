import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '../theme'

// Sin imágenes en la API: generamos una miniatura tintada según el color del
// sombrero (característica "color") con un ícono de sombrero encima.
const COLOR_MAP = {
  negro: '#2B2B2B',
  café: '#6F4E37',
  cafe: '#6F4E37',
  marrón: '#7B4B2A',
  marron: '#7B4B2A',
  natural: '#E7D8B0',
  beige: '#E8DCC0',
  crema: '#F2E9D8',
  gris: '#8A8A8A',
  'azul marino': '#20364B',
  azul: '#2E4E6B',
  vino: '#6E2233',
  'verde oliva': '#5B6236',
  verde: '#4B7A4B',
  blanco: '#F3F1EC',
}

function tintFor(article) {
  const c = String(article?.caracteristicas?.color || '').toLowerCase().trim()
  return COLOR_MAP[c] || colors.leatherLight
}

export default function ProductThumb({ article, size = 88, rounded = radius.md }) {
  const tint = tintFor(article)
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        backgroundColor: tint + '33',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name="cube-outline" size={size * 0.42} color={tint} />
    </View>
  )
}
