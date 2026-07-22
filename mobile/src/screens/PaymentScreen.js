import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Barcode from '../components/Barcode'
import { Button, ErrorBox } from '../components/UI'
import { useCart } from '../context/CartContext'
import { colors, money, radius } from '../theme'

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>{label}</Text>
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

function MethodOption({ icon, title, subtitle, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: 14,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: selected ? colors.gold : colors.border,
      }}
    >
      <Ionicons name={icon} size={24} color={selected ? colors.goldDark : colors.muted} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', color: colors.leatherDark }}>{title}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{subtitle}</Text>
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? colors.goldDark : colors.muted}
      />
    </Pressable>
  )
}

export default function PaymentScreen({ navigation }) {
  const { total, count, checkout, pay } = useCart()

  const [step, setStep] = useState('method') // method | card | cash | done
  const [metodo, setMetodo] = useState('tarjeta')
  const [order, setOrder] = useState(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  // Datos de tarjeta (SIMULADOS: no se envían ni se guardan en el servidor).
  const [card, setCard] = useState({ numero: '', titular: '', vence: '', cvv: '' })

  const orderTotal = order ? Number(order.total) : total

  // Paso 1: genera el pedido con la forma de pago elegida.
  async function handleContinue() {
    if (count === 0) {
      Alert.alert('Carrito vacío', 'Agrega productos antes de pagar.')
      return
    }
    setWorking(true)
    setError('')
    try {
      const created = await checkout(metodo)
      setOrder(created)
      setStep(metodo === 'tarjeta' ? 'card' : 'cash')
    } catch (err) {
      setError(err.message || 'No se pudo generar el pedido.')
    } finally {
      setWorking(false)
    }
  }

  // Paso 2: confirma el pago (simulado) del pedido ya generado.
  async function handlePay() {
    if (metodo === 'tarjeta') {
      const digits = card.numero.replace(/\D/g, '')
      if (digits.length < 15 || !card.titular.trim() || card.vence.length < 4 || card.cvv.length < 3) {
        setError('Completa los datos de la tarjeta (simulados).')
        return
      }
    }
    setWorking(true)
    setError('')
    try {
      await pay(order.id)
      setStep('done')
    } catch (err) {
      setError(err.message || 'No se pudo confirmar el pago.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Resumen del importe */}
      <View
        style={{
          backgroundColor: colors.denim,
          borderRadius: radius.lg,
          padding: 16,
          marginBottom: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.white, opacity: 0.85 }}>Total a pagar</Text>
        <Text style={{ color: colors.white, fontSize: 24, fontWeight: '800' }}>{money(orderTotal)}</Text>
      </View>

      <ErrorBox message={error} />

      {/* Paso 1: elegir forma de pago */}
      {step === 'method' && (
        <>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.leatherDark, marginBottom: 12 }}>
            Elige tu forma de pago
          </Text>
          <MethodOption
            icon="card"
            title="Tarjeta de crédito / débito"
            subtitle="Pago inmediato (simulado)"
            selected={metodo === 'tarjeta'}
            onPress={() => setMetodo('tarjeta')}
          />
          <MethodOption
            icon="barcode"
            title="Efectivo en tienda"
            subtitle="Genera un código de barras tipo OXXO Pay"
            selected={metodo === 'efectivo'}
            onPress={() => setMetodo('efectivo')}
          />
          <View style={{ marginTop: 8 }}>
            <Button title="Continuar" onPress={handleContinue} loading={working} />
          </View>
        </>
      )}

      {/* Paso 2a: pago con tarjeta (simulado) */}
      {step === 'card' && (
        <>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.leatherDark, marginBottom: 4 }}>
            Datos de la tarjeta
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 14 }}>
            Pago simulado: no ingreses una tarjeta real.
          </Text>
          <Field
            label="Número de tarjeta"
            value={card.numero}
            onChangeText={(v) => setCard({ ...card, numero: v })}
            keyboardType="number-pad"
            maxLength={19}
            placeholder="4111 1111 1111 1111"
          />
          <Field
            label="Titular"
            value={card.titular}
            onChangeText={(v) => setCard({ ...card, titular: v })}
            autoCapitalize="characters"
            placeholder="COMO APARECE EN LA TARJETA"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Vence (MM/AA)"
                value={card.vence}
                onChangeText={(v) => setCard({ ...card, vence: v })}
                keyboardType="number-pad"
                maxLength={5}
                placeholder="12/28"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="CVV"
                value={card.cvv}
                onChangeText={(v) => setCard({ ...card, cvv: v })}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                placeholder="123"
              />
            </View>
          </View>
          <View style={{ marginTop: 8 }}>
            <Button title={`Pagar ${money(orderTotal)}`} onPress={handlePay} loading={working} icon={<Ionicons name="lock-closed" size={18} color={colors.leatherDark} />} />
          </View>
        </>
      )}

      {/* Paso 2b: pago en efectivo (código de barras tipo OXXO Pay) */}
      {step === 'cash' && (
        <>
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.leatherDark, marginBottom: 2 }}>
              Ficha de pago en efectivo
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 14, textAlign: 'center' }}>
              Muestra este código de barras en la caja de la tienda para pagar tu pedido #{order?.id}.
            </Text>
            <Barcode value={order?.referencia_pago} />
            <View style={{ marginTop: 14, alignItems: 'center' }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>Monto</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.leatherDark }}>{money(orderTotal)}</Text>
            </View>
          </View>

          <Text style={{ color: colors.muted, fontSize: 12, marginVertical: 14, textAlign: 'center' }}>
            Tu pedido quedó como “Pendiente de pago”. Cuando pagues en tienda se marcará como pagado.
          </Text>

          {/* Botón para SIMULAR que el cliente ya pagó en la tienda. */}
          <Button
            title="Ya pagué (simular)"
            onPress={handlePay}
            loading={working}
            icon={<Ionicons name="checkmark-circle" size={18} color={colors.leatherDark} />}
          />
          <View style={{ marginTop: 10 }}>
            <Button
              title="Pagar después"
              variant="secondary"
              onPress={() => navigation.navigate('Orders')}
            />
          </View>
        </>
      )}

      {/* Paso 3: confirmación */}
      {step === 'done' && (
        <View style={{ alignItems: 'center', paddingTop: 20 }}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.leatherDark, marginTop: 10 }}>
            ¡Pago confirmado!
          </Text>
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 20 }}>
            Tu pedido #{order?.id} quedó como “Pagado”. Podrás seguir su envío desde “Mis pedidos”.
          </Text>
          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            <Button title="Ver mis pedidos" variant="dark" onPress={() => navigation.replace('Orders')} />
            <Button title="Seguir comprando" variant="secondary" onPress={() => navigation.popToTop()} />
          </View>
        </View>
      )}
    </ScrollView>
  )
}
