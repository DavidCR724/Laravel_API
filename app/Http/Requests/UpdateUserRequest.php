<?php

namespace App\Http\Requests;

use App\Support\MemoryStore;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas para actualización parcial (PUT/PATCH): todos los campos usan
     * "sometimes" para permitir enviar sólo lo que se desea cambiar.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user'     => ['sometimes', 'required', 'string', 'max:255', $this->uniqueUsername()],
            'password' => ['sometimes', 'required', 'string', 'min:6', 'max:255'],
            'rol'      => ['sometimes', 'required', 'string', 'max:50'],
        ];
    }

    /**
     * Nombre de usuario único ignorando el propio registro que se edita.
     */
    protected function uniqueUsername(): \Closure
    {
        $currentId = (int) $this->route('user');

        return static function ($attribute, $value, $fail) use ($currentId) {
            foreach (MemoryStore::for(MemoryStore::USERS)->all() as $user) {
                if ((int) $user['id'] === $currentId) {
                    continue;
                }

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
