# API RESTful e-commerce (Laravel 8 + PostgreSQL)

API tipo e-commerce con arquitectura **RESTful** construida en **Laravel 8** y
respaldada por **PostgreSQL** a través del ORM **Eloquent**.

> Versión anterior: el proyecto nació como una API que trabajaba **en memoria**
> (sin BD) para probar los endpoints. Esta versión ya está **conectada a una base
> de datos PostgreSQL** mediante Eloquent, y añade **compras** y **reseñas**.
> Toda la capa en memoria (Cache como almacén de datos) fue eliminada.

## Entorno / Versiones

| Componente | Versión |
|------------|---------|
| PHP        | **7.4.3** |
| Laravel    | **8.x** (`laravel/framework ^8.75`) |
| PostgreSQL | 12+ |
| Ubuntu     | 20.04 (server) |

> **¿Por qué Laravel 8?** Es la última versión del framework compatible con
> **PHP 7.4**. Laravel 9+ exige PHP ≥ 8.0.

## Entidades

- **User**: `id`, `user`, `password` (hasheada), `rol`
- **Article** (producto): `id`, `nombre`, `descripcion`, `costo`
- **Cart**: `id`, `user_id`, `costo_total` (calculado a partir de sus items)
- **CartItem**: `id`, `cart_id`, `article_id`
- **Purchase** (compra): `id`, `user_id`, `total`
- **PurchaseItem**: `id`, `purchase_id`, `article_id`, `costo` (precio al comprar)
- **Review** (reseña): `id`, `article_id`, `user_id`, `calificacion` (1-5), `descripcion`

### Relaciones

- Un **User** tiene muchos carritos, compras y reseñas.
- Un **Article** tiene muchos items de carrito, items de compra y reseñas.
- Un **Cart** pertenece a un User y tiene muchos **CartItem**.
- Una **Purchase** pertenece a un User y tiene muchos **PurchaseItem**.
- Una **Review** pertenece a un Article y a un User (el cliente que comenta).

> Las claves foráneas usan borrado en cascada (`ON DELETE CASCADE`).

## Requisitos

- PHP **7.4** con las extensiones: `mbstring`, `xml`, `curl`, `bcmath`,
  **`pdo_pgsql` / `pgsql`**.
- [Composer](https://getcomposer.org/).
- **PostgreSQL** 12 o superior.

## Instalación

```bash
# 1. Dependencias
composer install

# 2. Entorno
cp .env.example .env      # en Windows: copy .env.example .env

# 3. Configura la conexión a PostgreSQL en .env
#    DB_CONNECTION=pgsql
#    DB_HOST=127.0.0.1
#    DB_PORT=5432
#    DB_DATABASE=laravel_api
#    DB_USERNAME=postgres
#    DB_PASSWORD=tu_password

# 4. Clave de la aplicación
php artisan key:generate

# 5. Crea las tablas y carga datos de ejemplo
php artisan migrate --seed
```

Levantar en desarrollo:

```bash
php artisan serve
```

La API queda en `http://127.0.0.1:8000/api`.

### Datos de ejemplo (seeder)

Tras `migrate --seed` se crean:

| Usuario   | Contraseña   | Rol     |
|-----------|--------------|---------|
| `admin`   | `admin123`   | admin   |
| `cliente` | `cliente123` | cliente |

Más 3 artículos, 1 carrito con items, 1 compra y 2 reseñas de ejemplo.

Para reconstruir la base desde cero: `php artisan migrate:fresh --seed`.

## Despliegue en Ubuntu Server 20.04

Instrucciones para levantar la API en un **Ubuntu Server 20.04** limpio.
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

# Crear la base de datos y el usuario de la aplicación
sudo -u postgres psql <<'SQL'
CREATE DATABASE laravel_api;
CREATE USER laravel_user WITH ENCRYPTED PASSWORD 'cambia_esta_password';
GRANT ALL PRIVILEGES ON DATABASE laravel_api TO laravel_user;
SQL
```

### 5. Clonar y configurar el proyecto

```bash
cd /var/www
git clone https://github.com/DavidCR724/Laravel_API.git
cd Laravel_API

composer install --no-dev --optimize-autoloader

cp .env.example .env
php artisan key:generate
```

Edita `.env` con los datos de la base creada:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=laravel_api
DB_USERNAME=laravel_user
DB_PASSWORD=cambia_esta_password
```

### 6. Migrar y sembrar

```bash
php artisan migrate --seed --force
```

### 7. Permisos de escritura

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### 8a. Arranque rápido (pruebas)

```bash
php artisan serve --host=0.0.0.0 --port=8000
# Abrir el puerto si hay firewall:
sudo ufw allow 8000/tcp
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

En producción, en `.env`: `APP_ENV=production` y `APP_DEBUG=false`.

## Endpoints

Todos bajo el prefijo `/api` y devuelven **JSON estándar**.

| Método | Ruta                        | Acción                              |
|--------|-----------------------------|-------------------------------------|
| GET    | `/api`                      | Estado / índice de la API           |
| GET    | `/api/users`                | Lista usuarios                      |
| POST   | `/api/users`                | Crea usuario                        |
| GET    | `/api/users/{id}`           | Muestra usuario                     |
| PUT/PATCH | `/api/users/{id}`        | Actualiza usuario                   |
| DELETE | `/api/users/{id}`           | Elimina usuario                     |
| GET    | `/api/articles`             | Lista artículos                     |
| POST   | `/api/articles`             | Crea artículo                       |
| GET    | `/api/articles/{id}`        | Muestra artículo (con reseñas)      |
| PUT/PATCH | `/api/articles/{id}`     | Actualiza artículo                  |
| DELETE | `/api/articles/{id}`        | Elimina artículo                    |
| GET    | `/api/articles/{id}/reviews`| Reseñas de un artículo              |
| GET    | `/api/carts`                | Lista carritos                      |
| POST   | `/api/carts`                | Crea carrito                        |
| GET    | `/api/carts/{id}`           | Muestra carrito con items           |
| PUT/PATCH | `/api/carts/{id}`        | Actualiza carrito                   |
| DELETE | `/api/carts/{id}`           | Elimina carrito (y sus items)       |
| GET    | `/api/carts/{id}/items`     | Items de un carrito                 |
| GET    | `/api/cart-items`           | Lista items (`?cart_id=` opcional)  |
| POST   | `/api/cart-items`           | Agrega artículo a un carrito        |
| GET    | `/api/cart-items/{id}`      | Muestra item                        |
| PUT/PATCH | `/api/cart-items/{id}`   | Actualiza item                      |
| DELETE | `/api/cart-items/{id}`      | Elimina item                        |
| GET    | `/api/purchases`            | Lista compras                       |
| POST   | `/api/purchases`            | Genera compra (checkout de carrito) |
| GET    | `/api/purchases/{id}`       | Muestra compra con items            |
| DELETE | `/api/purchases/{id}`       | Elimina compra                      |
| GET    | `/api/reviews`              | Lista reseñas (`?article_id=` opc.) |
| POST   | `/api/reviews`              | Crea reseña                         |
| GET    | `/api/reviews/{id}`         | Muestra reseña                      |
| PUT/PATCH | `/api/reviews/{id}`      | Actualiza reseña                    |
| DELETE | `/api/reviews/{id}`         | Elimina reseña                      |

> Al mover items del carrito, el `costo_total` se **recalcula** solo.
> Una compra (`POST /api/purchases`) toma los artículos del carrito indicado,
> los copia a la compra con su costo, calcula el total y vacía el carrito.

## Ejemplos (cURL)

```bash
# Crear un artículo
curl -X POST http://127.0.0.1:8000/api/articles \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"nombre":"Webcam HD","descripcion":"1080p","costo":599.9}'

# Crear un carrito para el usuario 2 (cliente)
curl -X POST http://127.0.0.1:8000/api/carts \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"user_id":2}'

# Agregar el artículo 1 al carrito 1
curl -X POST http://127.0.0.1:8000/api/cart-items \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"cart_id":1,"article_id":1}'

# Generar la compra a partir del carrito 1 (checkout)
curl -X POST http://127.0.0.1:8000/api/purchases \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"cart_id":1}'

# Crear una reseña del artículo 1 por el usuario 2
curl -X POST http://127.0.0.1:8000/api/reviews \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"article_id":1,"user_id":2,"calificacion":5,"descripcion":"Muy buen producto"}'
```

## Convenciones REST

- Códigos: `200 OK`, `201 Created`, `404 Not Found`, `422 Unprocessable Entity`.
- Respuestas siempre en JSON. Errores de validación:

  ```json
  {
    "message": "Los datos proporcionados no son válidos.",
    "errors": { "campo": ["mensaje..."] }
  }
  ```

- La contraseña se guarda hasheada (`bcrypt`) y **nunca** se devuelve.
- Aún **no** hay autenticación (JWT/roles): eso queda para una fase posterior.

## Estructura relevante

```
app/
├── Http/
│   ├── Controllers/   User, Article, Cart, CartItem, Purchase, Review
│   └── Requests/      Validación (Store/Update * Request)
└── Models/            User, Article, Cart, CartItem, Purchase, PurchaseItem, Review (Eloquent)
database/
├── migrations/        Definición de las 7 tablas
└── seeders/           DatabaseSeeder (datos de ejemplo)
routes/
└── api.php            Endpoints RESTful (apiResource)
```
