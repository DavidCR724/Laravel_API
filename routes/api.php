<?php

use App\Http\Controllers\ArticleController;
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
| API RESTful tipo e-commerce respaldada por PostgreSQL (ORM Eloquent).
| Todos los endpoints devuelven JSON estándar y quedan bajo el prefijo /api.
|
*/

// Endpoint de salud / bienvenida de la API.
Route::get('/', static function () {
    return response()->json([
        'app'     => config('app.name'),
        'status'  => 'ok',
        'message' => 'API RESTful e-commerce (PostgreSQL + Eloquent).',
        'recursos' => [
            'users'      => url('/api/users'),
            'articles'   => url('/api/articles'),
            'carts'      => url('/api/carts'),
            'cart-items' => url('/api/cart-items'),
            'purchases'  => url('/api/purchases'),
            'reviews'    => url('/api/reviews'),
        ],
    ]);
});

/*
|--------------------------------------------------------------------------
| CRUDs de las entidades
|--------------------------------------------------------------------------
|
| apiResource genera automáticamente index / store / show / update / destroy.
|
*/

Route::apiResource('users', UserController::class);
Route::apiResource('articles', ArticleController::class);
Route::apiResource('carts', CartController::class);
Route::apiResource('cart-items', CartItemController::class);
Route::apiResource('reviews', ReviewController::class);

// Compras: alta (checkout desde un carrito), listado, detalle y borrado.
Route::apiResource('purchases', PurchaseController::class)
    ->only(['index', 'store', 'show', 'destroy']);

/*
|--------------------------------------------------------------------------
| Atajos REST anidados
|--------------------------------------------------------------------------
*/

// Items de un carrito concreto.
Route::get('carts/{cart}/items', [CartItemController::class, 'index']);

// Reseñas de un artículo concreto.
Route::get('articles/{article}/reviews', [ReviewController::class, 'index']);
