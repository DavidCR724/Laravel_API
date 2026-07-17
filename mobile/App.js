import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/context/AuthContext'
import { CartProvider } from './src/context/CartContext'
import RootNavigator from './src/navigation/RootNavigator'
import { colors } from './src/theme'

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.cream, primary: colors.gold },
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
