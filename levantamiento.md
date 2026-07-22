# Cómo levantar el proyecto (guía para el equipo)

Esta guía es para cualquiera del equipo que no ha bajado los cambios recientes
y necesita dejar el proyecto corriendo desde cero: backend (Laravel API) +
panel de administración (`frontend-admin`, React + Vite) + app móvil
(`mobile`, React Native + Expo).

> ¿Quieres levantar las **tres piezas a la vez desde un Ubuntu Server**? Salta a
> la [sección 4](#4-levantar-todo-junto-desde-ubuntu-server).

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

> Nota: el alta de usuarios ya **no** se hace desde el panel. Los clientes se
> registran desde la app móvil; el admin solo edita, bloquea o elimina, y no
> cambia contraseñas.

## 3. App móvil (cliente) — React Native + Expo

Carpeta `mobile/`. Es la app del lado del cliente (invitado o cliente): ver
catálogo y reseñas, carrito, compras, reseñar lo comprado, y IA
(recomendaciones + chatbot). Ver `mobile/README.md` para el detalle.

Al finalizar la compra hay una **pasarela de pagos simulada** con dos formas de
pago: **tarjeta** (formulario simulado) y **efectivo** (genera un **código de
barras** tipo OXXO Pay). El pedido pasa por los estados
`pendiente_pago → pagado → en_transito → completado` (o `cancelado`); desde
**Mis pedidos** el cliente puede confirmar un pago pendiente, y el admin avanza
el envío desde el panel. Nada se cobra de verdad: todo el flujo es simulado.

### Requisitos

- **Node.js 18+** y la app **Expo Go** en el teléfono (o un emulador).
- El backend Laravel corriendo con `--host=0.0.0.0` (para que el teléfono lo
  alcance en la red Wi-Fi).

### Pasos

```bash
cd mobile
npm install
npx expo start        # escanea el QR con Expo Go
```

En la app: pestaña **Cuenta → Servidor de la API**, escribe `http://TU_IP:8000`
(la IP de la PC donde corre Laravel, NO `localhost`) y guarda. Usuarios de
prueba: `cliente` / `cliente123`, o `cliente1`…`cliente10` / `password`.

## 4. Levantar todo junto desde Ubuntu Server

Escenario: un **Ubuntu Server (sin escritorio)** donde corren las tres piezas a
la vez, y un **teléfono con Expo Go** para la app. El teléfono no ejecuta código
del server: solo se conecta al backend (por la IP del server) y al bundler de
Expo.

### 4.1 Instalar todo lo necesario

```bash
sudo apt update
# Backend (PHP 7.4 + extensiones) y utilidades
sudo apt install -y php7.4-cli php7.4-common php7.4-mbstring php7.4-xml \
  php7.4-curl php7.4-bcmath php7.4-pgsql unzip git tmux
# Node.js 18+ (para el panel admin y Expo). Con nvm evitas versiones viejas de apt:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
. ~/.nvm/nvm.sh && nvm install 20
# PostgreSQL
sudo apt install -y postgresql
sudo systemctl enable --now postgresql
```

Crea la base de datos y define la contraseña del usuario `postgres`:

```bash
sudo -u postgres psql -c "CREATE DATABASE laravel_api;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'tu_password';"
```

Composer (portátil, sin privilegios):

```bash
curl -sSL -o composer.phar https://getcomposer.org/composer-stable.phar
```

### 4.2 Preparar el proyecto (una sola vez)

```bash
cd Laravel_API
php composer.phar install
cp .env.example .env
# Edita .env: DB_DATABASE=laravel_api, DB_USERNAME=postgres, DB_PASSWORD=tu_password
# (y opcionalmente GEMINI_API_KEY para la IA)
php artisan key:generate
php artisan migrate --seed

cd frontend-admin && npm install && cd ..
cd mobile        && npm install && cd ..
```

### 4.3 Averigua la IP del server y abre los puertos

```bash
IP=$(hostname -I | awk '{print $1}'); echo "IP del server: $IP"

sudo ufw allow 8000/tcp   # API Laravel
sudo ufw allow 5174/tcp   # panel admin (Vite)
sudo ufw allow 8081/tcp   # bundler de Expo (solo en modo LAN)
```

> Con Expo en **modo túnel** (ver abajo) no necesitas abrir el 8081: el tráfico
> del teléfono sale por el túnel de Expo, no por tu red.

### 4.4 Opción A (recomendada): las tres en `tmux`

`tmux` te deja tener varias terminales en una sola sesión SSH y **ver el QR de
Expo en vivo**. Además sigue corriendo aunque cierres el SSH.

```bash
tmux new -s tienda
```

Dentro de tmux, crea una ventana por servicio (**Ctrl-b** y luego **c** para una
ventana nueva; **Ctrl-b** y un número para cambiar entre ellas):

```bash
# Ventana 0 — Backend
php artisan serve --host=0.0.0.0 --port=8000

# Ventana 1 — Panel admin (Vite ya escucha en 0.0.0.0:5174)
cd frontend-admin && npm run dev

# Ventana 2 — App móvil (Expo)
cd mobile && npx expo start --tunnel
```

- Salir dejando todo corriendo (*detach*): **Ctrl-b** y luego **d**.
- Volver a entrar: `tmux attach -t tienda`.
- Cerrar todo: `tmux kill-session -t tienda`.

### 4.5 Opción B: un script que las levanta en segundo plano

Créalo **en el server** (así queda con saltos de línea Unix) y hazlo ejecutable:

```bash
cat > start-all.sh <<'EOF'
#!/usr/bin/env bash
# Levanta backend + panel admin + Expo. Modo Expo: túnel por defecto.
#   ./start-all.sh            -> Expo túnel (teléfono en cualquier red)
#   EXPO_MODE=lan ./start-all.sh -> Expo LAN (mismo Wi-Fi que el server)
ROOT="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$ROOT/logs"
IP="$(hostname -I | awk '{print $1}')"

php artisan serve --host=0.0.0.0 --port=8000 > "$ROOT/logs/backend.log" 2>&1 &
echo $! > "$ROOT/logs/backend.pid"

( cd "$ROOT/frontend-admin" && npm run dev ) > "$ROOT/logs/admin.log" 2>&1 &
echo $! > "$ROOT/logs/admin.pid"

if [ "${EXPO_MODE:-tunnel}" = "lan" ]; then
  ( cd "$ROOT/mobile" && REACT_NATIVE_PACKAGER_HOSTNAME="$IP" npx expo start --lan ) \
    > "$ROOT/logs/mobile.log" 2>&1 &
else
  ( cd "$ROOT/mobile" && npx expo start --tunnel ) > "$ROOT/logs/mobile.log" 2>&1 &
fi
echo $! > "$ROOT/logs/mobile.pid"

echo "Levantado. IP del server: $IP"
echo "  API   : http://$IP:8000/api      (logs/backend.log)"
echo "  Admin : http://$IP:5174           (logs/admin.log)"
echo "  Móvil : mira el QR/URL con  cat logs/mobile.log"
echo "Detener todo:  kill \$(cat logs/*.pid)"
EOF
chmod +x start-all.sh
./start-all.sh
```

Para ver el QR o la URL `exp://…` de Expo: `cat logs/mobile.log` (o
`tail -f logs/mobile.log`). Para detener todo: `kill $(cat logs/*.pid)`.

### 4.6 Conectar cada cliente

- **Panel admin**: desde el navegador de cualquier PC de la red abre
  `http://IP_DEL_SERVER:5174` y en el login pon la API `http://IP_DEL_SERVER:8000`.
- **App móvil**: abre el enlace de Expo en **Expo Go**
  (túnel: escanea el QR o escribe la URL `exp://…`; LAN: `exp://IP_DEL_SERVER:8081`).
  Luego, dentro de la app: **Cuenta → Servidor de la API →**
  `http://IP_DEL_SERVER:8000` → Guardar.

> **Expo túnel vs LAN.** Usa `--tunnel` si el teléfono está en **otra red** que
> el server (usa datos móviles, o el server está en otra VLAN); Expo instala
> `@expo/ngrok` la primera vez. Usa `--lan` (más rápido) solo si el teléfono y
> el server comparten el **mismo Wi-Fi**; en un server headless conviene fijar
> `REACT_NATIVE_PACKAGER_HOSTNAME=IP_DEL_SERVER` para que el QR apunte a la IP
> correcta (el script ya lo hace).

## 5. Problemas comunes

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
- **El teléfono no abre la app de Expo / QR no carga** (server): casi siempre es
  la red. Usa `npx expo start --tunnel` (funciona aunque el teléfono esté en otra
  red). Si el túnel falla al arrancar, instala ngrok: `npm i -g @expo/ngrok` y
  reintenta. En modo `--lan`, confirma que el puerto **8081** esté abierto en
  `ufw` y que `REACT_NATIVE_PACKAGER_HOSTNAME` apunte a la IP del server.
- **El panel admin no abre desde otra PC** (server): Vite ya escucha en
  `0.0.0.0:5174` (`host: true`), así que revisa el firewall
  (`sudo ufw allow 5174/tcp`) y usa `http://IP_DEL_SERVER:5174`, no `localhost`.
- **`bash: ./start-all.sh: /usr/bin/env: ...^M`**: el script quedó con saltos de
  línea de Windows (CRLF). Créalo directamente en el server con el `cat > … <<'EOF'`
  de la sección 4.5, o conviértelo con `sed -i 's/\r$//' start-all.sh`.
- **La app móvil "No se pudo conectar con la API"**: en el teléfono, `localhost`
  es el propio teléfono. En **Cuenta → Servidor de la API** usa
  `http://IP_DEL_SERVER:8000`, y asegúrate de que el backend corra con
  `--host=0.0.0.0` y el puerto 8000 esté abierto.
