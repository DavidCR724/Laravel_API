<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * GET /api/users — Lista todos los usuarios.
     */
    public function index(): JsonResponse
    {
        return response()->json(['data' => User::all()]);
    }

    /**
     * POST /api/users — Crea un nuevo usuario.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        return response()->json([
            'message' => 'Usuario creado correctamente.',
            'data'    => $user,
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * GET /api/users/{id} — Muestra un usuario.
     */
    public function show($id): JsonResponse
    {
        $user = User::findOrFail($id);

        return response()->json(['data' => $user]);
    }

    /**
     * PUT/PATCH /api/users/{id} — Actualiza un usuario.
     */
    public function update(UpdateUserRequest $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        // Al deshabilitar un usuario, revocamos sus tokens para cerrarle la
        // sesión de inmediato (no solo impedir futuros inicios de sesión).
        if (array_key_exists('activo', $data) && ! $user->activo) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'Usuario actualizado correctamente.',
            'data'    => $user,
        ]);
    }

    /**
     * DELETE /api/users/{id} — Elimina un usuario.
     */
    public function destroy($id): JsonResponse
    {
        User::findOrFail($id)->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }
}
