# Front (React + Vite) para la API de Laravel

Front **muy sencillo** para probar la API. Incluye un **login** con un campo para
escribir la **dirección de la API** (porque el servidor corre en otra máquina, la
del Ubuntu Server) y una pantalla para cargar productos.

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
   Nginx en el puerto 80).
2. Ingresa usuario y contraseña (por defecto `cliente / cliente123`) y pulsa
   **Iniciar sesión**. Se guarda el token (dura 5 minutos).
3. Pulsa **Cargar productos** para hacer un `GET /api/articles`.
4. **Comprobar sesión (/me)** hace una petición protegida; si el token expiró
   (más de 5 min) responderá 401 y volverás al login.

## ¿Por qué CORS?

El navegador bloquea peticiones entre orígenes distintos salvo que el servidor
lo permita. Como el front (origen `http://localhost:8000`) y la API (otra IP)
son orígenes diferentes, la API debe responder con las cabeceras CORS. Ya está
configurado en `config/cors.php` para permitir `http://localhost:8000`.

> Si cambias el puerto del front, añade ese nuevo origen a `allowed_origins`
> en `config/cors.php` y limpia la config en el servidor con
> `php artisan optimize:clear`.
