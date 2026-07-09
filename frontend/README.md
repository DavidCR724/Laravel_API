# Front (React + Vite) para la API de Laravel

Front **muy sencillo** para probar la API según el rol:

- **Barra superior:** campo para la **dirección de la API** (el servidor corre en
  otra máquina) y, en la esquina, el botón de **Iniciar sesión** / cerrar sesión.
- **Invitado (sin sesión):** ve el catálogo de **productos** y las **reseñas**
  (peticiones GET públicas).
- **Cliente:** además puede **agregar un producto al carrito** y **comprar**.
- **Admin:** panel básico para **crear/editar/borrar productos** y **gestionar
  usuarios**.
- **Manejo de errores:** las respuestas 401/403 (p. ej. un invitado que intenta
  ver `/api/users` o hacer un POST) se **capturan** y se muestran en un banner,
  sin romper la aplicación.

Corre en **http://localhost:8000**, que es el **origen permitido** por el CORS de
la API (ver `config/cors.php` en la raíz del proyecto).

## Requisitos

- **Node.js 18 o superior** (incluye `npm`). Descarga: https://nodejs.org

## Instalar y ejecutar (en Windows)

```bash
cd frontend
npm install       # solo la primera vez (descarga dependencias)
npm run web       # arranca el front en http://localhost:8000
```

Abre el navegador en **http://localhost:8000**.

> `npm run web` fija el puerto **8000** (`--strictPort`); si el puerto está
> ocupado, cierra lo que lo use (por ejemplo un `php artisan serve` local) y
> vuelve a intentar.

## Cómo usarlo

1. En **Dirección de la API**, escribe dónde corre la API del servidor Ubuntu,
   por ejemplo `http://192.168.1.50:8000` (o `http://IP_DEL_SERVIDOR` si usa
   Nginx en el puerto 80). Sin iniciar sesión ya se ven productos y reseñas.
2. Pulsa **Iniciar sesión** (esquina superior). Cuentas de ejemplo:
   `admin / admin123` y `cliente / cliente123`. El token dura **5 minutos**.
3. Como **cliente**: elige un producto, **Agregar al carrito** y **Comprar**.
4. Como **admin**: crea/edita/borra productos y crea/borra usuarios.
5. **Demo de errores:** el botón *Intentar ver /api/users* muestra cómo se
   captura el 401 (invitado) o 403 (cliente) sin romper la app.

## ¿Por qué CORS?

El navegador bloquea peticiones entre orígenes distintos salvo que el servidor
lo permita. Como el front (origen `http://localhost:8000`) y la API (otra IP)
son orígenes diferentes, la API debe responder con las cabeceras CORS. Ya está
configurado en `config/cors.php` para permitir `http://localhost:8000`.

> Si cambias el puerto del front, añade ese nuevo origen a `allowed_origins`
> en `config/cors.php` y limpia la config en el servidor con
> `php artisan optimize:clear`.
