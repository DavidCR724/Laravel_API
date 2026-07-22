# Instrucciones finales — puesta en marcha

Guía corta y en orden para dejar el proyecto corriendo desde cero en el server
(Ubuntu): **bajar cambios → instalar nvm → Node 20 → migrar la base de datos →
levantar backend + app móvil al mismo tiempo**.

> Para la guía completa y detallada (Windows, firewall, problemas comunes, etc.)
> ver `levantamiento.md`. Esta es la versión rápida.

---

## 1. Bajar los últimos cambios (git pull)

```bash
cd /var/www/Laravel_API
git status              # revisa que no tengas cambios locales sin guardar
git pull origin main
```

> Si `git pull` se queja por archivos sin seguimiento (`server.php`,
> `composer.lock`): respáldalos y reintenta —
> `mv composer.lock composer.lock.bak` y/o `mv server.php server.php.bak`, luego
> `git pull origin main`.

---

## 2. Instalar nvm (gestor de versiones de Node)

nvm te deja tener e instalar varias versiones de Node sin permisos de admin.

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Recarga tu terminal para que reconozca el comando `nvm`:

```bash
. ~/.nvm/nvm.sh          # o simplemente cierra y vuelve a abrir la terminal
nvm --version            # confirma que quedó instalado
```

---

## 3. Instalar y usar Node 20 LTS

Expo SDK 51 (y Vite 5) requieren **Node >= 20.19.4**. Node 18 ya está
*end-of-life* (sin soporte); por eso el CLI lo bloquea.

```bash
nvm install 20           # instala la última 20.x LTS
nvm alias default 20     # que Node 20 sea el de por defecto en nuevas terminales
nvm use 20
node -v                  # debe imprimir v20.x (>= 20.19.4)
```

> Actualizar Node **no** afecta tu versión de React / React Native: Node solo
> corre las herramientas (Metro, Expo CLI, npm); la app corre en el teléfono
> (Hermes), no en Node.

Como cambiaste de versión de Node, reinstala dependencias de las dos apps de
front por si algún paquete traía binarios compilados para Node 18:

```bash
cd /var/www/Laravel_API/mobile        && rm -rf node_modules package-lock.json && npm install
cd /var/www/Laravel_API/frontend-admin && rm -rf node_modules package-lock.json && npm install
cd /var/www/Laravel_API
```

---

## 4. Migrar el estado de la base de datos

Aplica las migraciones **pendientes** (incluye las columnas de pago:
`metodo_pago`, `referencia_pago`, `pagado_at`). Esto **no borra** tus datos.

```bash
cd /var/www/Laravel_API
php artisan migrate:status     # ve cuáles están "Pending"
php artisan migrate            # aplica solo lo pendiente
php artisan optimize:clear     # limpia cachés (config, rutas, etc.)
```

Verifica que quedó:

```bash
php artisan migrate:status     # 2025_01_01_000014_add_payment… debe salir "Ran"
```

> ⚠️ Usa `php artisan migrate` (NO `migrate:fresh` ni `--seed`): esos **borran**
> todos los pedidos, usuarios y productos. Solo usa `migrate:fresh --seed` si
> quieres partir de cero con datos de ejemplo.

---

## 5. Levantar backend + app móvil al mismo tiempo (tmux)

`tmux` deja varias terminales en una sola sesión SSH y sigue corriendo aunque
cierres el SSH. Ideal para ver el QR de Expo en vivo.

```bash
sudo apt install -y tmux      # si no lo tienes
tmux new -s tienda
```

Dentro de tmux crea una ventana por servicio: **Ctrl-b** y luego **c** para una
ventana nueva; **Ctrl-b** y un número (0, 1, 2) para moverte entre ellas.

```bash
# Ventana 0 — Backend (Laravel API)
cd /var/www/Laravel_API && php artisan serve --host=0.0.0.0 --port=8000

# Ventana 1 — App móvil (Expo)
cd /var/www/Laravel_API/mobile && npx expo start --lan
# ¿el teléfono está en otra red / datos móviles? usa túnel:
#   npx expo start --tunnel

# (Opcional) Ventana 2 — Panel admin (React + Vite)
cd /var/www/Laravel_API/frontend-admin && npm run dev
```

- **Detach** (salir dejando todo corriendo): **Ctrl-b** y luego **d**.
- **Volver**: `tmux attach -t tienda`.
- **Cerrar todo**: `tmux kill-session -t tienda`.

Abre los puertos en el firewall (una sola vez):

```bash
sudo ufw allow 8000/tcp   # API Laravel
sudo ufw allow 8081/tcp   # bundler de Expo (modo --lan)
sudo ufw allow 5174/tcp   # panel admin (si lo levantas)
```

### Conectar el teléfono

1. Averigua la IP del server: `hostname -I | awk '{print $1}'`.
2. En **Expo Go** escanea el QR (modo `--lan`: `exp://IP_DEL_SERVER:8081`).
3. Dentro de la app: **Cuenta → Servidor de la API →** `http://IP_DEL_SERVER:8000`
   → Guardar.

Usuarios de prueba (del seeder): `cliente` / `cliente123` y `admin` / `admin123`.

---

## 6. Comprobación rápida

- API viva: `curl http://127.0.0.1:8000/api` → responde `{"status":"ok",...}`.
- Compra de prueba desde la app: agrega un sombrero al carrito → **Proceder al
  pago** → elige efectivo (código de barras) o tarjeta → confirma. El pedido
  aparece en **Mis pedidos** con su estado (`pendiente_pago` → `pagado`).
