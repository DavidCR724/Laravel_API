<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user'     => ['required', 'string', 'max:255', 'unique:users,user'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'rol'      => ['required', 'string', 'max:50'],
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
