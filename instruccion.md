# Preparar el entorno en Ubuntu Server (PHP 8.5.3 instalado, proyecto en PHP 7.4)

Guía para **preparar el entorno después de un `git clone`** en un **Ubuntu Server**
cuyo PHP por defecto es **8.5.3**, tomando en cuenta que **el proyecto está hecho
para PHP 7.4**.

## El problema (por qué no basta con `composer install`)

El `composer.json` del proyecto declara:

```json
"require": { "php": "^7.4", ... }
```

`^7.4` significa **>= 7.4.0 y < 8.0.0**. La versión **8.5.3 NO entra** en ese rango,
por lo que:

- `composer install` **falla** con un error de *platform check* parecido a:
  *"…your php version (8.5.3) does not satisfy that requirement."*
- Aunque se fuerce la instalación, **Laravel 8 no está probado en PHP 8.2+**, así
  que en ejecución pueden salir *deprecations* o errores.

> **Recomendación:** instalar y usar **PHP 7.4** para este proyecto (Opción A). La
> Opción B (forzar sobre 8.5) es un parche que puede fallar en tiempo de ejecución.

**Supuesto:** ya hiciste `git clone` y estás dentro de la carpeta del proyecto.

## Paso 0 — Comprobar la versión

```bash
php -v      # mostrará 8.5.3
```

---

## Opción A (recomendada) — Instalar PHP 7.4 en paralelo

No hace falta desinstalar PHP 8.5; se instala el 7.4 **junto a él**.

### A.1 Instalar PHP 7.4 y las extensiones necesarias

Primero identifica tu versión de Ubuntu:

```bash
lsb_release -a
```

**En Ubuntu 20.04 (focal) — que es la versión objetivo del proyecto — PHP 7.4 ya
está en los repositorios oficiales, así que NO necesitas ningún PPA.** Instálalo
directo:

```bash
sudo apt update
sudo apt install -y php7.4 php7.4-cli php7.4-common php7.4-mbstring \
  php7.4-xml php7.4-curl php7.4-bcmath php7.4-pgsql

php7.4 -v      # debe mostrar 7.4.x (Ubuntu 20.04 trae 7.4.3)
```

> **Evita `add-apt-repository ppa:ondrej/php`**: ese comando contacta a Launchpad y
> a un *keyserver*, y en VMs con red limitada suele **tardar mucho o dar timeout**.
> En Ubuntu 20.04 no hace falta, porque 7.4 ya viene en los repos por defecto.

> Si vas a servir con **Nginx** (producción), instala también `php7.4-fpm`
> (ver la sección de Nginx más abajo).

#### Solo si tu Ubuntu es más nuevo (22.04+) y sí necesitas el PPA

En esas versiones el PHP por defecto es 8.x y 7.4 no está en los repos oficiales.
Agrega el PPA **manualmente** (más fiable que `add-apt-repository`, que es el que
te da timeout):

```bash
sudo apt install -y ca-certificates curl gnupg

# Importa la llave del PPA por HTTPS (evita el keyserver lento)
curl -fsSL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x4F4EA0AAE5267A6C" \
  | sudo gpg --dearmor -o /usr/share/keyrings/ondrej-php.gpg

# Agrega el repositorio apuntando a esa llave
. /etc/os-release
echo "deb [signed-by=/usr/share/keyrings/ondrej-php.gpg] https://ppa.launchpadcontent.net/ondrej/php/ubuntu ${VERSION_CODENAME} main" \
  | sudo tee /etc/apt/sources.list.d/ondrej-php.list

sudo apt update
sudo apt install -y php7.4 php7.4-cli php7.4-common php7.4-mbstring \
  php7.4-xml php7.4-curl php7.4-bcmath php7.4-pgsql
```

> Si ya tenías el PPA (por eso tienes PHP 8.5), quizá solo baste
> `sudo apt update && sudo apt install php7.4 …` sin volver a agregarlo.

### A.2 Elegir cómo usar PHP 7.4

**Opción 1 — Usar `php7.4` explícitamente** (no cambia el PHP del sistema):

```bash
php7.4 $(which composer) install
php7.4 artisan key:generate
php7.4 artisan migrate --seed
php7.4 artisan serve --host=0.0.0.0 --port=8000
```

**Opción 2 — Poner PHP 7.4 como predeterminado** (recomendable si el servidor es
solo para este proyecto). Así `php` y `composer` ya usan 7.4:

```bash
sudo update-alternatives --set php /usr/bin/php7.4
php -v      # ahora 7.4.x
```

> Para volver a 8.5 más adelante: `sudo update-alternatives --config php` y elige
> la versión 8.5.

Continúa en **"Pasos comunes"**.

---

## Opción B (rápida, NO recomendada) — Forzar sobre PHP 8.5

Úsala solo si **no puedes** instalar PHP 7.4. Puede romper en ejecución.

```bash
composer install --ignore-platform-req=php
```

O fijar la plataforma en `composer.json` para que Composer resuelva como 7.4:

```json
"config": {
    "platform": { "php": "7.4.3" }
}
```

…y luego `composer install`.

> ⚠️ **Advertencia:** esto solo evita el error de Composer; el código seguirá
> ejecutándose en PHP 8.5. Laravel 8 no está diseñado para PHP 8.2+, así que pueden
> aparecer errores. Es un parche temporal.

---

## Pasos comunes para preparar el entorno

Cuando `php -v` (o `php7.4`) ya sea **7.4.x**. Si elegiste la Opción 1 (A.2),
antepón `php7.4` a cada comando `php …` y `composer …`.

```bash
# 1. Instalar dependencias (Composer + Laravel + Sanctum)
composer install

# 2. Crear el archivo de entorno
cp .env.example .env

# 3. Configurar PostgreSQL en .env
#    DB_CONNECTION=pgsql
#    DB_HOST=127.0.0.1
#    DB_PORT=5432
#    DB_DATABASE=laravel_api
#    DB_USERNAME=tu_usuario
#    DB_PASSWORD=tu_password

# 4. Generar la clave de la aplicación
php artisan key:generate

# 5. Crear las tablas y cargar datos de ejemplo
php artisan migrate --seed

# 6. Permisos de escritura
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# 7. Levantar (modo pruebas)
php artisan serve --host=0.0.0.0 --port=8000
```

> El paso 3 requiere tener PostgreSQL instalado y una base de datos creada. Si aún
> no está, sigue la sección **"Instalar y preparar PostgreSQL"** del `README.md`.

## Nota para producción con Nginx + PHP-FPM

Si sirves con Nginx, instala el FPM de la versión 7.4 y apunta el sitio a su socket:

```bash
sudo apt install -y php7.4-fpm
```

En el `server { … }` de Nginx, el bloque de PHP debe apuntar a **php7.4**:

```nginx
location ~ \.php$ {
    include snippets/fastcgi-php.conf;
    fastcgi_pass unix:/run/php/php7.4-fpm.sock;   # <-- 7.4, no 8.5
}
```

Luego:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl reload php7.4-fpm
```
