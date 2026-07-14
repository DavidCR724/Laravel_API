# Contexto y Plan de Ejecución — API RESTful E-commerce (Sombreros)

## 📌 Contexto del Proyecto
Este proyecto es un sistema e-commerce de arquitectura separada. Actualmente existe una API REST base desarrollada en **Laravel 8 y PHP 7.4** con base de datos **PostgreSQL**. La autenticación se maneja a través de tokens Bearer con **Laravel Sanctum** y existe un control de acceso basado en roles (admin, cliente, invitado). 

**Restricciones estrictas del entorno:**
- **Backend:** El código de Laravel DEBE ser compatible con **PHP 7.4**. No utilices características exclusivas de PHP 8+ (como *match expressions*, *named arguments* o *constructor property promotion*).
- **Base de Datos:** PostgreSQL.
- **Dominio:** Tienda de sombreros. Los productos requieren atributos dinámicos (talla, color, material, estilo de ala).

---

## 🚀 Plan de Sprints e Instrucciones de Ejecución

A continuación, se detallan las instrucciones paso a paso para ejecutar los 4 sprints de desarrollo. **Ejecuta un sprint a la vez y verifica la funcionalidad antes de avanzar al siguiente.**

### Sprint 1: Fundamentos Backend y Refinamiento de Base de Datos
**Objetivo:** Completar la API REST faltante y adaptar el esquema de la base de datos para soportar los atributos dinámicos de los sombreros.

**Instrucciones para el Agente:**
1. **Modificar tabla `articles`:** Crea una nueva migración que agregue una columna `jsonb` llamada `caracteristicas` a la tabla `articles`. Esta columna debe ser `nullable()`.
2. **Actualizar el Modelo `Article`:** En `app/Models/Article.php`, agrega `'caracteristicas' => 'array'` al array `$casts` para asegurar la correcta serialización/deserialización del JSON. Agrega `caracteristicas` al array `$fillable`.
3. **Actualizar Form Requests:** Modifica `StoreArticleRequest` y `UpdateArticleRequest` para validar que `caracteristicas` sea un array, si está presente.
4. **Completar Endpoints REST:** Revisa el archivo `routes/api.php` y los controladores actuales. Desarrolla cualquier endpoint CRUD faltante (por ejemplo, gestión de categorías si se requiere para el e-commerce, o control de stock específico).
5. **Pruebas:** Verifica que se pueda crear y consultar un artículo con atributos JSON anidados utilizando el cliente HTTP del entorno.

---

### Sprint 2: Integración de Inteligencia Artificial
**Objetivo:** Extender la API con rutas que consuman un servicio de IA (OpenAI/Anthropic/Gemini) para dotar de inteligencia al e-commerce.

**Instrucciones para el Agente:**
1. **Configuración HTTP:** Utiliza el facade `Http` de Laravel para crear un servicio integrador con la API de IA elegida. Asegúrate de leer las llaves de API desde el archivo `.env`.
2. **Endpoint de Búsqueda Semántica (`POST /api/ai/search`):** Crea un controlador que reciba un *query* en lenguaje natural, consulte a la IA interpretando las `caracteristicas` JSONB de los sombreros y devuelva los IDs o modelos de los productos que mejor coincidan.
3. **Endpoint de Recomendaciones (`GET /api/ai/recommendations`):** Crea una ruta (protegida por Sanctum para clientes) que lea el historial de compras (`Purchase`) y los items del carrito (`CartItem`) del usuario autenticado, y utilice la IA para sugerir nuevos artículos.
4. **Endpoint ChatBot (`POST /api/ai/chat`):** Implementa un endpoint conversacional que mantenga el contexto de la tienda de sombreros y pueda responder dudas sobre materiales, tallas y políticas de compra.

---

### Sprint 3: Frontend Administrativo (Dashboard Web)
**Objetivo:** Desarrollar el panel de administración web para gestionar el e-commerce.

**Instrucciones para el Agente:**
1. **Inicialización:** Inicializa un nuevo proyecto de React utilizando Vite (`npm create vite@latest frontend-admin -- --template react`).
2. **Estilos:** Configura **Tailwind CSS** en el proyecto para agilizar la maquetación y el diseño de la interfaz de usuario.
3. **Autenticación (Sanctum):** Implementa un flujo de inicio de sesión que almacene el token Bearer en `localStorage`. Configura un interceptor en `fetch` o `axios` para adjuntar el header `Authorization: Bearer <token>` en cada petición y manejar los errores HTTP 401 (token expirado).
4. **Vistas Protegidas:** Crea las siguientes pantallas accesibles solo si el usuario tiene rol `admin`:
   - **Dashboard:** Resumen de métricas de ventas.
   - **Gestión de Artículos:** Tabla con operaciones CRUD completas, incluyendo un formulario dinámico para agregar las `caracteristicas` (JSON) del sombrero.
   - **Gestión de Usuarios:** Tabla para visualizar y administrar cuentas.

---

### Sprint 4: Aplicación Móvil Nativa (Clientes)
**Objetivo:** Desarrollar la aplicación orientada al consumidor final para explorar, buscar con IA y comprar.

**Instrucciones para el Agente:**
1. **Inicialización:** Crea un nuevo proyecto de **React Native** utilizando Expo (`npx create-expo-app mobile-app`).
2. **Navegación:** Configura `React Navigation` (stack y tabs).
3. **Autenticación Móvil:** Implementa pantallas de Login/Registro. Utiliza `expo-secure-store` para almacenar el token de Sanctum de forma segura.
4. **Flujo de Usuario (Cliente):**
   - **Catálogo:** Pantalla principal (pública) consumiendo `GET /api/articles`.
   - **Búsqueda IA:** Pantalla interactiva que consuma el endpoint `/api/ai/search`.
   - **ChatBot:** Interfaz de chat consumiendo `/api/ai/chat`.
   - **Carrito y Checkout:** Flujo protegido que consuma `/api/carts`, agregue items (`/api/cart-items`) y finalice la orden (`POST /api/purchases`).