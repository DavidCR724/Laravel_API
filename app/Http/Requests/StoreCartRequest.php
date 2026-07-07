<?php

namespace App\Http\Requests;

use App\Support\MemoryStore;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * El costo_total NO se acepta desde el cliente: se calcula a partir de los
     * items del carrito.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userIds = MemoryStore::for(MemoryStore::USERS)->ids();

        return [
            'user_id' => ['required', 'integer', Rule::in($userIds)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.in' => 'El usuario indicado no existe.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'user_id' => 'usuario',
        ];
    }
}
