<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * El registro público siempre crea un usuario con rol "cliente"
     * (el rol NO se acepta desde el cliente).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user'     => ['required', 'string', 'max:255', 'unique:users,user'],
            'nombre'   => ['required', 'string', 'max:255'],
            'correo'   => ['required', 'email', 'max:255', 'unique:users,correo'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user.unique'   => 'El nombre de usuario ya está en uso.',
            'correo.unique' => 'El correo ya está registrado.',
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
            'password' => 'contraseña',
        ];
    }
}
