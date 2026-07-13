# Panel de Administración — Sombrerería (Sprint 3)

Dashboard web en **React + Vite + Tailwind CSS** para administrar la API e-commerce
de sombreros. Consume la API de Laravel con autenticación **Sanctum** (token Bearer).

## Requisitos

- Node.js 18+ y npm
- La API de Laravel corriendo (por defecto en `http://localhost:8000`)

## Puesta en marcha

```bash
cd frontend-admin
npm install
npm run dev
```

Se abre en **http://localhost:5174** (puerto propio para no chocar con el front de
clientes, que usa el 8000).

En la pantalla de login puedes ajustar la **Dirección de la API** si Laravel corre en
otra URL/puerto. Credenciales de ejemplo del seeder: **admin / admin123**.

> Solo pueden entrar cuentas con rol `admin`. Si inicias sesión con un cliente, se
> rechaza el acceso.

## Qué incluye

- **Autenticación Sanctum**: login que guarda el token Bearer en `localStorage`.
  El cliente HTTP (`src/api/client.js`) actúa como *interceptor*: adjunta el header
  `Authorization: Bearer <token>` en cada petición y, ante un **401** (token expirado,
  duran 5 min), cierra la sesión y redirige al login.
- **Rutas protegidas** (solo admin) con React Router:
  - **Dashboard**: métricas de catálogo, inventario y usuarios (artículos, unidades en
    stock, valor de inventario, precio promedio, stock bajo, distribución de roles).
  - **Gestión de Artículos**: tabla con CRUD completo + **formulario dinámico** para las
    `caracteristicas` (JSON) del sombrero + ajuste rápido de stock (usa el endpoint
    `PATCH /api/articles/{id}/stock`).
  - **Gestión de Usuarios**: tabla con CRUD de cuentas y rol.

## Estructura

```
src/
  api/client.js            Cliente fetch con interceptor (Bearer + manejo de 401)
  auth/AuthContext.jsx     Estado de sesión (login/logout, token, URL de API)
  components/              Layout, ProtectedRoute, Modal, editor de caracteristicas, UI
  pages/                   Login, Dashboard, Articles, Users
```

## Notas

- Las métricas de **ventas/ingresos** requieren un endpoint de administrador para
  `purchases` (hoy están limitadas al rol cliente en la API). El resto de métricas se
  calculan desde `GET /api/articles` y `GET /api/users`.
- Tailwind está fijado a la v3 (`tailwind.config.js` + `postcss.config.js`) para un
  setup estable.
