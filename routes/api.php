<?php

use App\Http\Controllers\ArticleController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CartItemController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| API RESTful tipo e-commerce que corre completamente en memoria (sin BD).
| Todos los endpoints devuelven JSON estándar. La persistencia se simula con
| la fachada Cache (ver App\Support\MemoryStore).
|
| Todas las rutas quedan bajo el prefijo /api (agregado por el framework).
|
*/

// Endpoint de salud / bienvenida de la API.
Route::get('/', static function () {
    return response()->json([
        'app'     => config('app.name'),
        'status'  => 'ok',
        'message' => 'API RESTful en memoria (sin base de datos).',
        'recursos' => [
            'users'      => url('/api/users'),
            'articles'   => url('/api/articles'),
            'carts'      => url('/api/carts'),
            'cart-items' => url('/api/cart-items'),
        ],
    ]);
});

/*
|--------------------------------------------------------------------------
| CRUDs de las entidades
|--------------------------------------------------------------------------
|
| apiResource genera automáticamente:
|   GET     /{recurso}            -> index
|   POST    /{recurso}            -> store
|   GET     /{recurso}/{id}       -> show
|   PUT/PATCH /{recurso}/{id}     -> update
|   DELETE  /{recurso}/{id}       -> destroy
|
*/

Route::apiResource('users', UserController::class);
Route::apiResource('articles', ArticleController::class);
Route::apiResource('carts', CartController::class);
Route::apiResource('cart-items', CartItemController::class);

// Atajo REST anidado: items de un carrito concreto.
Route::get('carts/{cart}/items', [CartItemController::class, 'index']);
