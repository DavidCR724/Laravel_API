# Documentación del proyecto — API RESTful de e‑commerce (Laravel 8 + React)

Este documento explica el proyecto de punta a punta, para poder entenderlo de
forma holística: desde que llega una petición HTTP hasta que el navegador pinta
la respuesta. Está pensada para leerse de arriba hacia abajo, pero cada sección
se puede consultar por separado.

> **Resumen en una frase:** es una API REST hecha en **Laravel 8 + PostgreSQL
> (Eloquent)**, protegida con **tokens Bearer de Sanctum** y **roles**
> (admin / cliente / invitado), con integración de **IA (Google Gemini)** para
> búsqueda semántica, recomendaciones y chatbot, consumida por un **panel de
> administración en React + Vite + Tailwind** (`frontend-admin/`) que vive en
> otro origen y se comunica gracias a **CORS**.

---

## 1. Visión general de la arquitectura

Hay **dos (o más) aplicaciones independientes** que se comunican por HTTP, y
pueden vivir en máquinas distintas (ver `levantamiento.md` e `instructions.md`
para escenarios multi‑máquina):

```
┌────────────────────────────────┐   HTTP + JSON   ┌────────────────────────────┐
│ frontend-admin (React + Vite)  │ ──────────────▶ │   BACKEND (Laravel 8 API)   │
│ http://localhost:5174           │ ◀────────────── │   php artisan serve :8000    │
│ (panel exclusivo de admin)      │ Authorization:   │   (Windows / Ubuntu / VM)   │
└────────────────────────────────┘   Bearer …       └──────────────┬──────────────┘
                                                                    │  Eloquent (ORM)
                                        ┌───────────────────────────┼───────────────────────────┐
                                        ▼                                                       ▼
                              ┌────────────────────────┐                          ┌───────────────────────────┐
                              │   PostgreSQL (base de   │                          │  Google Gemini API         │
                              │   datos relacional)     │                          │  (búsqueda, recomendación, │
                              └────────────────────────┘                          │  chatbot — vía GeminiService)│
                                                                                   └───────────────────────────┘
```

- El **frontend** (`frontend-admin/`) no tiene lógica de negocio: solo dibuja
  pantallas y llama a la API con `axios`. Guarda el **token** en `localStorage`
  y es de **acceso exclusivo para el rol `admin`** (cualquier otro rol es
  rechazado y su token revocado en el propio login, ver §14).
- El **backend** contiene toda la lógica: rutas, autenticación, permisos,
  validación, acceso a datos, reglas de negocio (recalcular totales, checkout…)
  y la integración con IA.
- La **base de datos** guarda usuarios, productos (con atributos dinámicos en
  JSONB), carritos, compras y reseñas.
- La **IA (Google Gemini)** se usa para tres funciones opcionales: búsqueda
  semántica del catálogo, recomendaciones personalizadas y un chatbot de
  atención al cliente (ver §9.7 y §14).

Como el front y la API corren en **orígenes distintos** (y potencialmente en
máquinas distintas), el navegador aplica la política **CORS**; por eso el
backend declara qué orígenes acepta (ver §12).

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión | Papel |
|------|------------|---------|-------|
| Lenguaje backend | PHP | 7.4 | Ejecuta Laravel |
| Framework | Laravel | 8.x | Rutas, ORM, validación, middleware |
| ORM | Eloquent | (incluido) | Mapea tablas ↔ objetos PHP |
| Autenticación | Laravel Sanctum | 2.x | Tokens Bearer revocables |
| Base de datos | PostgreSQL | 12+ | Persistencia relacional (incluye columnas JSONB) |
| CORS | fruitcake/laravel-cors | 2.x | Permite el consumo desde otro origen |
| IA | Google Gemini API | `gemini-flash-lite-latest` | Búsqueda semántica, recomendaciones, chatbot |
| Frontend | React + Vite + Tailwind CSS | 18 / 5 / 3 | Panel de administración (SPA) |
| Ruteo frontend | react-router-dom | 6.x | Rutas del panel admin |
| Cliente HTTP frontend | axios | 1.x | Llamadas a la API con interceptores |
| Iconos frontend | lucide-react | 1.x | Iconografía del panel |
| Servidor | Windows / Ubuntu Server | — | Cualquiera de los dos, portátil o con paquetes del sistema |

> **¿Por qué Laravel 8?** Es la última versión compatible con **PHP 7.4**
> (Laravel 9+ exige PHP ≥ 8.0). Esta restricción de versiones es intencional del
> proyecto (ver `instruccion.md`).

---

## 3. Estructura de carpetas (mapa mental)

```
Laravel_API/
├── app/
│   ├── Http/
│   │   ├── Controllers/   → Lógica de cada endpoint (Auth, Article, Cart, Ai, …)
│   │   ├── Middleware/     → CheckRole (autorización por rol)
│   │   └── Requests/       → Validación de entradas (Form Requests)
│   ├── Models/             → Modelos Eloquent + relaciones
│   ├── Services/           → GeminiService (integración con Google Gemini)
│   ├── Exceptions/         → Handler: convierte errores en JSON coherente
│   └── Providers/          → RouteServiceProvider (carga rutas + rate limit)
├── config/                 → cors.php, sanctum.php, auth.php, services.php (Gemini)…
├── database/
│   ├── migrations/         → Definición de las tablas (esquema, incluye JSONB de articles)
│   └── seeders/            → Datos de ejemplo (admin, cliente, productos…)
├── routes/
│   ├── api.php             → TODOS los endpoints REST (el corazón de la API)
│   └── web.php             → (sin uso relevante; esto es una API pura)
├── public/index.php        → Punto de entrada HTTP de Laravel
├── server.php              → Router para "php artisan serve"
├── frontend-admin/         → Panel de administración (React + Vite + Tailwind)
│   ├── src/
│   │   ├── api/client.js       → axios con interceptores (baseURL, token, errores 401/422)
│   │   ├── context/AuthContext.jsx → login/logout, valida que el rol sea EXCLUSIVAMENTE admin
│   │   ├── components/          → ProtectedRoute, Modal, CaracteristicasEditor
│   │   ├── layouts/DashboardLayout.jsx → sidebar responsivo + navegación
│   │   ├── pages/                → Dashboard, Products, Clients, Sales, AiAssistant, Login
│   │   └── App.jsx               → Rutas (BrowserRouter + ProtectedRoute)
│   ├── tailwind.config.js  → Paleta (oro/cuero/mezclilla) y tipografías (Playfair/Inter)
│   └── package.json        → Dependencias y scripts (npm run dev, puerto 5174)
├── composer.json           → Dependencias PHP y requisito php:^7.4
├── contexto.md             → Plan de sprints original del proyecto (histórico)
├── levantamiento.md        → Guía para el equipo: levantar todo desde cero
├── instructions.md         → Guía para sincronizar cambios entre máquinas (Windows ↔ VM)
└── README.md / instruccion.md → Guías de despliegue en Ubuntu
```

---

## 4. Ciclo de vida de una petición (el "hilo" que conecta todo)

Entender este flujo permite ubicar dónde vive cada pieza:

```
1. El navegador (React) hace:  GET /api/articles   con  Authorization: Bearer <token>
             │
2. public/index.php  →  Laravel arranca (bootstrap/app.php)
             │
3. Middleware GLOBAL  →  HandleCors (CORS), TrimStrings, etc.  (app/Http/Kernel.php)
             │
4. RouteServiceProvider  →  aplica prefijo /api y el grupo de middleware 'api'
             │            (throttle:api = máx. 60 req/min, SubstituteBindings)
             │
5. routes/api.php  →  encuentra la ruta y su cadena de middleware:
             │            auth:sanctum → role:admin/cliente → Controlador
             │
6. auth:sanctum  →  lee el token, resuelve $request->user() (o 401 si no es válido)
             │
7. role:...  (CheckRole)  →  compara $user->rol con los roles permitidos (o 403)
             │
8. Form Request  →  valida el cuerpo/parámetros (o 422 con errores)
             │
9. Controlador  →  usa Modelos Eloquent para leer/escribir en PostgreSQL
             │
10. Respuesta JSON  →  response()->json([...])  vuelve al navegador
             │
     (si algo falla en cualquier punto, App\Exceptions\Handler lo formatea como JSON)
```

Las secciones siguientes describen cada uno de estos eslabones.

---

## 5. Rutas — `routes/api.php` (el mapa de la API)

Es el archivo más importante para entender **qué se puede hacer y quién puede
hacerlo**. Está organizado en tres bloques por nivel de acceso:

### 5.1 Rutas públicas (invitados, sin token)

```php
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

Route::get('articles', [ArticleController::class, 'index']);
Route::get('articles/{id}', [ArticleController::class, 'show'])->whereNumber('id');
Route::get('articles/{article}/reviews', [ReviewController::class, 'index']);
Route::get('reviews', [ReviewController::class, 'index']);
Route::get('reviews/{id}', [ReviewController::class, 'show'])->whereNumber('id');

// IA: búsqueda semántica y chatbot (también públicas, no requieren token).
Route::post('ai/search', [AiController::class, 'search']);
Route::post('ai/chat', [AiController::class, 'chat']);
```

- Registrarse, iniciar sesión, **ver productos y reseñas**, la **búsqueda IA**
  del catálogo (`ai/search`) y el **chatbot** (`ai/chat`) no requieren token.
- `->whereNumber('id')` obliga a que `{id}` sea numérico, evitando choques con
  rutas como `articles/{article}/reviews`.

### 5.2 Rutas autenticadas (requieren token Bearer)

Todo lo que va dentro de `Route::middleware('auth:sanctum')->group(...)` exige un
token válido. Dentro de este grupo:

- `POST /logout` y `GET /me` (cualquier usuario autenticado).
- **Solo admin** (`role:admin`): crear/editar/borrar productos, controlar el
  **stock** (`PATCH articles/{id}/stock`) y el CRUD completo de usuarios
  (`Route::apiResource('users', ...)`).
- **Reseñas:** crearlas es solo de `cliente`; editarlas/borrarlas es de
  `cliente,admin`.
- **Solo cliente** (`role:cliente`): carritos, items de carrito, crear/borrar
  compras (checkout) y las **recomendaciones IA** (`GET ai/recommendations`,
  personalizadas según su historial).
- **Cliente o admin** (`role:cliente,admin`): **ver** el historial de compras
  (`GET purchases`, `GET purchases/{id}`) — el cliente ve las suyas, el admin
  las usa para el panel de "Historial de ventas". Este acceso del admin se
  agregó después (antes solo `cliente` podía, y el panel admin recibía 403).

> La anidación de middleware es el mecanismo clave: `auth:sanctum` garantiza *quién
> eres*, y `role:...` garantiza *qué puedes hacer*. El orden importa: primero
> autenticar, luego autorizar.

### 5.3 Notas de diseño

- `apiResource` genera automáticamente las rutas REST estándar (`index`, `store`,
  `show`, `update`, `destroy`).
- Para `purchases` se limita a `->only(['index','store','show','destroy'])`: no hay
  "editar compra" (una compra no se modifica).

---

## 6. Autenticación con Sanctum (¿quién eres?)

### 6.1 Concepto

Sanctum emite un **token Bearer**: una cadena aleatoria que se guarda en la tabla
`personal_access_tokens`. No es JWT; su ventaja es que se puede **revocar**
(borrar de la BD) al cerrar sesión. El cliente lo manda en cada petición:

```
Authorization: Bearer 3|Xy8f...token...
```

### 6.2 `AuthController` — `app/Http/Controllers/AuthController.php`

| Método | Endpoint | Qué hace |
|--------|----------|----------|
| `register` | `POST /api/register` | Crea un usuario con rol **cliente**, hashea la contraseña y devuelve un token. |
| `login` | `POST /api/login` | Verifica usuario + contraseña (`Hash::check`); si son correctos devuelve un token. |
| `logout` | `POST /api/logout` | Borra el token actual (`currentAccessToken()->delete()`) → lo invalida. |
| `me` | `GET /api/me` | Devuelve el usuario dueño del token. |

Puntos clave:

- La contraseña **nunca** se guarda en claro: se usa `Hash::make()` al crear y
  `Hash::check()` al validar.
- El registro **fuerza** `rol => 'cliente'`: nadie se puede auto‑nombrar admin
  desde el formulario público (el rol no se acepta como entrada, ver §8).

### 6.3 Configuración — `config/auth.php` y `config/sanctum.php`

- `config/auth.php`: el **guard por defecto es `sanctum`**, por eso
  `$request->user()` resuelve al usuario a partir del token en toda la app.
- `config/sanctum.php`: **`'expiration' => 5 * 24 * 60`** → los tokens caducan
  a los **5 días**. Pasado ese tiempo, cualquier ruta protegida responde
  **401**, y el front cierra la sesión localmente (ver §14).

---

## 7. Autorización por roles — `CheckRole` (¿qué puedes hacer?)

### 7.1 El middleware — `app/Http/Middleware/CheckRole.php`

```php
public function handle(Request $request, Closure $next, string ...$roles)
{
    $user = $request->user();
    if ($user === null) {
        abort(401, 'No autenticado.');
    }
    if (! in_array($user->rol, $roles, true)) {
        abort(403, 'No tienes permiso para realizar esta acción.');
    }
    return $next($request);
}
```

- Recibe una lista variable de roles permitidos (`role:cliente,admin`).
- Si el rol del usuario no está en la lista → **403 Forbidden**.
- Debe ejecutarse **después** de `auth:sanctum` (necesita que el usuario ya exista).

### 7.2 Registro del alias — `app/Http/Kernel.php`

En `$routeMiddleware` se registra el alias que usan las rutas:

```php
'role' => \App\Http\Middleware\CheckRole::class,
```

Así, en `routes/api.php` basta con escribir `->middleware('role:admin')`.

---

## 8. Validación de entradas — Form Requests (`app/Http/Requests/`)

Cada operación de escritura tiene su propia clase de validación. El controlador
recibe el Form Request ya validado (si falla, Laravel responde **422** solo con
los campos incorrectos, antes de llegar al controlador).

Ejemplos representativos:

- **`RegisterRequest`**: `user` requerido/único, `password` mínimo 6 caracteres.
  **No acepta `rol`** → seguridad: el rol lo fija el servidor, no el cliente.
- **`StoreReviewRequest`**: valida que `article_id` y `user_id` **existan**
  (`exists:articles,id`), y que `calificacion` esté `between:1,5`.
- Existen `Store*` (crear) y `Update*` (actualizar) para Article, Cart, CartItem,
  Review, User, además de `LoginRequest`, `StorePurchaseRequest`,
  `UpdateStockRequest` (§9.1) y `AiSearchRequest`/`AiChatRequest` (§9.7).

Ventaja: la validación queda **fuera** del controlador, centralizada, reutilizable
y con mensajes en español (`messages()` y `attributes()`).

---

## 9. Controladores (`app/Http/Controllers/`) — la lógica de cada endpoint

Todos devuelven **JSON** con la forma `{ "message": ..., "data": ... }` y los
códigos HTTP correctos (`201` al crear, `200` normal, etc.).

### 9.1 `ArticleController` (productos)
CRUD de productos. `index`/`show` son públicos; `store`/`update`/`destroy` los
protegen las rutas (solo admin). `show` carga también las reseñas del producto
(`Article::with('reviews')`).

Cada artículo tiene, además de `nombre`/`descripcion`/`costo`:

- **`caracteristicas`** (JSONB, cast a `array`): atributos dinámicos libres del
  producto (talla, color, material, estilo de ala, etc. — el panel admin lo
  edita con un editor clave/valor, ver §14). No tiene columnas fijas: cada
  sombrero puede tener atributos distintos.
- **`stock`** (entero): cantidad disponible. Se actualiza con su propio
  endpoint, `updateStock` (`PATCH /articles/{id}/stock`), que acepta **o**
  `stock` (fija el valor absoluto) **o** `ajuste` (suma/resta al valor actual,
  sin bajar de 0) — nunca ambos a la vez.

### 9.2 `UserController` (usuarios, solo admin)
CRUD de usuarios. Al crear/actualizar, **hashea** la contraseña con `Hash::make`.

### 9.3 `CartController` (carritos)
Crea un carrito con `costo_total = 0`. Al mostrarlo, carga sus items y el artículo
de cada item (`Cart::with('items.article')`).

### 9.4 `CartItemController` (líneas del carrito)
- `store`: agrega un artículo al carrito y **recalcula el total**
  (`$item->cart->recalculateTotal()`).
- `update`: si el item cambia de carrito, recalcula **ambos** carritos.
- `destroy`: elimina el item y recalcula el total.
- `index`: puede filtrar por `?cart_id=` o por la ruta anidada
  `carts/{cart}/items`.

### 9.5 `PurchaseController` (compras / checkout)
El método `store` es el más interesante — implementa el **checkout**:

```php
// 1. Toma el carrito con sus items
$cart = Cart::with('items.article')->findOrFail($cartId);
// 2. Si está vacío → 422
// 3. Dentro de una TRANSACCIÓN:
DB::transaction(function () use ($cart) {
    // crea la compra, copia cada item (guardando el costo del momento),
    // suma el total, y VACÍA el carrito.
});
```

Detalles importantes:
- Se envuelve en **`DB::transaction`**: si algo falla, no queda una compra a
  medias (atomicidad).
- Cada `PurchaseItem` guarda el **costo del momento** de la compra; si el precio
  del producto cambia después, la compra histórica no se altera.
- Tras comprar, el carrito se **vacía** (`items()->delete()` y `costo_total = 0`).

#### Pasarela de pagos (simulada) y estados del pedido

El checkout exige una **forma de pago** (`metodo_pago`) y el pedido nace en
estado `pendiente_pago`. El **ciclo de estados** es:

```
pendiente_pago → pagado → en_transito → completado        (y cancelado en cualquier punto)
```

Dos formas de pago, **ambas simuladas** (no se cobra nada real):

- **`efectivo`** (estilo *OXXO Pay*): el `store` genera una **referencia
  numérica de 14 dígitos** (`referencia_pago`) que la app móvil pinta como
  **código de barras**. El cliente "paga en tienda" y el pago se confirma
  después.
- **`tarjeta`**: la app muestra un formulario de tarjeta (datos **no** se envían
  ni se guardan) y confirma el cobro.

La confirmación del pago es un endpoint aparte:

```php
// POST /api/purchases/{id}/pay  (cliente dueño del pedido)
// Solo si sigue 'pendiente_pago'; si no → 422.
$purchase->update(['estado' => 'pagado', 'pagado_at' => now()]);
```

Sirve para las dos formas de pago (tarjeta y "ya pagué" del efectivo). A partir
de `pagado`, el **admin** hace avanzar el pedido a `en_transito` (enviado) y
`completado` (entregado) desde el panel, vía `PUT /api/admin/purchases/{id}`
(`adminUpdate`). Columnas nuevas en `purchases`: `metodo_pago`,
`referencia_pago`, `pagado_at`.

### 9.6 `ReviewController` (reseñas)
CRUD de reseñas. `index`/`show` públicos (filtrables por `?article_id=` o por
`articles/{article}/reviews`); crear es de cliente, editar/borrar de cliente o
admin.

### 9.7 `AiController` (integración con Google Gemini)
Los tres endpoints comparten el mismo `GeminiService` (§9.7.1) pero cada uno le
da un rol distinto al modelo mediante un `systemInstruction` distinto:

| Método | Endpoint | Acceso | Qué hace |
|--------|----------|--------|----------|
| `search` | `POST /api/ai/search` | Público | Recibe una consulta en lenguaje natural (`query`), le manda a Gemini todo el catálogo (`nombre`, `descripcion`, `costo`, `caracteristicas`, `stock`) y le pide que devuelva **solo** un JSON `{"ids":[...]}` con los productos más relevantes, en orden. |
| `recommendations` | `GET /api/ai/recommendations` | Cliente autenticado | Arma el historial del cliente (artículos comprados + en el carrito), calcula candidatos que aún no tiene (`stock > 0`), y le pide a Gemini hasta 5 ids recomendados + un `motivo`. |
| `chat` | `POST /api/ai/chat` | Público | Chatbot de atención al cliente de la tienda. Recibe `message` y un `history` opcional (para mantener la conversación) y devuelve `reply` + el `history` actualizado. |

Puntos clave:
- Los tres piden a Gemini que responda con `responseMimeType: application/json`
  cuando esperan una lista de ids (`search`/`recommendations`), y **texto libre**
  para el chat.
- `decodeJson()` tolera que Gemini envuelva la respuesta en \`\`\`json ... \`\`\`
  (los modelos de Gemini a veces lo hacen aunque se pida JSON puro).
- Si `GeminiService` lanza una excepción (key no configurada, cuota agotada,
  error de red), los tres controladores responden **502 Bad Gateway** con el
  mensaje de Gemini tal cual, para que el frontend lo muestre.

#### 9.7.1 `GeminiService` (`app/Services/GeminiService.php`)
Envuelve la llamada HTTP a la API de Gemini (`Http::post(...)` del facade de
Laravel):

- Lee `GEMINI_API_KEY`, `GEMINI_MODEL` y `GEMINI_BASE_URL` desde
  `config/services.php` (y estos, de `.env`).
- `generateContent()` arma el payload (`contents`, `systemInstruction` opcional,
  `generationConfig`) y llama a
  `{base_url}/models/{model}:generateContent` con el header `x-goog-api-key`.
- Si Google responde con error, relanza el mensaje **tal cual** viene de Gemini
  (`RuntimeException`) — así los errores de cuota o de configuración llegan
  legibles hasta el frontend en vez de un 500 genérico.
- `GEMINI_MODEL` por defecto es **`gemini-flash-lite-latest`**. Modelos más
  "clásicos" como `gemini-2.0-flash` han quedado con cuota gratuita en **0**
  para keys nuevas (Google movió la disponibilidad gratuita a los modelos más
  recientes); si el chat/búsqueda devuelve `"Quota exceeded... limit: 0"`, el
  arreglo es cambiar `GEMINI_MODEL` en `.env`, no crear otra cuenta.

---

## 10. Modelos Eloquent (`app/Models/`) — el dominio y sus relaciones

Cada modelo mapea una tabla y declara sus **relaciones** y campos asignables
(`$fillable`). Diagrama de relaciones:

```
User (1) ─────< (N) Cart (1) ─────< (N) CartItem >───── (1) Article
   │                                                        │  ▲  ▲
   ├─────< (N) Purchase (1) ──< (N) PurchaseItem >──────────┘  │  │
   │                                                            │  │
   └─────< (N) Review >─────────────────────────────────────────┘  │
                              (Review también pertenece a Article) ──┘
```

| Modelo | Campos (`fillable`) | Relaciones | Notas |
|--------|--------------------|------------|-------|
| **User** | `user`, `password`, `rol` | `hasMany` Cart, Purchase, Review | Usa `HasApiTokens` (Sanctum). `password` está en `$hidden` (nunca se expone). |
| **Article** | `nombre`, `descripcion`, `costo`, `caracteristicas`, `stock` | `hasMany` CartItem, PurchaseItem, Review | `costo` casteado a `decimal:2`; `caracteristicas` (JSONB) casteado a `array`; `stock` a `integer`. |
| **Cart** | `user_id`, `costo_total` | `belongsTo` User; `hasMany` CartItem | Tiene `recalculateTotal()` (regla de negocio). |
| **CartItem** | `cart_id`, `article_id` | `belongsTo` Cart, Article | Une carrito ↔ artículo. |
| **Purchase** | `user_id`, `total` | `belongsTo` User; `hasMany` PurchaseItem | El total se calcula en el checkout. |
| **PurchaseItem** | `purchase_id`, `article_id`, `costo` | `belongsTo` Purchase, Article | Guarda el precio histórico. |
| **Review** | `article_id`, `user_id`, `calificacion`, `descripcion` | `belongsTo` Article, User | `calificacion` 1–5. |

**Regla de negocio destacada — `Cart::recalculateTotal()`:** suma el `costo` de
los artículos de todos los items del carrito y persiste el resultado en
`costo_total`. Se invoca cada vez que se agrega, cambia o elimina un item.

---

## 11. Base de datos — Migraciones y Seeder (`database/`)

### 11.1 Migraciones (`database/migrations/`)
Definen el **esquema** de las 7 tablas. Puntos comunes:

- Todas usan `id()` (clave primaria autoincremental) y `timestamps()`
  (`created_at`, `updated_at`).
- Las claves foráneas usan `->constrained()->cascadeOnDelete()`: al borrar un
  usuario se borran sus carritos/compras/reseñas en **cascada**; al borrar un
  carrito se borran sus items, etc.
- `users.user` es **único**; `reviews.calificacion` es `unsignedTinyInteger`
  (1–5); los importes son `decimal(10,2)`.
- `articles.caracteristicas` es **JSONB** (atributos dinámicos del sombrero,
  sin columnas fijas) y `articles.stock` es entero (por defecto 0). Se
  agregaron después de la migración inicial de `articles`, como parte del
  Sprint que adaptó el dominio a una tienda de sombreros (ver `contexto.md`).

Orden de creación (por dependencias): users → articles → carts → cart_items →
purchases → purchase_items → reviews.

### 11.2 Seeder (`database/seeders/DatabaseSeeder.php`)
Carga datos de ejemplo al ejecutar `php artisan migrate --seed`:

- **Usuarios:** `admin / admin123` (rol admin) y `cliente / cliente123` (rol
  cliente).
- **Productos:** sombreros con `caracteristicas` y `stock` de ejemplo (Fedora
  Clásico, Panamá Montecristi, Vaquero Texano, …).
- Un **carrito** de ejemplo (con recálculo de total), una **compra** de ejemplo y
  dos **reseñas**.

Estos son los credenciales que el front sugiere por defecto en el login.

---

## 12. CORS — cómo el front (otro origen) puede llamar a la API

Archivo: `config/cors.php`. El navegador bloquea por defecto peticiones entre
orígenes distintos; CORS le indica a la API qué aceptar.

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],  // a qué rutas aplica
'allowed_methods' => ['*'],
'allowed_origins' => ['*'],                    // de qué origen puede cargar el front
'allowed_headers' => ['*'],
'supports_credentials' => false,               // usamos tokens Bearer, no cookies
```

- `allowed_origins` = **de dónde carga el navegador el front** (la URL de la barra:
  `http://localhost:5174` o la IP de la máquina que sirve `frontend-admin`),
  **no** la IP de la API.
- Está en `'*'` (abierto) porque el front puede abrirse desde varias URLs y porque
  se usan tokens (no cookies). Para restringir, se sustituye `'*'` por la(s) URL(s)
  concretas.
- El middleware global `HandleCors` (en `app/Http/Kernel.php`) es quien aplica esta
  configuración.

---

## 13. Manejo de errores — `app/Exceptions/Handler.php`

Como la app es una **API pura**, cualquier excepción se devuelve como **JSON
coherente** (nunca una página HTML de error). El método `render` detecta que la
ruta es `api/*` y traduce cada excepción a un código y mensaje:

| Excepción | Código HTTP | Respuesta |
|-----------|-------------|-----------|
| `ValidationException` | **422** | `{ message, errors }` con los campos inválidos |
| `AuthenticationException` | **401** | `{ message: "No autenticado." }` |
| `ModelNotFoundException` | **404** | Mensaje amigable por entidad ("Artículo no encontrado.", …) |
| Otra `HttpException` (p. ej. 403 de CheckRole) | su código | `{ message }` |
| Error inesperado | **500** | `{ message }` (+ detalles solo si `APP_DEBUG=true`) |

Esto garantiza que el frontend siempre reciba un `message` legible que mostrar en
su banner.

---

## 14. Frontend — panel de administración (`frontend-admin/`)

> El proyecto tuvo antes un frontend de prueba de concepto (`/frontend`, solo
> para validar CORS y roles) que **ya no existe**: se eliminó y se reemplazó
> por este panel real. No hay (todavía) un frontend orientado al cliente final
> (catálogo público, carrito) — solo el panel de administración.

Es una SPA en **React + Vite + Tailwind CSS**, con **react-router-dom** para
las rutas y **axios** para las llamadas HTTP. Corre en `http://localhost:5174`
(`npm run dev`) y es de **acceso exclusivo para el rol `admin`**.

Tema visual: paleta oro (`#D4AF37`) / cuero (`#5C4033`) / mezclilla
(`#2E4053`) / blanco-crema, tipografía **Playfair Display** (títulos) e
**Inter** (texto), configuradas en `tailwind.config.js` e `index.html` (Google
Fonts).

### 14.1 `src/api/client.js` — el único punto de contacto con la API
Instancia de `axios` con interceptores. **Todas** las llamadas pasan por aquí:

- **Request interceptor:** inyecta `baseURL` (desde `localStorage`, clave
  `admin_api_url` — lo que el usuario escribe en el campo "Dirección de la
  API" del login), el header `Authorization: Bearer <token>` (clave
  `admin_token`) y `Accept: application/json`.
- **Response interceptor:** si la respuesta es **401**, limpia
  `localStorage` y redirige a `/login` (token expirado o revocado — la
  contraparte de la expiración de Sanctum, §6.3); si es **422** u otro error,
  extrae el `message`/`errors` de Laravel para mostrarlo en la UI.

### 14.2 `src/context/AuthContext.jsx` — sesión y control de acceso admin-only
Maneja `login`/`logout`/`user`/`token`, persistidos en `localStorage`. La
pieza clave es el **rechazo estricto de roles no-admin**:

```js
const { data } = await api.post('/api/login', { user: username, password })
if (!data?.user || data.user.rol !== 'admin') {
  // revoca el token recién emitido (logout inmediato) y no deja entrar
  await api.post('/api/logout', null, { headers: { Authorization: `Bearer ${data?.token}` } })
  throw new Error('Acceso denegado: Área exclusiva de administración.')
}
```

Es decir: aunque el `login` del backend sea válido para cualquier rol, el
frontend **revoca el token en el acto** si el usuario no es `admin`, para que
ni siquiera quede una sesión "colgada" en el navegador.

### 14.3 `src/components/ProtectedRoute.jsx`
Redirige a `/login` si no hay sesión (`!isAuthenticated`). Envuelve todas las
rutas del panel salvo `/login`.

### 14.4 `src/layouts/DashboardLayout.jsx` — sidebar
Layout con barra lateral responsiva (colapsa a overlay en móvil) y la
navegación entre las 5 vistas (`NAV_ITEMS`), con iconos de `lucide-react`.

### 14.5 Vistas (`src/pages/`)

| Página | Ruta | Qué hace | Endpoints que usa |
|--------|------|----------|-------------------|
| **`Login.jsx`** | `/login` | Login con campo colapsable "Dirección de la API". | `POST /api/login`, `POST /api/logout` |
| **`Dashboard.jsx`** | `/` | Estadísticas: KPIs calculados en el cliente (total ventas, total compras, producto más vendido, cliente con más compras) agregando `GET /api/purchases` con `Map`. | `GET /api/purchases` |
| **`Products.jsx`** | `/productos` | CRUD de productos, con `CaracteristicasEditor` (editor dinámico clave/valor para el JSONB) dentro de un `Modal`, y control de stock. | `articles` (GET/POST/PUT/DELETE), `PATCH articles/{id}/stock` |
| **`Clients.jsx`** | `/clientes` | CRUD de usuarios. | `users` (GET/POST/PUT/DELETE) |
| **`Sales.jsx`** | `/ventas` | Historial de ventas: aplana `GET /api/purchases` en filas por artículo, con buscador global (producto, cliente, fecha, costo, total). | `GET /api/purchases` |
| **`AiAssistant.jsx`** | `/asistente-ia` | Chat con el asistente IA de la tienda. | `POST /api/ai/chat` |

### 14.6 `src/components/CaracteristicasEditor.jsx`
Editor de pares clave/valor para el campo `caracteristicas` (JSONB) de un
artículo — permite agregar/quitar atributos libres (sugiere `talla`, `color`,
`material`, `estilo_ala` pero acepta cualquier clave).

---

## 15. Roles y permisos (tabla resumen)

| Acción | Invitado | Cliente | Admin |
|--------|:--------:|:-------:|:-----:|
| Ver productos y reseñas | ✅ | ✅ | ✅ |
| Búsqueda IA del catálogo (`ai/search`) y chatbot (`ai/chat`) | ✅ | ✅ | ✅ |
| Registrarse / iniciar sesión | ✅ | — | — |
| Recomendaciones IA (`ai/recommendations`) | ❌ | ✅ | ❌ |
| Crear reseñas | ❌ | ✅ | ❌ |
| Editar / borrar reseñas | ❌ | ✅ | ✅ |
| Carrito y checkout (crear/borrar compras) | ❌ | ✅ | ❌ |
| Ver historial de compras | ❌ | ✅ (las suyas) | ✅ (todas — panel de ventas) |
| Crear / editar / borrar productos, controlar stock | ❌ | ❌ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |
| Entrar al panel `frontend-admin` | ❌ | ❌ | ✅ (único rol permitido) |

Se controla combinando el guard `auth:sanctum` (autenticación) con el middleware
`role` (autorización) en el backend, y con el chequeo de rol en `AuthContext`
en el frontend.

---

## 16. Flujos completos de ejemplo

### 16.1 Registro e inicio de sesión
```
POST /api/register { user, password }  → crea cliente + devuelve token
POST /api/login    { user, password }  → devuelve token
(el front guarda el token en localStorage y lo manda en cada petición)
```

### 16.2 Compra de un cliente (checkout)
```
1. POST /api/carts          { user_id }               → crea carrito (total 0)
2. POST /api/cart-items     { cart_id, article_id }    → agrega item + recalcula total
   (repetir para más productos)
3. GET  /api/carts/{id}                                → ver carrito con total
4. POST /api/purchases      { cart_id, metodo_pago }   → checkout: crea el pedido en
                                                          'pendiente_pago', copia items,
                                                          vacía el carrito. Si es efectivo,
                                                          genera referencia_pago (código de barras)
5. POST /api/purchases/{id}/pay                        → confirma el pago (simulado) → 'pagado'
   (tarjeta, o "ya pagué" del efectivo tipo OXXO Pay)
```

El **admin** hace avanzar luego el pedido: `pagado → en_transito → completado`
(vía `PUT /api/admin/purchases/{id}` con `{ estado }`).

### 16.3 Gestión de un admin
```
POST   /api/articles              { nombre, descripcion, costo, caracteristicas } → crear producto
PUT    /api/articles/{id}                                                         → editar producto
PATCH  /api/articles/{id}/stock   { stock } o { ajuste }                          → ajustar stock
DELETE /api/articles/{id}                                                         → borrar producto
GET/POST/PUT/DELETE /api/users                                                    → gestionar usuarios
GET    /api/purchases                                                             → historial de ventas (panel admin)
```

### 16.4 Qué pasa cuando el token expira (a los 5 días)
```
El frontend hace una petición protegida → la API responde 401
→ el interceptor de axios (client.js) limpia localStorage
→ redirige a /login
→ el usuario vuelve a iniciar sesión
```

### 16.5 Chat con el Asistente IA
```
POST /api/ai/chat  { message: "¿qué talla me recomiendan?", history: [] }
→ AiController arma el contexto (systemInstruction + history) y llama a GeminiService
→ GeminiService llama a Gemini (POST .../models/{model}:generateContent)
→ responde { reply, history }  (el frontend reenvía ese history en el siguiente mensaje)
```

---

## 17. Referencia rápida de endpoints

Todos bajo el prefijo `/api`, respuestas JSON.

| Método | Ruta | Acción | Acceso |
|--------|------|--------|--------|
| POST | `/register` | Registro (crea cliente) | Público |
| POST | `/login` | Login (devuelve token) | Público |
| POST | `/logout` | Cerrar sesión (revoca token) | Autenticado |
| GET | `/me` | Usuario actual | Autenticado |
| GET | `/articles`, `/articles/{id}` | Ver productos | Público |
| POST / PUT / DELETE | `/articles`, `/articles/{id}` | Gestionar productos | Admin |
| PATCH | `/articles/{id}/stock` | Ajustar stock | Admin |
| GET / POST / PUT / DELETE | `/users…` | Gestionar usuarios | Admin |
| GET | `/reviews`, `/articles/{id}/reviews`, `/reviews/{id}` | Ver reseñas | Público |
| POST | `/reviews` | Crear reseña | Cliente |
| PUT / DELETE | `/reviews/{id}` | Editar / borrar reseña | Cliente o Admin |
| GET / POST / PUT / DELETE | `/carts…`, `/cart-items…` | Carrito | Cliente |
| GET | `/carts/{cart}/items` | Items de un carrito | Cliente |
| POST | `/purchases` | Checkout: crea pedido `pendiente_pago` con `metodo_pago` (`efectivo`/`tarjeta`) | Cliente |
| POST | `/purchases/{id}/pay` | Confirmar pago (simulado) → `pagado` | Cliente (dueño) |
| DELETE | `/purchases/{id}` | Borrar compra | Cliente |
| GET | `/purchases`, `/purchases/{id}` | Ver historial de compras | Cliente (las suyas) o Admin (todas) |
| POST / PUT / PATCH | `/admin/purchases…`, `/admin/purchases/{id}` | Crear/editar pedido y avanzar estado (`pagado→en_transito→completado`) | Admin |
| PATCH | `/admin/purchases/{id}/cancel` | Cancelar pedido | Admin |
| POST | `/ai/search` | Búsqueda semántica del catálogo (IA) | Público |
| GET | `/ai/recommendations` | Recomendaciones personalizadas (IA) | Cliente |
| POST | `/ai/chat` | Chatbot de la tienda (IA) | Público |

---

## 18. Cómo ejecutar el proyecto

> Guía paso a paso completa (incluye instalación portátil de PHP/Node sin
> permisos de administrador, y solución de problemas) en **`levantamiento.md`**.
> Esta sección es solo el resumen técnico.

### 18.1 Backend (API Laravel)
Requiere **PHP 7.4**, Composer y PostgreSQL. Detalle completo en `README.md` /
`instruccion.md`. Resumen:

```bash
composer install
cp .env.example .env            # configurar DB_* (PostgreSQL) en .env
php artisan key:generate
php artisan migrate --seed       # crea tablas y datos de ejemplo
php artisan serve --host=0.0.0.0 --port=8000
```

> **Nota sobre versiones:** si el servidor trae PHP 8.x, instalar PHP 7.4 en
> paralelo (Opción A de `instruccion.md`). Forzar sobre PHP 8 (`--ignore-platform-req`)
> es un parche que puede romper en ejecución.

### 18.2 Frontend (`frontend-admin/`, panel de administración)
```bash
cd frontend-admin
npm install
npm run dev        # arranca Vite en http://localhost:5174
```

Luego, en el login, desplegar el campo **"Dirección de la API"** y escribir la
URL del backend (p. ej. `http://localhost:8000` si corre en la misma máquina,
o `http://192.168.1.50:8000` si corre en otra — recuerda levantar ese backend
con `--host=0.0.0.0`). Solo el rol `admin` puede entrar.

### 18.3 Configuración clave (`.env`)
```
DB_CONNECTION=pgsql          APP_KEY=<generada con key:generate>
DB_HOST=127.0.0.1            APP_DEBUG=true   (false en producción)
DB_PORT=5432
DB_DATABASE=laravel_api
DB_USERNAME=postgres
DB_PASSWORD=<tu password>

# Opcional, para /api/ai/*:
GEMINI_API_KEY=<tu key de https://aistudio.google.com/app/apikey>
GEMINI_MODEL=gemini-flash-lite-latest
```

---

## 19. Detalles finos que conviene conocer

- **Rate limiting:** `RouteServiceProvider` limita la API a **60 peticiones por
  minuto** por usuario (o por IP si es invitado).
- **`server.php`:** router necesario para `php artisan serve`; su ausencia provoca
  un error 500 al levantar el servidor embebido. Si nunca se subió a git en
  alguna copia del proyecto y luego se generó localmente, puede chocar con
  `git pull` (ver `levantamiento.md`/`instructions.md`).
- **Precios históricos:** `PurchaseItem.costo` guarda el precio del momento de la
  compra, independiente de cambios futuros en `Article.costo`.
- **Modelo de Gemini:** usar siempre `GEMINI_MODEL=gemini-flash-lite-latest`
  (el default). Modelos antiguos como `gemini-2.0-flash` devuelven
  `"Quota exceeded... limit: 0"` para keys nuevas — no es un problema de la
  cuenta de Google, es que ese modelo ya no tiene cuota gratuita (§9.7.1).
- **PHP portátil en Windows sin certificados CA:** si `/api/ai/*` falla con
  `SSL certificate problem: unable to get local issuer certificate`, hace
  falta apuntar `curl.cainfo`/`openssl.cafile` en `php.ini` a un `cacert.pem`
  (detalle en `levantamiento.md`).
- **Atomicidad del checkout:** la compra se hace dentro de `DB::transaction`, así
  nunca queda una compra a medias.
- **Seguridad del rol:** el registro público ignora cualquier `rol` que mande el
  cliente y siempre crea un `cliente`; solo un admin (vía `UserController`) puede
  crear otros admins.
- **Contraseñas:** siempre hasheadas (`Hash::make`) y ocultas en las respuestas
  (`$hidden` en el modelo `User`).

---

*Para el plan de sprints original del proyecto, ver `contexto.md`. Para
levantar el proyecto desde cero (backend + `frontend-admin`), ver
`levantamiento.md`. Para sincronizar cambios entre máquinas (p. ej. Windows ↔
VM Ubuntu) y probar la API con HTTPie, ver `instructions.md`. Para las
instrucciones de despliegue en Ubuntu, ver `README.md` e `instruccion.md`.*
