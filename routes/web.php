<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Esta aplicación es una API pura; la ruta raíz sólo redirige la atención al
| prefijo /api. No se usan vistas ni sesiones para los recursos.
|
*/

Route::get('/', static function () {
    return response()->json([
        'app'     => config('app.name'),
        'message' => 'Esta es una API RESTful. Usa el prefijo /api.',
        'docs'    => url('/api'),
    ]);
});
