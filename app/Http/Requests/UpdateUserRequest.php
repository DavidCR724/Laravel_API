<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas para actualización parcial: todos los campos usan "sometimes".
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = $this->route('user');

        // El admin edita datos de perfil, rol y estado, pero NO la contraseña.
        return [
            'user'     => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users', 'user')->ignore($userId)],
            'nombre'   => ['sometimes', 'nullable', 'string', 'max:255'],
            'correo'   => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users', 'correo')->ignore($userId)],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:30'],
            'rol'      => ['sometimes', 'required', 'string', 'max:50'],
            'activo'   => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user.unique'   => 'El nombre de usuario ya está en uso.',
            'correo.unique' => 'El correo ya está en uso.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'user'     => 'nombre de usuario',
            'nombre'   => 'nombre completo',
            'correo'   => 'correo',
            'telefono' => 'teléfono',
            'rol'      => 'rol',
        ];
    }
}
