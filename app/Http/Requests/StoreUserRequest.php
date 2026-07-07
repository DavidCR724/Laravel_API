<?php

namespace App\Http\Requests;

use App\Support\MemoryStore;
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
            'user'     => ['required', 'string', 'max:255', $this->uniqueUsername()],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'rol'      => ['required', 'string', 'max:50'],
        ];
    }

    /**
     * Regla de nombre de usuario único contra el almacén en memoria.
     */
    protected function uniqueUsername(): \Closure
    {
        return static function ($attribute, $value, $fail) {
            foreach (MemoryStore::for(MemoryStore::USERS)->all() as $user) {
                if (isset($user['user']) && strcasecmp((string) $user['user'], (string) $value) === 0) {
                    $fail('El nombre de usuario ya está en uso.');

                    return;
                }
            }
        };
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
