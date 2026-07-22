<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Creación de un pedido por parte del ADMIN (sin pasar por un carrito).
 * El admin elige el cliente y arma las líneas del pedido a mano.
 */
class StoreAdminPurchaseRequest extends FormRequest
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
            'user_id'            => ['required', 'integer', 'exists:users,id'],
            'estado'             => ['sometimes', Rule::in(['pendiente', 'pendiente_pago', 'pagado', 'en_transito', 'completado', 'cancelado'])],
            'items'              => ['required', 'array', 'min:1'],
            'items.*.article_id' => ['required', 'integer', 'exists:articles,id'],
            'items.*.cantidad'   => ['required', 'integer', 'min:1'],
            'items.*.costo'      => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.exists'          => 'El cliente indicado no existe.',
            'items.required'          => 'El pedido debe tener al menos un artículo.',
            'items.min'               => 'El pedido debe tener al menos un artículo.',
            'items.*.article_id.exists' => 'Uno de los artículos seleccionados no existe.',
            'items.*.cantidad.min'    => 'La cantidad debe ser al menos 1.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'user_id' => 'cliente',
            'estado'  => 'estado',
            'items'   => 'artículos',
        ];
    }
}
