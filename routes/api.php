<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CartItemController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Autenticación con Laravel Sanctum (token Bearer). Roles: admin, cliente.
| Los "invitados" son peticiones sin token.
|
| Permisos:
|   - Invitado : ver productos (sólo nombre, descripción y costo).
|   - Cliente  : lo anterior + reseñas, carrito y compras.
|   - Admin    : gestionar productos (crear/editar/borrar) y usuarios.
|
*/

// Endpoint de salud / bienvenida.
Route::get('/', static function () {
    return response()->json([
        'app'     => config('app.name'),
        'status'  => 'ok',
        'message' => 'API RESTful e-commerce (PostgreSQL + Eloquent, auth con Sanctum).',
    ]);
});

/*
|--------------------------------------------------------------------------
| Rutas PÚBLICAS (invitados)
|--------------------------------------------------------------------------
*/

Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Ver productos (completos) y reseñas: accesible sin token (invitados).
Route::get('articles', [ArticleController::class, 'index']);
Route::get('articles/{id}', [ArticleController::class, 'show'])->whereNumber('id');
Route::get('articles/{article}/reviews', [ReviewController::class, 'index']);
Route::get('reviews', [ReviewController::class, 'index']);
Route::get('reviews/{id}', [ReviewController::class, 'show'])->whereNumber('id');

// IA: búsqueda semántica y chatbot (accesibles para invitados).
Route::post('ai/search', [AiController::class, 'search']);
Route::post('ai/chat', [AiController::class, 'chat']);

/*
|--------------------------------------------------------------------------
| Rutas AUTENTICADAS (requieren token Bearer)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // Sesión
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    /*
    |----------------------------------------------------------------------
    | Solo ADMIN
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {
        // Gestión de productos (crear, editar, borrar).
        Route::post('articles', [ArticleController::class, 'store']);
        Route::match(['put', 'patch'], 'articles/{id}', [ArticleController::class, 'update'])->whereNumber('id');
        Route::patch('articles/{id}/stock', [ArticleController::class, 'updateStock'])->whereNumber('id');
        Route::delete('articles/{id}', [ArticleController::class, 'destroy'])->whereNumber('id');

        // Gestión de usuarios.
        Route::apiResource('users', UserController::class);
    });

    /*
    |----------------------------------------------------------------------
    | Reseñas (ver es público; escribir requiere sesión)
    |----------------------------------------------------------------------
    */
    // Crear reseña: solo cliente.
    Route::post('reviews', [ReviewController::class, 'store'])->middleware('role:cliente');

    // Editar / borrar reseña: cliente o admin.
    Route::match(['put', 'patch'], 'reviews/{id}', [ReviewController::class, 'update'])
        ->middleware('role:cliente,admin');
    Route::delete('reviews/{id}', [ReviewController::class, 'destroy'])
        ->middleware('role:cliente,admin');

    /*
    |----------------------------------------------------------------------
    | Compras del CLIENTE (carrito, items, checkout)
    |----------------------------------------------------------------------
    */
    Route::middleware('role:cliente')->group(function () {
        // Recomendaciones IA según historial de compras y carrito.
        Route::get('ai/recommendations', [AiController::class, 'recommendations']);

        Route::apiResource('carts', CartController::class);
        Route::get('carts/{cart}/items', [CartItemController::class, 'index']);
        Route::apiResource('cart-items', CartItemController::class);

        Route::post('purchases', [PurchaseController::class, 'store']);
        Route::delete('purchases/{id}', [PurchaseController::class, 'destroy'])->whereNumber('id');
    });

    // Historial de compras: lo consulta tanto el cliente (las suyas) como el
    // admin (panel de "Historial de ventas").
    Route::middleware('role:cliente,admin')->group(function () {
        Route::get('purchases', [PurchaseController::class, 'index']);
        Route::get('purchases/{id}', [PurchaseController::class, 'show'])->whereNumber('id');
    });
});
