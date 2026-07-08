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

        return [
            'user'     => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users', 'user')->ignore($userId)],
            'password' => ['sometimes', 'required', 'string', 'min:6', 'max:255'],
            'rol'      => ['sometimes', 'required', 'string', 'max:50'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user.unique' => 'El nombre de usuario ya está en uso.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'user'     => 'nombre de usuario',
            'password' => 'contraseña',
            'rol'      => 'rol',
        ];
    }
}
