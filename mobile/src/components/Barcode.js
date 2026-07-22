import { View, Text } from 'react-native'
import { colors } from '../theme'

// Código de barras SIMULADO (decorativo). Genera barras de ancho variable de
// forma determinista a partir de la referencia numérica, para dar el aspecto
// de un pago tipo OXXO Pay sin depender de ninguna librería externa.
function toBars(code) {
  const digits = String(code || '').replace(/\D/g, '') || '00000000'
  const bars = []
  for (let i = 0; i < digits.length; i++) {
    const d = Number(digits[i])
    bars.push({ w: 1 + (d % 4), black: true }) // barra negra
    bars.push({ w: 1 + ((d + 1) % 3), black: false }) // espacio
  }
  return bars
}

export default function Barcode({ value, unit = 3, height = 64 }) {
  const bars = toBars(value)
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          flexDirection: 'row',
          height,
          backgroundColor: colors.white,
          paddingHorizontal: 6,
          alignItems: 'stretch',
        }}
      >
        {bars.map((b, i) => (
          <View
            key={i}
            style={{ width: b.w * unit, backgroundColor: b.black ? '#111' : colors.white }}
          />
        ))}
      </View>
      <Text
        style={{
          marginTop: 6,
          letterSpacing: 3,
          fontSize: 14,
          fontWeight: '700',
          color: colors.leatherDark,
        }}
      >
        {String(value || '').replace(/\D/g, '')}
      </Text>
    </View>
  )
}
