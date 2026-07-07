Versión de php versión 7.4.3
Versión de sendEngine 3.4.0 
Versión de Mongo 7.0.37
Ubuntu 20.04

Actúa como un desarrollador experto en Laravel. Tu tarea es crear el código base para una aplicación tipo e-commerce con una arquitectura puramente basada en API RESTful.

Restricción Principal:
La API debe correr completamente en memoria, sin conexión a ninguna base de datos. Sin embargo, para que los endpoints CRUD puedan ser probados de forma real y el estado persista entre distintas peticiones HTTP, implementa la persistencia de datos simulada utilizando la fachada Cache de Laravel (o una clase Singleton / Repositorio en memoria).

Entidades y Estructura de Datos:
Implementa las rutas, controladores y la lógica para inicializar y gestionar los arrays de las siguientes entidades:

User

id (identificador único)

user (nombre de usuario)

password

rol

Article

id (identificador único)

nombre

descripción

costo

Cart

id (identificador único)

user_id (referencia al id del usuario)

costo_total

CartItem

cart_id (referencia al carrito)

article_id (referencia al artículo)

Requerimientos de Salida:

Genera el archivo routes/api.php con los endpoints para los CRUDs.

Genera los Controladores principales con la lógica de Crear, Leer, Actualizar y Eliminar, leyendo y escribiendo sobre la memoria simulada.

Asegúrate de que las respuestas sigan las convenciones REST retornando JSON estándar y utiliza buenas prácticas para la validación de los datos entrantes.