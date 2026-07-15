# Cómo levantar el proyecto (guía para el equipo)

Esta guía es para cualquiera del equipo que no ha bajado los cambios recientes
y necesita dejar el proyecto corriendo desde cero: backend (Laravel API) +
panel de administración (`frontend-admin`, React + Vite).

## 0. Bajar los cambios

```bash
cd Laravel_API
git status          # revisa que no tengas cambios locales sin guardar
git pull origin main
```

> ⚠️ Si `git pull` falla con *"untracked working tree files would be
> overwritten by merge"* para `server.php` o `composer.lock`: alguien corrió
> `composer install` o creó `server.php` a mano en esa copia antes de que esos
> archivos se subieran al repo, y ahora chocan. Respáldalos y vuelve a intentar:
>
> ```bash
> mv composer.lock composer.lock.bak   # si aplica
> mv server.php server.php.bak         # si aplica
> git pull origin main
> ```

## 1. Backend (Laravel API)

### Requisitos

- **PHP 7.4** con extensiones: `mbstring`, `xml`, `curl`, `bcmath`, `pdo_pgsql`, `pgsql`.
- [Composer](https://getcomposer.org/).
- **PostgreSQL** 12 o superior, corriendo y accesible.

Si no tienes PHP 7.4 instalado:

- **Windows** (sin permisos de administrador): descarga el zip de
  `https://windows.php.net/downloads/releases/` (o `archives/` para 7.4.3),
  extráelo a una carpeta (ej. `C:\tools\php-7.4.3`), copia `php.ini-development`
  a `php.ini` y en él descomenta `extension_dir`, `curl`, `fileinfo`,
  `mbstring`, `openssl`, `pdo_pgsql`, `pgsql`. Agrega esa carpeta al `PATH`.
- **Ubuntu**: `sudo apt install -y php7.4-cli php7.4-common php7.4-mbstring php7.4-xml php7.4-curl php7.4-bcmath php7.4-pgsql unzip git`

Composer portátil (si no quieres instalarlo con privilegios):

```bash
curl -sSL -o composer.phar https://getcomposer.org/composer-stable.phar
php composer.phar --version
```

### Pasos

```bash
# 1. Dependencias PHP
composer install                 # o: php composer.phar install

# 2. Entorno
cp .env.example .env              # Windows: copy .env.example .env

# 3. Edita .env: configura DB_* para tu PostgreSQL local
#    DB_CONNECTION=pgsql
#    DB_HOST=127.0.0.1
#    DB_PORT=5432
#    DB_DATABASE=laravel_api
#    DB_USERNAME=postgres
#    DB_PASSWORD=<tu password>
#
#    (Opcional, para el Asistente IA) agrega tu propia GEMINI_API_KEY,
#    generada en https://aistudio.google.com/app/apikey (cualquier cuenta de
#    Google sirve). Deja GEMINI_MODEL=gemini-flash-lite-latest (ya viene así
#    por defecto): modelos "viejos" como gemini-2.0-flash dan
#    "Quota exceeded... limit: 0" porque Google les quitó la cuota gratuita
#    para keys nuevas.

# 4. Clave de la aplicación
php artisan key:generate

# 5. Crea las tablas y carga datos de ejemplo
php artisan migrate --seed
```

Levanta el servidor:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

La API queda en `http://127.0.0.1:8000/api` (o en la IP de tu máquina si otra
persona del equipo va a consumirla desde otra computadora).

Usuarios de prueba (creados por el seeder):

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | admin |
| `cliente` | `cliente123` | cliente |

## 2. Frontend — Panel de administración (`frontend-admin`)

### Requisitos

- **Node.js 18 o superior** (se probó con Node 20). Si no lo tienes:
  - **Windows** (portátil, sin admin): descarga el zip
    `node-vXX-win-x64.zip` de `https://nodejs.org/dist/latest-v20.x/`,
    extráelo (ej. `C:\tools\node-20`) y agrégalo al `PATH`.
  - **Ubuntu**: `sudo apt install -y nodejs npm` (o usa `nvm` para una versión más reciente).

### Pasos

```bash
cd frontend-admin
npm install
npm run dev       # abre http://localhost:5174
```

En la pantalla de login, despliega "Dirección de la API" y escribe la URL
donde corre el backend:

- `http://localhost:8000` si el backend corre en la misma máquina.
- `http://IP_DE_LA_MAQUINA:8000` si el backend corre en otra máquina/VM del
  equipo (asegúrate de que ese backend use `--host=0.0.0.0`, no `127.0.0.1`).

Inicia sesión con `admin` / `admin123`. Solo el rol `admin` puede entrar a
este panel; cualquier otro rol es rechazado a propósito.

## 3. Problemas comunes

- **403 "No tienes permiso para realizar esta acción"** en Estadísticas o
  Historial de ventas: esa persona del equipo no bajó los últimos cambios de
  `routes/api.php` (o le falta `php artisan optimize:clear` tras el pull).
- **No se pudo conectar con la API**: revisa que el backend esté corriendo y
  que la URL en el login sea la correcta (y alcanzable en red si es otra
  máquina).
- **Asistente IA: "Quota exceeded... limit: 0"**: no es un problema de cuenta,
  es el **modelo**. Google puso la cuota gratuita en 0 para modelos "viejos"
  (`gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-*`) en keys nuevas;
  solo los modelos recientes tienen cuota gratis real. Solución: en el `.env`
  deja (o pon) `GEMINI_MODEL=gemini-flash-lite-latest` — es el valor por
  defecto del proyecto y ya se probó que funciona con cuota gratuita. Tras
  cambiarlo, corre `php artisan config:clear` y reinicia el servidor.
- **Asistente IA: "SSL certificate problem: unable to get local issuer
  certificate"** (típico con el PHP portátil en Windows, sin admin): PHP no
  encuentra un archivo de certificados CA para verificar HTTPS salientes.
  Descarga `https://curl.se/ca/cacert.pem` a la carpeta de PHP (ej.
  `C:\tools\php-7.4.3\cacert.pem`) y en `php.ini` define:
  ```ini
  [curl]
  curl.cainfo = "C:\tools\php-7.4.3\cacert.pem"
  [openssl]
  openssl.cafile = "C:\tools\php-7.4.3\cacert.pem"
  ```
  Reinicia `php artisan serve` después de editar `php.ini`.
- **`git pull` falla por archivos sin seguimiento** (`server.php`,
  `composer.lock`): ver el aviso de la sección 0.
