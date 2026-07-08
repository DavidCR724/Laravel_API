<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * POST /api/register — Registro público. Crea un usuario con rol "cliente"
     * y devuelve un token de acceso.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'user'     => $data['user'],
            'password' => Hash::make($data['password']),
            'rol'      => 'cliente',
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message'    => 'Usuario registrado correctamente.',
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => $user,
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * POST /api/login — Verifica credenciales y devuelve un token de acceso.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::where('user', $data['user'])->first();

        if ($user === null || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'Credenciales inválidas.',
            ], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'message'    => 'Inicio de sesión correcto.',
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => $user,
        ]);
    }

    /**
     * POST /api/logout — Revoca el token con el que se hizo la petición.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    /**
     * GET /api/me — Devuelve el usuario autenticado (según el token).
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()]);
    }
}
