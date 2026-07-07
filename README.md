# API RESTful e-commerce en memoria (Laravel — sin base de datos)

API tipo e-commerce con arquitectura puramente **RESTful** que corre
**completamente en memoria**, sin conexión a ninguna base de datos. El estado
persiste entre peticiones HTTP usando la fachada **`Cache`** de Laravel (driver
`file`), a través de un repositorio en memoria (`App\Support\MemoryStore`).

## Entorno / Versiones

| Componente | Versión |
|------------|---------|
| PHP        | **7.4.3** |
| Laravel    | **8.x** (`laravel/framework ^8.75`) |
| Ubuntu     | 20.04 |

> **¿Por qué Laravel 8?** Es la última versión del framework compatible con
> **PHP 7.4**. Laravel 9 en adelante exige PHP ≥ 8.0, por lo que se fija Laravel 8
> para respetar la versión de PHP indicada.
>
> No se usa MongoDB ni ningún motor de base de datos: la restricción principal es
> operar **sin BD**, por lo que la versión de Mongo del entorno no aplica aquí.

## Entidades

- **User**: `id`, `user`, `password` (se guarda hasheada), `rol`
- **Article**: `id`, `nombre`, `descripcion`, `costo`
- **Cart**: `id`, `user_id`, `costo_total` (calculado a partir de sus items)
- **CartItem**: `id`, `cart_id`, `article_id`

## Instalación

Requiere PHP 7.4 y [Composer](https://getcomposer.org/).

```bash
# 1. Instalar dependencias
composer install

# 2. Preparar el archivo de entorno
cp .env.example .env      # en Windows: copy .env.example .env

# 3. Generar la clave de la aplicación
php artisan key:generate

# 4. Levantar el servidor de desarrollo
php artisan serve
```

La API queda disponible en `http://127.0.0.1:8000`.

### Persistencia en memoria

- El estado se guarda con `Cache` usando el driver **`file`**
  (`storage/framework/cache`), de modo que **sobrevive entre peticiones HTTP**
  sin usar base de datos.
- Al primer arranque se cargan datos de ejemplo automáticamente (usuarios,
  artículos y un carrito).
- Para **reiniciar** los datos de ejemplo:

  ```bash
  php artisan memory:seed
  ```

- Para **vaciar** por completo el estado en memoria:

  ```bash
  php artisan cache:clear
  ```

### Datos de ejemplo precargados

| Usuario   | Contraseña   | Rol     |
|-----------|--------------|---------|
| `admin`   | `admin123`   | admin   |
| `cliente` | `cliente123` | cliente |

## Despliegue en Ubuntu Server 20.04

Instrucciones para levantar la API en un **Ubuntu Server 20.04** limpio
(esta versión de Ubuntu trae **PHP 7.4** en sus repositorios oficiales, que es
justo la versión requerida).

### 1. Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar PHP 7.4 y las extensiones necesarias

```bash
sudo apt install -y php7.4-cli php7.4-common php7.4-mbstring \
  php7.4-xml php7.4-curl php7.4-zip php7.4-bcmath unzip git

# Verifica la versión (debe ser 7.4.x)
php -v
```

> No se requieren extensiones de base de datos (mysql, pgsql, mongodb): la API
> corre **en memoria** usando la cache en disco.

### 3. Instalar Composer

```bash
cd /tmp
curl -sS https://getcomposer.org/installer -o composer-setup.php
sudo php composer-setup.php --install-dir=/usr/local/bin --filename=composer
composer --version
```

### 4. Clonar el proyecto

```bash
cd /var/www        # o el directorio que prefieras
git clone https://github.com/DavidCR724/Laravel_API.git
cd Laravel_API
```

### 5. Instalar dependencias y configurar

```bash
composer install --no-dev --optimize-autoloader

cp .env.example .env
php artisan key:generate
```

### 6. Permisos de escritura (la persistencia usa `storage/`)

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### 7a. Arranque rápido (desarrollo / pruebas)

```bash
# Escucha en todas las interfaces para poder acceder desde fuera del servidor
php artisan serve --host=0.0.0.0 --port=8000
```

La API queda en `http://IP_DEL_SERVIDOR:8000/api`.
Si usas firewall, abre el puerto: `sudo ufw allow 8000/tcp`.

### 7b. Producción con Nginx + PHP-FPM (recomendado)

```bash
sudo apt install -y nginx php7.4-fpm
```

Crea el sitio en `/etc/nginx/sites-available/laravel_api`:

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

Activa el sitio y recarga Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/laravel_api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

La API queda accesible en `http://IP_DEL_SERVIDOR/api`.

### Notas de despliegue

- Para reiniciar los datos de ejemplo en el servidor:
  `php artisan memory:seed`
- Para vaciar el estado en memoria: `php artisan cache:clear`
- En producción, ajusta en `.env`: `APP_ENV=production` y `APP_DEBUG=false`.

## Endpoints

Todos bajo el prefijo `/api` y devuelven **JSON estándar**.

| Método | Ruta                       | Acción                         |
|--------|----------------------------|--------------------------------|
| GET    | `/api`                     | Estado / índice de la API      |
| GET    | `/api/users`               | Lista usuarios                 |
| POST   | `/api/users`               | Crea usuario                   |
| GET    | `/api/users/{id}`          | Muestra usuario                |
| PUT/PATCH | `/api/users/{id}`       | Actualiza usuario              |
| DELETE | `/api/users/{id}`          | Elimina usuario                |
| GET    | `/api/articles`            | Lista artículos                |
| POST   | `/api/articles`            | Crea artículo                  |
| GET    | `/api/articles/{id}`       | Muestra artículo               |
| PUT/PATCH | `/api/articles/{id}`    | Actualiza artículo             |
| DELETE | `/api/articles/{id}`       | Elimina artículo               |
| GET    | `/api/carts`               | Lista carritos                 |
| POST   | `/api/carts`               | Crea carrito                   |
| GET    | `/api/carts/{id}`          | Muestra carrito con sus items  |
| PUT/PATCH | `/api/carts/{id}`       | Actualiza carrito              |
| DELETE | `/api/carts/{id}`          | Elimina carrito (y sus items)  |
| GET    | `/api/carts/{id}/items`    | Items de un carrito            |
| GET    | `/api/cart-items`          | Lista items (`?cart_id=` opc.) |
| POST   | `/api/cart-items`          | Agrega artículo a un carrito   |
| GET    | `/api/cart-items/{id}`     | Muestra item                   |
| PUT/PATCH | `/api/cart-items/{id}`  | Actualiza item                 |
| DELETE | `/api/cart-items/{id}`     | Elimina item                   |

> Al agregar/actualizar/eliminar items, el `costo_total` del carrito se
> **recalcula automáticamente** sumando el `costo` de los artículos.

## Ejemplos (cURL)

```bash
# Crear un usuario
curl -X POST http://127.0.0.1:8000/api/users \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"user":"nuevo","password":"secreto1","rol":"cliente"}'

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

# Ver el carrito con sus items y total recalculado
curl http://127.0.0.1:8000/api/carts/1 -H "Accept: application/json"
```

## Convenciones REST

- Códigos de estado: `200 OK`, `201 Created`, `404 Not Found`,
  `422 Unprocessable Entity` (validación).
- Respuestas siempre en JSON. Los errores de validación siguen el formato:

  ```json
  {
    "message": "Los datos proporcionados no son válidos.",
    "errors": { "campo": ["mensaje..."] }
  }
  ```

- La contraseña se guarda hasheada (`bcrypt`) y **nunca** se devuelve en las
  respuestas.

## Estructura relevante

```
app/
├── Http/
│   ├── Controllers/   UserController, ArticleController, CartController, CartItemController
│   └── Requests/      Validación (Store/Update * Request)
├── Services/
│   └── CartService.php   Cálculo de totales y carrito con items
└── Support/
    ├── MemoryStore.php   Repositorio en memoria (fachada Cache)
    └── MemorySeeder.php  Datos de ejemplo iniciales
routes/
└── api.php            Endpoints RESTful (apiResource)
```
