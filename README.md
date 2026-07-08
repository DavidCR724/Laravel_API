# API RESTful e-commerce (Laravel 8 + PostgreSQL)

API tipo e-commerce con arquitectura **RESTful** construida en **Laravel 8**,
respaldada por **PostgreSQL** (ORM **Eloquent**) y con **autenticación por token**
mediante **Laravel Sanctum** y control de acceso por **roles**.

## Entorno / Versiones

| Componente | Versión |
|------------|---------|
| PHP        | **7.4.3** |
| Laravel    | **8.x** (`laravel/framework ^8.75`) |
| Sanctum    | `laravel/sanctum ^2.11` (tokens de API) |
| PostgreSQL | 12+ |
| Ubuntu     | 20.04 (server) |

> **¿Por qué Laravel 8?** Es la última versión compatible con **PHP 7.4**.
> Laravel 9+ exige PHP ≥ 8.0.

## Entidades

- **User**: `id`, `user`, `password` (hasheada), `rol` (`admin` | `cliente`)
- **Article** (producto): `id`, `nombre`, `descripcion`, `costo`
- **Cart**: `id`, `user_id`, `costo_total`
- **CartItem**: `id`, `cart_id`, `article_id`
- **Purchase** (compra): `id`, `user_id`, `total`
- **PurchaseItem**: `id`, `purchase_id`, `article_id`, `costo`
- **Review** (reseña): `id`, `article_id`, `user_id`, `calificacion` (1-5), `descripcion`

Las claves foráneas usan borrado en cascada (`ON DELETE CASCADE`).

## Autenticación y roles (Sanctum)

La API usa **Laravel Sanctum**: el usuario inicia sesión y recibe un **token**
que debe enviar en cada petición protegida con la cabecera:

```
Authorization: Bearer <token>
```

> Sanctum **no** es JWT: el token es una cadena aleatoria guardada en la tabla
> `personal_access_tokens`, por lo que se puede **revocar** al instante (logout).

### Roles y permisos

| Rol | Puede... |
|-----|----------|
| **Invitado** (sin token) | Ver productos completos y ver reseñas. |
| **Cliente** | Lo anterior + **crear** reseñas, usar el carrito y hacer compras. |
| **Admin** | Gestionar productos (crear/editar/borrar) y usuarios. |

### Cuentas de ejemplo (creadas por el seeder)

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | admin |
| `cliente` | `cliente123` | cliente |

### Flujo de uso

```bash
# 1. Login -> devuelve un token
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"user":"cliente","password":"cliente123"}'
# Respuesta: { "token": "1|abc...", "token_type": "Bearer", "user": {...} }

# 2. Usar el token en rutas protegidas
curl http://127.0.0.1:8000/api/me \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 1|abc..."
```

## Requisitos

- PHP **7.4** con extensiones: `mbstring`, `xml`, `curl`, `bcmath`,
  **`pdo_pgsql` / `pgsql`**.
- [Composer](https://getcomposer.org/).
- **PostgreSQL** 12 o superior.

## Instalación (local)

```bash
# 1. Dependencias (instala también Laravel Sanctum)
composer install

# 2. Entorno
cp .env.example .env      # en Windows: copy .env.example .env

# 3. Configura la conexión a PostgreSQL en .env (DB_*)

# 4. Clave de la aplicación
php artisan key:generate

# 5. Crea las tablas y carga datos de ejemplo
#    (migrate también crea la tabla personal_access_tokens de Sanctum)
php artisan migrate --seed
```

Levantar en desarrollo:

```bash
php artisan serve
```

La API queda en `http://127.0.0.1:8000/api`.

Para reconstruir la base desde cero: `php artisan migrate:fresh --seed`.

## Despliegue en Ubuntu Server 20.04

Ubuntu 20.04 incluye **PHP 7.4** y **PostgreSQL** en sus repositorios oficiales.

### 1. Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar PHP 7.4 y extensiones (incluida la de PostgreSQL)

```bash
sudo apt install -y php7.4-cli php7.4-common php7.4-mbstring \
  php7.4-xml php7.4-curl php7.4-bcmath php7.4-pgsql unzip git

php -v   # debe ser 7.4.x
```

### 3. Instalar Composer

```bash
cd /tmp
curl -sS https://getcomposer.org/installer -o composer-setup.php
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
composer --version
```

### 4. Instalar y preparar PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo systemctl status postgresql   # debe aparecer "active (running)"
```

Crea la base de datos y el usuario. Abre `psql` como superusuario `postgres`:

```bash
sudo -u postgres psql
```

Dentro de `psql` (cambia la contraseña por una real):

```sql
CREATE DATABASE laravel_api;
CREATE USER laravel_user WITH ENCRYPTED PASSWORD 'cambia_esta_password';

-- Que el usuario pueda crear tablas (migraciones):
ALTER DATABASE laravel_api OWNER TO laravel_user;
GRANT ALL PRIVILEGES ON DATABASE laravel_api TO laravel_user;
\connect laravel_api
GRANT ALL ON SCHEMA public TO laravel_user;

\q
```

Verifica la conexión del usuario:

```bash
psql -h 127.0.0.1 -U laravel_user -d laravel_api -W
# Si entra a "laravel_api=>", funciona. Sal con \q
```

> Si la conexión por contraseña falla, revisa `/etc/postgresql/12/main/pg_hba.conf`
> (que las conexiones locales usen `md5`) y `sudo systemctl restart postgresql`.

### 5. Clonar y configurar el proyecto

```bash
cd /var/www
git clone https://github.com/DavidCR724/Laravel_API.git
cd Laravel_API

composer install --no-dev --optimize-autoloader

cp .env.example .env
php artisan key:generate
```

Edita `.env` (`nano .env`) con los datos del paso 4:

```env
APP_NAME="Laravel API"
APP_ENV=production
APP_KEY=            # lo genera "php artisan key:generate" (no lo borres)
APP_DEBUG=false
APP_URL=http://IP_DEL_SERVIDOR

LOG_CHANNEL=stack
LOG_LEVEL=error

# --- Conexión a PostgreSQL (creada en el paso 4) ---
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=laravel_api
DB_USERNAME=laravel_user
DB_PASSWORD=cambia_esta_password

CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
```

> `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` deben coincidir EXACTAMENTE con
> lo creado en el paso 4. En producción usa `APP_ENV=production` y
> `APP_DEBUG=false`, y no dejes `APP_KEY` vacío.

### 6. Crear las tablas y cargar datos (migraciones + seeder)

```bash
php artisan migrate --seed --force
```

Crea las tablas (`users`, `articles`, `carts`, `cart_items`, `purchases`,
`purchase_items`, `reviews`, y `personal_access_tokens` de Sanctum) y carga los
datos de ejemplo (incluidos los usuarios `admin` y `cliente`).

> Si aparece "could not find driver": falta la extensión de PostgreSQL,
> `sudo apt install -y php7.4-pgsql` y reinicia PHP-FPM/servidor.

### 7. Permisos de escritura

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### 8a. Arranque rápido (pruebas)

```bash
php artisan serve --host=0.0.0.0 --port=8000
sudo ufw allow 8000/tcp   # si hay firewall
```

### 8b. Producción con Nginx + PHP-FPM

```bash
sudo apt install -y nginx php7.4-fpm
```

Sitio en `/etc/nginx/sites-available/laravel_api`:

```nginx
server {
    listen 80;
    server_name _;
    root /var/www/Laravel_API/public;

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php7.4-fpm.sock;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/laravel_api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Actualizar un servidor ya desplegado (git pull)

### ⚠️ Nota sobre `server.php`

El repo **ya incluye** `server.php` (el que necesita `php artisan serve`; su
ausencia causaba el error 500). Si en el servidor lo crearon a mano, ese archivo
está **sin seguimiento de git** y `git pull` fallaría con
*"untracked working tree files would be overwritten by merge: server.php"*.
Respáldalo antes de bajar los cambios (paso 1 de abajo).

### Actualización actual (invitados ven productos/reseñas + `server.php`)

Esta versión **sólo cambia código y rutas** (no hay dependencias ni tablas
nuevas), así que no se necesita `composer install` ni `migrate`:

```bash
cd /var/www/Laravel_API

# 1. Respalda el server.php que crearon a mano (para que git pull no falle)
mv server.php server.php.bak

# 2. Bajar los cambios (ahora sí trae el server.php del repo)
git pull origin main

# 3. (Opcional) Comparar ambos server.php; si son iguales, borra el respaldo
diff server.php server.php.bak && rm server.php.bak

# 4. Limpiar cachés (cambiaron las rutas)
php artisan optimize:clear

# 5. Recargar PHP para que tome el código nuevo
sudo systemctl reload php7.4-fpm     # si usas Nginx + PHP-FPM
# (si usas "php artisan serve", detén y vuelve a arrancar el comando)
```

### Regla general para futuras actualizaciones

Tras `git pull`, aplica sólo lo que cambió:

- Cambió `composer.json` (dependencia nueva) → `composer install` (o `composer update`).
- Hay migraciones nuevas → `php artisan migrate --force` (no borra datos).
- Siempre que cambien config o rutas → `php artisan optimize:clear` y recargar PHP.
- Reiniciar TODOS los datos desde cero (⚠️ borra lo existente): `php artisan migrate:fresh --seed --force`.

## Endpoints

Todos bajo el prefijo `/api` y devuelven **JSON estándar**. La columna
**Acceso** indica quién puede usar cada endpoint.

| Método | Ruta | Acción | Acceso |
|--------|------|--------|--------|
| POST | `/api/register` | Registro (crea cliente) | Público |
| POST | `/api/login` | Login (devuelve token) | Público |
| POST | `/api/logout` | Cierra sesión (revoca token) | Autenticado |
| GET | `/api/me` | Usuario actual | Autenticado |
| GET | `/api/articles` | Lista productos | Público |
| GET | `/api/articles/{id}` | Muestra producto (con reseñas) | Público |
| POST | `/api/articles` | Crea producto | **Admin** |
| PUT/PATCH | `/api/articles/{id}` | Actualiza producto | **Admin** |
| DELETE | `/api/articles/{id}` | Elimina producto | **Admin** |
| (CRUD) | `/api/users...` | Gestión de usuarios | **Admin** |
| GET | `/api/reviews` | Lista reseñas (`?article_id=`) | Público |
| GET | `/api/reviews/{id}` | Muestra reseña | Público |
| GET | `/api/articles/{id}/reviews` | Reseñas de un producto | Público |
| POST | `/api/reviews` | Crea reseña | **Cliente** |
| PUT/PATCH | `/api/reviews/{id}` | Actualiza reseña | Cliente/Admin |
| DELETE | `/api/reviews/{id}` | Elimina reseña | Cliente/Admin |
| (CRUD) | `/api/carts...` | Carrito | **Cliente** |
| (CRUD) | `/api/cart-items...` | Items del carrito | **Cliente** |
| GET | `/api/carts/{id}/items` | Items de un carrito | **Cliente** |
| GET | `/api/purchases` | Lista compras | **Cliente** |
| POST | `/api/purchases` | Compra (checkout de carrito) | **Cliente** |
| GET | `/api/purchases/{id}` | Muestra compra | **Cliente** |
| DELETE | `/api/purchases/{id}` | Elimina compra | **Cliente** |

> Los **invitados** (sin token) pueden ver productos completos y reseñas; las
> acciones de escritura sí requieren sesión y el rol correspondiente.
>
> Al mover items del carrito, el `costo_total` se **recalcula** solo. Una compra
> (`POST /api/purchases`) copia los artículos del carrito indicado, calcula el
> total y vacía el carrito.

## Ejemplos (cURL)

```bash
# Registro de un cliente (devuelve token)
curl -X POST http://127.0.0.1:8000/api/register \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"user":"nuevo","password":"secreto1"}'

# Login como admin (devuelve token)
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"user":"admin","password":"admin123"}'

# Crear un producto (requiere token de ADMIN)
curl -X POST http://127.0.0.1:8000/api/articles \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer <token_admin>" \
  -d '{"nombre":"Webcam HD","descripcion":"1080p","costo":599.9}'

# Crear carrito (requiere token de CLIENTE)
curl -X POST http://127.0.0.1:8000/api/carts \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer <token_cliente>" \
  -d '{"user_id":2}'

# Agregar artículo 1 al carrito 1 (CLIENTE)
curl -X POST http://127.0.0.1:8000/api/cart-items \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer <token_cliente>" \
  -d '{"cart_id":1,"article_id":1}'

# Checkout del carrito 1 (CLIENTE)
curl -X POST http://127.0.0.1:8000/api/purchases \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer <token_cliente>" \
  -d '{"cart_id":1}'

# Crear reseña del artículo 1 (CLIENTE)
curl -X POST http://127.0.0.1:8000/api/reviews \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer <token_cliente>" \
  -d '{"article_id":1,"user_id":2,"calificacion":5,"descripcion":"Muy buen producto"}'
```

## Convenciones REST

- Códigos: `200 OK`, `201 Created`, `401 No autenticado`, `403 Sin permiso`,
  `404 No encontrado`, `422 Datos inválidos`.
- Respuestas siempre en JSON. Errores de validación:

  ```json
  {
    "message": "Los datos proporcionados no son válidos.",
    "errors": { "campo": ["mensaje..."] }
  }
  ```

- La contraseña se guarda hasheada (`bcrypt`) y **nunca** se devuelve.
- El acceso se controla con Sanctum (`auth:sanctum`) y el middleware `role`.

## Estructura relevante

```
app/
├── Http/
│   ├── Controllers/   Auth, User, Article, Cart, CartItem, Purchase, Review
│   ├── Middleware/    CheckRole (autorización por rol)
│   └── Requests/      Validación (Login/Register + Store/Update * Request)
└── Models/            User (HasApiTokens), Article, Cart, CartItem,
                       Purchase, PurchaseItem, Review
config/
├── auth.php           Guard por defecto = sanctum
└── sanctum.php        Configuración de Sanctum
database/
├── migrations/        Definición de las tablas
└── seeders/           DatabaseSeeder (datos + usuarios de ejemplo)
routes/
└── api.php            Endpoints RESTful con auth y permisos por rol
public/index.php       Punto de entrada web (Nginx/Apache)
server.php             Router para "php artisan serve" (built-in server de PHP)
```
