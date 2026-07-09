# Guía de Requests (POST) — Flujo de un Cliente

Instrucciones para armar cada petición **POST** que realiza un **cliente**, con
sus **bodies** (cuerpos en JSON) y un ejemplo con `curl`.

- **URL base (local):** `http://127.0.0.1:8000`
- **URL base (servidor):** `http://IP_DEL_SERVIDOR`
- Todas las peticiones envían y reciben **JSON**.

## Headers (cabeceras)

| Cabecera | Valor | ¿Cuándo? |
|----------|-------|----------|
| `Content-Type` | `application/json` | Siempre (cuando hay body). |
| `Accept` | `application/json` | Siempre. |
| `Authorization` | `Bearer <token>` | Sólo en rutas **protegidas** (con 🔒). |

> ⏱️ **Los tokens expiran a los 5 minutos.** Si una petición protegida responde
> `401 No autenticado`, vuelve a hacer **login** para obtener un token nuevo.

## Resumen de los POST del cliente

| # | Request | Endpoint | ¿Token? | Body |
|---|---------|----------|:------:|------|
| 1 | Registro | `POST /api/register` | No | `user`, `password` |
| 2 | Login | `POST /api/login` | No | `user`, `password` |
| 3 | Crear carrito | `POST /api/carts` | 🔒 | `user_id` |
| 4 | Agregar al carrito | `POST /api/cart-items` | 🔒 | `cart_id`, `article_id` |
| 5 | Comprar (checkout) | `POST /api/purchases` | 🔒 | `cart_id` |
| 6 | Crear reseña | `POST /api/reviews` | 🔒 | `article_id`, `user_id`, `calificacion`, `descripcion` |
| 7 | Cerrar sesión | `POST /api/logout` | 🔒 | (sin body) |

---

## 1. Registrar un cliente — `POST /api/register`

Crea un usuario nuevo (siempre con rol `cliente`) y devuelve un token.

**Body:**

```json
{
  "user": "juan",
  "password": "secreto1"
}
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"user":"juan","password":"secreto1"}'
```

**Respuesta (201):** incluye `token` y `user`. Guarda el `token`.

---

## 2. Iniciar sesión — `POST /api/login`

Verifica las credenciales y devuelve un **token** (válido 5 minutos).

**Body:**

```json
{
  "user": "cliente",
  "password": "cliente123"
}
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"user":"cliente","password":"cliente123"}'
```

**Respuesta (200):**

```json
{
  "message": "Inicio de sesión correcto.",
  "token": "3|abcDEF123...",
  "token_type": "Bearer",
  "user": { "id": 2, "user": "cliente", "rol": "cliente" }
}
```

> Copia el `token` para las siguientes peticiones y anota el `user.id`
> (lo necesitas en `user_id`).

---

## 3. Crear un carrito — `POST /api/carts` 🔒

**Body:** (`user_id` = el `id` del cliente que obtuviste en el login)

```json
{
  "user_id": 2
}
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/api/carts \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 3|abcDEF123..." \
  -d '{"user_id":2}'
```

**Respuesta (201):** el carrito creado (guarda su `id`).

---

## 4. Agregar un producto al carrito — `POST /api/cart-items` 🔒

**Body:**

```json
{
  "cart_id": 1,
  "article_id": 1
}
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/api/cart-items \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 3|abcDEF123..." \
  -d '{"cart_id":1,"article_id":1}'
```

**Respuesta (201):** el item agregado y el carrito con su `costo_total`
recalculado. Repite este POST por cada producto que quieras agregar.

---

## 5. Hacer la compra (checkout) — `POST /api/purchases` 🔒

Convierte el carrito en una compra: copia sus productos, calcula el total y
vacía el carrito.

**Body:**

```json
{
  "cart_id": 1
}
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/api/purchases \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 3|abcDEF123..." \
  -d '{"cart_id":1}'
```

**Respuesta (201):** la compra con sus items y el `total`.

---

## 6. Crear una reseña — `POST /api/reviews` 🔒

`calificacion` es un número del 1 al 5.

**Body:**

```json
{
  "article_id": 1,
  "user_id": 2,
  "calificacion": 5,
  "descripcion": "Muy buen producto, lo recomiendo."
}
```

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 3|abcDEF123..." \
  -d '{"article_id":1,"user_id":2,"calificacion":5,"descripcion":"Muy buen producto, lo recomiendo."}'
```

**Respuesta (201):** la reseña creada.

---

## 7. Cerrar sesión — `POST /api/logout` 🔒

Revoca el token actual. **No lleva body.**

**curl:**

```bash
curl -X POST http://127.0.0.1:8000/api/logout \
  -H "Accept: application/json" \
  -H "Authorization: Bearer 3|abcDEF123..."
```

**Respuesta (200):** `{"message":"Sesión cerrada correctamente."}`

---

## Errores comunes

| Código | Significado | Solución |
|--------|-------------|----------|
| `401` | Token ausente, inválido o **expirado** (>5 min). | Vuelve a hacer **login**. |
| `403` | Tu rol no tiene permiso para esa acción. | Usa una cuenta con el rol adecuado. |
| `422` | El body no es válido (falta un campo o es incorrecto). | Revisa el JSON del body. |
