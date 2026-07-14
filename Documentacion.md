# Documentación del proyecto — API RESTful de e‑commerce (Laravel 8 + React)

Esta documentación explica **parte por parte** cómo funciona el proyecto, para
entenderlo de forma holística: desde que llega una petición HTTP hasta que el
navegador pinta la respuesta. Está pensada para leerse de arriba hacia abajo, pero
cada sección se puede consultar por separado.

> **Resumen en una frase:** es una API REST hecha en **Laravel 8 + PostgreSQL
> (Eloquent)**, protegida con **tokens Bearer de Sanctum** y **roles**
> (admin / cliente / invitado), consumida por un **cliente web en React (Vite)**
> que vive en otro origen y se comunica gracias a **CORS**.

---

## 1. Visión general de la arquitectura

Hay **dos aplicaciones independientes** que se comunican por HTTP:

```
┌──────────────────────────┐         HTTP + JSON          ┌────────────────────────────┐
│  FRONTEND (React + Vite)  │  ─────────────────────────▶ │   BACKEND (Laravel 8 API)   │
│  http://localhost:8000    │  ◀───────────────────────── │   php artisan serve :8000    │
│  (navegador del usuario)  │   Authorization: Bearer …    │   (en Ubuntu Server / VM)   │
└──────────────────────────┘                              └──────────────┬──────────────┘
                                                                          │  Eloquent (ORM)
                                                                          ▼
                                                              ┌────────────────────────┐
                                                              │   PostgreSQL (base de   │
                                                              │   datos relacional)     │
                                                              └────────────────────────┘
```

- El **frontend** no tiene lógica de negocio: solo dibuja pantallas y llama a la
  API con `fetch`. Guarda el **token** en `localStorage`.
- El **backend** contiene toda la lógica: rutas, autenticación, permisos,
  validación, acceso a datos y reglas de negocio (recalcular totales, checkout…).
- La **base de datos** guarda usuarios, productos, carritos, compras y reseñas.

Como el front y la API corren en **orígenes distintos**, el navegador aplica la
política **CORS**; por eso el backend declara qué orígenes acepta (ver §12).

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión | Papel |
|------|------------|---------|-------|
| Lenguaje backend | PHP | 7.4 | Ejecuta Laravel |
| Framework | Laravel | 8.x | Rutas, ORM, validación, middleware |
| ORM | Eloquent | (incluido) | Mapea tablas ↔ objetos PHP |
| Autenticación | Laravel Sanctum | 2.x | Tokens Bearer revocables |
| Base de datos | PostgreSQL | 12+ | Persistencia relacional |
| CORS | fruitcake/laravel-cors | 2.x | Permite el consumo desde otro origen |
| Frontend | React + Vite | 18 / 5 | Cliente web (SPA) |
| Servidor | Ubuntu Server | 20.04 | Despliegue del backend |

> **¿Por qué Laravel 8?** Es la última versión compatible con **PHP 7.4**
> (Laravel 9+ exige PHP ≥ 8.0). Esta restricción de versiones es intencional del
> proyecto (ver `instruccion.md`).

---

## 3. Estructura de carpetas (mapa mental)

```
Laravel Sin BD/
├── app/
│   ├── Http/
│   │   ├── Controllers/   → Lógica de cada endpoint (Auth, Article, Cart, …)
│   │   ├── Middleware/     → CheckRole (autorización por rol)
│   │   └── Requests/       → Validación de entradas (Form Requests)
│   ├── Models/             → Modelos Eloquent + relaciones
│   ├── Exceptions/         → Handler: convierte errores en JSON coherente
│   └── Providers/          → RouteServiceProvider (carga rutas + rate limit)
├── config/                 → cors.php, sanctum.php, auth.php, database.php…
├── database/
│   ├── migrations/         → Definición de las tablas (esquema)
│   └── seeders/            → Datos de ejemplo (admin, cliente, productos…)
├── routes/
│   ├── api.php             → TODOS los endpoints REST (el corazón de la API)
│   └── web.php             → (sin uso relevante; esto es una API pura)
├── public/index.php        → Punto de entrada HTTP de Laravel
├── server.php              → Router para "php artisan serve"
├── frontend/               → Cliente web React (app aparte)
│   ├── src/
│   │   ├── api.js          → Helper de fetch (todas las llamadas pasan por aquí)
│   │   ├── App.jsx         → Componente raíz: sesión, token, banner, ruteo por rol
│   │   └── components/     → Login, Catalog, ClientPanel, AdminPanel
│   ├── vite.config.js      → Config del servidor de desarrollo (puerto 8000)
│   └── package.json        → Dependencias y scripts (npm run web)
├── composer.json           → Dependencias PHP y requisito php:^7.4
├── reporte.md              → Reporte académico de la práctica
├── request.md              → Guía de las peticiones POST del cliente
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
```

- Registrarse, iniciar sesión y **ver productos y reseñas** no requieren token.
- `->whereNumber('id')` obliga a que `{id}` sea numérico, evitando choques con
  rutas como `articles/{article}/reviews`.

### 5.2 Rutas autenticadas (requieren token Bearer)

Todo lo que va dentro de `Route::middleware('auth:sanctum')->group(...)` exige un
token válido. Dentro de este grupo:

- `POST /logout` y `GET /me` (cualquier usuario autenticado).
- **Solo admin** (`role:admin`): crear/editar/borrar productos y el CRUD completo
  de usuarios (`Route::apiResource('users', ...)`).
- **Reseñas:** crearlas es solo de `cliente`; editarlas/borrarlas es de
  `cliente,admin`.
- **Solo cliente** (`role:cliente`): carritos, items de carrito y compras.

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
  Review, User, además de `LoginRequest` y `StorePurchaseRequest`.

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

### 9.6 `ReviewController` (reseñas)
CRUD de reseñas. `index`/`show` públicos (filtrables por `?article_id=` o por
`articles/{article}/reviews`); crear es de cliente, editar/borrar de cliente o
admin.

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
| **Article** | `nombre`, `descripcion`, `costo` | `hasMany` CartItem, PurchaseItem, Review | `costo` casteado a `decimal:2`. |
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

Orden de creación (por dependencias): users → articles → carts → cart_items →
purchases → purchase_items → reviews.

### 11.2 Seeder (`database/seeders/DatabaseSeeder.php`)
Carga datos de ejemplo al ejecutar `php artisan migrate --seed`:

- **Usuarios:** `admin / admin123` (rol admin) y `cliente / cliente123` (rol
  cliente).
- **Productos:** teclado, mouse, monitor.
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
  `http://localhost:8000` o la IP de la máquina), **no** la IP de la API.
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

## 14. Frontend en React (`frontend/`) — el cliente web

Es una SPA sencilla (sin router ni librería de estado); todo el estado vive en
`App.jsx` y se pasa por props. Corre en `http://localhost:8000` (Vite).

### 14.1 `src/api.js` — el único punto de contacto con la API
Helper mínimo sobre `fetch`. **Todas** las llamadas pasan por aquí:

- Arma la URL (`baseUrl + path`), añade `Accept: application/json`, el
  `Content-Type` si hay cuerpo y el header `Authorization: Bearer <token>` si hay
  token.
- Si la respuesta **no es OK**, lanza un `Error` con `.status` y `.data` para que
  el componente lo capture y lo muestre. Centralizar esto evita repetir manejo de
  errores en cada componente.

### 14.2 `src/App.jsx` — componente raíz (orquestador)
Concentra el estado global y decide qué se ve:

- **Estado:** `baseUrl` (dirección de la API, editable y persistida en
  `localStorage`), `token`, `user`, y `notice` (el banner de mensajes).
- **Dirección de la API configurable:** hay un campo para escribir la IP del
  servidor (la API corre en otra máquina); solo se aplica al pulsar *Conectar*.
- **`handleAuthError`:** manejo central del **401** → si el token expiró (a los 5
  min), cierra sesión localmente y avisa. Es la contraparte de la expiración de
  Sanctum (§6.3).
- **Ruteo por rol:** siempre muestra el `Catalog` (público); añade `ClientPanel`
  si el rol es `cliente` y `AdminPanel` si es `admin`.
- **Demo de manejo de errores:** un botón que llama a `/api/users` (solo admin)
  para mostrar cómo se capturan 401/403 sin romper la app.

### 14.3 Componentes (`src/components/`)

| Componente | Rol | Qué hace | Endpoints que usa |
|------------|-----|----------|-------------------|
| **`Login.jsx`** | todos | Formulario de login; al entrar devuelve token + usuario. Sugiere las credenciales del seeder. | `POST /api/login` |
| **`Catalog.jsx`** | público | Lista productos y reseñas (visible para invitados). | `GET /api/articles`, `GET /api/reviews` |
| **`ClientPanel.jsx`** | cliente | Crea carrito, agrega productos y compra (checkout). | `POST /api/carts`, `POST /api/cart-items`, `GET /api/carts/{id}`, `POST /api/purchases` |
| **`AdminPanel.jsx`** | admin | CRUD de productos y de usuarios. | `articles` (POST/PUT/DELETE), `users` (GET/POST/DELETE) |

Patrón común: cada acción llama a `apiRequest`, y ante error llama a `onAuthError`
(por si es 401) y muestra el mensaje en el banner.

---

## 15. Roles y permisos (tabla resumen)

| Acción | Invitado | Cliente | Admin |
|--------|:--------:|:-------:|:-----:|
| Ver productos y reseñas | ✅ | ✅ | ✅ |
| Registrarse / iniciar sesión | ✅ | — | — |
| Crear reseñas | ❌ | ✅ | ❌ |
| Editar / borrar reseñas | ❌ | ✅ | ✅ |
| Carrito y compras | ❌ | ✅ | ❌ |
| Crear / editar / borrar productos | ❌ | ❌ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |

Se controla combinando el guard `auth:sanctum` (autenticación) con el middleware
`role` (autorización).

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
4. POST /api/purchases      { cart_id }                → checkout: crea la compra,
                                                          copia items, vacía el carrito
```

### 16.3 Gestión de un admin
```
POST   /api/articles   { nombre, descripcion, costo }  → crear producto
PUT    /api/articles/{id}                               → editar producto
DELETE /api/articles/{id}                               → borrar producto
GET/POST/DELETE /api/users                              → gestionar usuarios
```

### 16.4 Qué pasa cuando el token expira (a los 5 min)
```
El cliente hace una petición protegida → la API responde 401
→ apiRequest lanza Error(status=401)
→ App.handleAuthError borra token/usuario de localStorage y muestra el banner
→ el usuario vuelve a iniciar sesión
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
| GET / POST / PUT / DELETE | `/users…` | Gestionar usuarios | Admin |
| GET | `/reviews`, `/articles/{id}/reviews`, `/reviews/{id}` | Ver reseñas | Público |
| POST | `/reviews` | Crear reseña | Cliente |
| PUT / DELETE | `/reviews/{id}` | Editar / borrar reseña | Cliente o Admin |
| GET / POST / PUT / DELETE | `/carts…`, `/cart-items…` | Carrito | Cliente |
| GET | `/carts/{cart}/items` | Items de un carrito | Cliente |
| GET / POST / GET / DELETE | `/purchases…` | Compras (checkout) | Cliente |

---

## 18. Cómo ejecutar el proyecto

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

### 18.2 Frontend (React)
```bash
cd frontend
npm install
npm run web        # arranca Vite en http://localhost:8000
```

Luego, en la interfaz, escribir la **dirección de la API** (la IP del servidor
Laravel, p. ej. `http://192.168.1.50:8000`) y pulsar *Conectar*.

### 18.3 Configuración clave (`.env`)
```
DB_CONNECTION=pgsql          APP_KEY=<generada con key:generate>
DB_HOST=127.0.0.1            APP_DEBUG=true   (false en producción)
DB_PORT=5432
DB_DATABASE=laravel_api
DB_USERNAME=postgres
DB_PASSWORD=<tu password>
```

---

## 19. Detalles finos que conviene conocer

- **Rate limiting:** `RouteServiceProvider` limita la API a **60 peticiones por
  minuto** por usuario (o por IP si es invitado).
- **`server.php`:** router necesario para `php artisan serve`; su ausencia provoca
  un error 500 al levantar el servidor embebido.
- **Precios históricos:** `PurchaseItem.costo` guarda el precio del momento de la
  compra, independiente de cambios futuros en `Article.costo`.
- **Atomicidad del checkout:** la compra se hace dentro de `DB::transaction`, así
  nunca queda una compra a medias.
- **Seguridad del rol:** el registro público ignora cualquier `rol` que mande el
  cliente y siempre crea un `cliente`; solo un admin (vía `UserController`) puede
  crear otros admins.
- **Contraseñas:** siempre hasheadas (`Hash::make`) y ocultas en las respuestas
  (`$hidden` en el modelo `User`).

---

*Para el contexto académico y el historial de etapas del desarrollo, ver
`reporte.md`. Para las instrucciones de despliegue en Ubuntu, ver `README.md` e
`instruccion.md`. Para los cuerpos JSON de cada POST, ver `request.md`.*
