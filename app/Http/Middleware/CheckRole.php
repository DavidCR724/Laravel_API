<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Middleware de autorización por rol.
 *
 * Uso en rutas:  ->middleware('role:admin')  o  ->middleware('role:cliente,admin')
 *
 * Debe ir DESPUÉS de 'auth:sanctum' para que el usuario ya esté autenticado.
 */
class CheckRole
{
    /**
     * @param  string  ...$roles  roles permitidos para la ruta
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        if ($user === null) {
            abort(JsonResponse::HTTP_UNAUTHORIZED, 'No autenticado.');
        }

        if (! in_array($user->rol, $roles, true)) {
            abort(JsonResponse::HTTP_FORBIDDEN, 'No tienes permiso para realizar esta acción.');
        }

        return $next($request);
    }
}
