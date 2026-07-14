# Guía: llevar los cambios a la VM Ubuntu y probar API + frontend

## 0. Contexto

- El frontend viejo (`/frontend`, prueba de concepto de CORS/roles) se eliminó del
  repo. El panel de administración real ahora vive en `frontend-admin/` (React +
  Vite + Tailwind, con Estadísticas, Productos, Clientes, Historial de ventas y
  Asistente IA).
- `routes/api.php` cambió: `GET /api/purchases` y `GET /api/purchases/{id}`
  ahora aceptan rol `admin` además de `cliente` (antes el admin recibía 403 al
  pedir el historial de ventas). **Este cambio todavía no está en la VM** —
  hasta que hagas `git pull` ahí, la vista "Historial de ventas" del panel
  admin seguirá devolviendo 403 al consultar la API de la VM.
- El repo tiene remoto en GitHub: `https://github.com/DavidCR724/Laravel_API` (rama `main`).
- La VM Ubuntu ya tiene una copia anterior del proyecto con **su propia base de
  datos** (distinta a la de esta máquina Windows) — no la vamos a pisar, solo
  aplicamos migraciones nuevas sobre ella.
- El diseño del proyecto asume **API y frontend en máquinas distintas**: el
  frontend trae un campo de login para escribir la dirección de la API, y el
  CORS de Laravel está abierto (`allowed_origins => ['*']` en
  [config/cors.php](config/cors.php)). Por eso backend (VM) y frontend
  (Windows) pueden compartir el puerto 8000 cada uno en su propia máquina sin
  chocar.

## 1. Subir los cambios locales a GitHub (desde esta máquina Windows)

Antes de nada revisa qué cambió — en esta sesión solo se regeneró
`composer.lock` y hay un `.env.example` marcado como borrado localmente
(revísalo, puede que no sea intencional):

```powershell
git status
git diff --stat
```

Si `.env.example` no debía borrarse, restáuralo: `git restore .env.example`.
Cuando el estado te parezca correcto:

```powershell
git add composer.lock
git commit -m "Actualiza composer.lock"
git push origin main
```

**Nunca subas `.env`** (ya está en `.gitignore`) — trae contraseñas y la
`GEMINI_API_KEY`.

## 2. Bajar los cambios en la VM Ubuntu

Entra por SSH a la VM y ve a la carpeta del proyecto (probablemente
`/var/www/Laravel_API` o similar, según cómo se desplegó antes):

```bash
cd /ruta/al/proyecto/Laravel_API
git status                 # revisa que no tengas cambios locales sin guardar
```

> ⚠️ El propio README del proyecto avisa: si en su momento crearon `server.php`
> a mano en el servidor, ese archivo queda sin seguimiento de git y el
> `git pull` puede fallar con *"untracked working tree files would be
> overwritten by merge"*. Si pasa, respáldalo primero:
> `mv server.php server.php.bak`.

```bash
git pull origin main
```

Después de bajar los cambios, aplica solo lo que corresponda:

```bash
# Si cambió composer.json o composer.lock:
composer install

# Si hay migraciones nuevas (no borra datos existentes):
php artisan migrate --force

# Limpia cachés de config/rutas:
php artisan optimize:clear
```

Tu `.env` de la VM **no se toca** con el `git pull` (está gitignored), así que
sigue apuntando a la base de datos propia de la VM. Si quieres que la VM tenga
los mismos datos de ejemplo que probaste en Windows (usuarios `admin`/`admin123`
y `cliente`/`cliente123`, artículos sembrados, etc.) y no te importa perder lo
que ya tenga esa base:

```bash
php artisan migrate:fresh --seed --force   # ⚠️ borra todo lo existente en esa BD
```

Si prefieres conservar los datos actuales de la VM, quédate solo con
`php artisan migrate --force` (arriba) y omite este paso.

## 3. Verificar entorno de la VM (PHP 7.4 / Composer / PostgreSQL)

Como ya corrió una versión anterior ahí, esto debería estar listo; solo
confirma versiones:

```bash
php -v            # debe ser 7.4.x
php -m | grep pgsql
composer --version
sudo systemctl status postgresql
```

Si falta algo, la sección "Despliegue en Ubuntu Server 20.04" del
[README.md](README.md) trae los `apt install` exactos.

## 4. Levantar el backend en la VM

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

`--host=0.0.0.0` es importante: así aceptas conexiones desde fuera de la VM
(por ejemplo desde Windows para probar con HTTPie o desde el frontend). Si hay
firewall:

```bash
sudo ufw allow 8000/tcp
```

Anota la IP de la VM para usarla en los siguientes pasos:

```bash
hostname -I
```

## 5. Probar los endpoints con HTTPie

Instala HTTPie donde vayas a hacer las pruebas (en la propia VM, o en Windows
si prefieres pegarle a la VM desde fuera):

```bash
# Ubuntu/VM
sudo apt install -y httpie
# Windows (PowerShell, si tienes Python/pip)
pip install httpie
```

Sustituye `IP_VM` por la IP real (o `127.0.0.1` si corres HTTPie dentro de la
misma VM):

```bash
# Login (devuelve token)
http POST http://IP_VM:8000/api/login user=cliente password=cliente123

# Guarda el token de la respuesta y úsalo en rutas protegidas
http GET http://IP_VM:8000/api/me "Authorization:Bearer 1|xxxxxxxx"

# Listar artículos (público)
http GET http://IP_VM:8000/api/articles

# Crear un artículo (requiere token de admin)
http POST http://IP_VM:8000/api/articles \
  "Authorization:Bearer <token_admin>" \
  nombre="Gorra Test" descripcion="Prueba" costo:=199.00
```

Más ejemplos de bodies (registro, carrito, compras, reseñas) están en
[request.md](request.md) y en la sección "Endpoints" del README.

## 6. Probar el frontend (panel admin)

El panel de administración (`frontend-admin/`, puerto 5174) corre donde tú
quieras — no tiene que estar en la VM. Puedes levantarlo en esta misma
máquina Windows apuntando a la API de la VM:

```powershell
cd frontend-admin
npm install
npm run dev       # abre http://localhost:5174
```

En la pantalla de login hay un desplegable "Dirección de la API" — pon ahí
`http://IP_VM:8000` (no `localhost`, salvo que el panel corra dentro de la
misma VM). Inicia sesión con `admin` / `admin123` (el rol debe ser
exactamente `admin`; cualquier otro rol es rechazado por diseño).

Módulos disponibles: Estadísticas, Productos (CRUD con atributos JSON),
Clientes, Historial de ventas (con buscador) y Asistente IA (Gemini). El de
Historial de ventas necesita el `git pull` del paso 2 en la VM (ver nota en
la sección 0) para no devolver 403.

No hace falta tocar `config/cors.php` — ya permite cualquier origen
(`allowed_origins => ['*']`), así que la API acepta peticiones vengan de donde
venga el panel.
