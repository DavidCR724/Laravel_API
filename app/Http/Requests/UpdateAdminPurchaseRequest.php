<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Edición de un pedido por parte del ADMIN.
 *
 * Se pueden actualizar el estado y/o las líneas del pedido. Si viene `items`,
 * reemplaza por completo las líneas actuales y se recalcula el total.
 */
class UpdateAdminPurchaseRequest extends FormRequest
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
            'user_id'            => ['sometimes', 'integer', 'exists:users,id'],
            'estado'             => ['sometimes', Rule::in(['pendiente', 'pendiente_pago', 'pagado', 'en_transito', 'completado', 'cancelado'])],
            'items'              => ['sometimes', 'array', 'min:1'],
            'items.*.article_id' => ['required_with:items', 'integer', 'exists:articles,id'],
            'items.*.cantidad'   => ['required_with:items', 'integer', 'min:1'],
            'items.*.costo'      => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'user_id.exists'            => 'El cliente indicado no existe.',
            'items.min'                 => 'El pedido debe tener al menos un artículo.',
            'items.*.article_id.exists' => 'Uno de los artículos seleccionados no existe.',
            'items.*.cantidad.min'      => 'La cantidad debe ser al menos 1.',
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
