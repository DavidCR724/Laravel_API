import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import HomeScreen from '../screens/HomeScreen'
import ProductDetailScreen from '../screens/ProductDetailScreen'
import CartScreen from '../screens/CartScreen'
import ChatScreen from '../screens/ChatScreen'
import AccountScreen from '../screens/AccountScreen'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import OrdersScreen from '../screens/OrdersScreen'
import PaymentScreen from '../screens/PaymentScreen'
import { useCart } from '../context/CartContext'
import { colors } from '../theme'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const headerStyle = {
  headerStyle: { backgroundColor: colors.gold },
  headerTintColor: colors.leatherDark,
  headerTitleStyle: { fontWeight: '800' },
}

const ICONS = {
  Inicio: 'home',
  Carrito: 'cart',
  Asistente: 'chatbubbles',
  Cuenta: 'person',
}

function Tabs() {
  const { count } = useCart()
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerStyle,
        tabBarActiveTintColor: colors.goldDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Sombrerería' }} />
      <Tab.Screen
        name="Carrito"
        component={CartScreen}
        options={{ tabBarBadge: count > 0 ? count : undefined }}
      />
      <Tab.Screen name="Asistente" component={ChatScreen} options={{ title: 'Asistente IA' }} />
      <Tab.Screen name="Cuenta" component={AccountScreen} />
    </Tab.Navigator>
  )
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ route }) => ({ title: route.params?.nombre || 'Producto' })}
      />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar sesión' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
      <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Mis pedidos' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Pago' }} />
    </Stack.Navigator>
  )
}
