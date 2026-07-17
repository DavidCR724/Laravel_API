import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { colors, radius } from '../theme'

export function Button({ title, onPress, variant = 'primary', disabled, loading, icon, style }) {
  const bg =
    variant === 'primary'
      ? colors.gold
      : variant === 'dark'
      ? colors.denim
      : variant === 'danger'
      ? colors.danger
      : colors.white
  const fg = variant === 'secondary' ? colors.leatherDark : variant === 'primary' ? colors.leatherDark : colors.white
  const border = variant === 'secondary' ? { borderWidth: 1, borderColor: colors.border } : null

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        border,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{title}</Text>
        </>
      )}
    </Pressable>
  )
}

export function Badge({ label, tone = 'neutral' }) {
  const map = {
    neutral: [colors.denim + '18', colors.denim],
    gold: [colors.gold + '30', colors.leatherDark],
    success: [colors.successBg, colors.success],
    warning: [colors.warningBg, colors.warning],
    danger: [colors.dangerBg, colors.danger],
  }
  const [bg, fg] = map[tone] || map.neutral
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '600' }}>{label}</Text>
    </View>
  )
}

export function Loading({ text = 'Cargando…' }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ActivityIndicator color={colors.gold} size="large" />
      <Text style={{ color: colors.muted, marginTop: 10 }}>{text}</Text>
    </View>
  )
}

export function ErrorBox({ message }) {
  if (!message) return null
  return (
    <View
      style={{
        backgroundColor: colors.dangerBg,
        borderRadius: radius.md,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <Text style={{ color: colors.danger, fontSize: 13 }}>{message}</Text>
    </View>
  )
}

export function Empty({ icon, title, subtitle }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 }}>
      {icon}
      <Text style={{ color: colors.leatherDark, fontWeight: '700', fontSize: 16 }}>{title}</Text>
      {subtitle ? <Text style={{ color: colors.muted, textAlign: 'center' }}>{subtitle}</Text> : null}
    </View>
  )
}
