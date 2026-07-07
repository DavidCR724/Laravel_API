<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Support\MemoryStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /** @var MemoryStore */
    protected $users;

    public function __construct()
    {
        $this->users = MemoryStore::for(MemoryStore::USERS);
    }

    /**
     * GET /api/users — Lista todos los usuarios.
     */
    public function index(): JsonResponse
    {
        $users = array_map([$this, 'hideSensitive'], $this->users->all());

        return response()->json(['data' => $users]);
    }

    /**
     * POST /api/users — Crea un nuevo usuario.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = $this->users->create($data);

        return response()->json([
            'message' => 'Usuario creado correctamente.',
            'data'    => $this->hideSensitive($user),
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * GET /api/users/{user} — Muestra un usuario.
     */
    public function show($id): JsonResponse
    {
        $user = $this->users->find($id);

        if ($user === null) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Usuario no encontrado.');
        }

        return response()->json(['data' => $this->hideSensitive($user)]);
    }

    /**
     * PUT/PATCH /api/users/{user} — Actualiza un usuario.
     */
    public function update(UpdateUserRequest $request, $id): JsonResponse
    {
        if (! $this->users->exists($id)) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Usuario no encontrado.');
        }

        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user = $this->users->update($id, $data);

        return response()->json([
            'message' => 'Usuario actualizado correctamente.',
            'data'    => $this->hideSensitive($user),
        ]);
    }

    /**
     * DELETE /api/users/{user} — Elimina un usuario.
     */
    public function destroy($id): JsonResponse
    {
        if (! $this->users->delete($id)) {
            abort(JsonResponse::HTTP_NOT_FOUND, 'Usuario no encontrado.');
        }

        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }

    /**
     * Nunca exponemos el hash de la contraseña en las respuestas.
     *
     * @param  array<string, mixed>  $user
     * @return array<string, mixed>
     */
    protected function hideSensitive(array $user): array
    {
        return Arr::except($user, ['password']);
    }
}
