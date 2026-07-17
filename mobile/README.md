# Sombrerería — App móvil (React Native + Expo)

App del **lado del cliente** para la tienda de sombreros. Consume la misma API
Laravel que el panel de administración.

## Funciones

- **Invitado** (sin registrarse): explora el catálogo y lee las reseñas de cada
  producto.
- **Cliente** (login con usuario **o correo** + contraseña):
  - Agregar productos al carrito y **finalizar la compra**.
  - Ver el historial de sus **pedidos**.
  - **Reseñar** productos que ha comprado (calificación + comentario).
- **IA (Gemini)**:
  - **Recomendaciones** en el carrito, que se recalculan conforme agregas
    productos (endpoint `GET /api/ai/recommendations`).
  - **Chatbot** ("Asistente IA") para dudas y recomendaciones por chat
    (endpoint `POST /api/ai/chat`).

## Requisitos

- **Node.js 18+** y **npm**.
- La app **Expo Go** en tu teléfono (Android/iOS), o un emulador.
- El **backend Laravel corriendo** y accesible en la red:
  ```bash
  php artisan serve --host=0.0.0.0 --port=8000
  ```
  El `--host=0.0.0.0` es importante para que el teléfono pueda alcanzarlo.

## Instalación y ejecución

```bash
cd mobile
npm install
npx expo start
```

Se abrirá un QR: escanéalo con **Expo Go** (Android) o la cámara (iOS).

### Configurar la dirección de la API (IMPORTANTE)

El teléfono **no** puede usar `localhost` (eso apunta al propio teléfono). Debes
usar la **IP de la PC** donde corre Laravel, en la misma red Wi-Fi. Por ejemplo
`http://192.168.1.110:8000`.

1. Averigua la IP de tu PC (`ipconfig` en Windows → "Dirección IPv4").
2. Abre la app → pestaña **Cuenta** → campo **Servidor de la API** → escribe
   `http://TU_IP:8000` → **Guardar dirección**.
3. Vuelve a **Inicio** y desliza para recargar.

> El valor por defecto está en `src/config.js` (`DEFAULT_API_URL`); puedes
> cambiarlo ahí para no configurarlo cada vez.

## Usuarios de prueba (del seeder)

| Usuario / correo | Contraseña |
|---|---|
| `cliente` o `cliente@sombreria.mx` | `cliente123` |
| `cliente1` … `cliente10` | `password` |

## Estructura

```
mobile/
├─ App.js                     # Providers + navegación
├─ src/
│  ├─ config.js               # URL por defecto de la API
│  ├─ theme.js                # Paleta (igual que el panel admin)
│  ├─ api/client.js           # Axios con baseURL + token desde AsyncStorage
│  ├─ context/
│  │  ├─ AuthContext.js       # Sesión (login/registro/invitado)
│  │  └─ CartContext.js       # Carrito en el servidor + checkout
│  ├─ navigation/RootNavigator.js
│  ├─ components/             # ProductCard, StarRating, UI, ProductThumb
│  └─ screens/                # Home, ProductDetail, Cart, Chat, Account, Login, Register, Orders
```
