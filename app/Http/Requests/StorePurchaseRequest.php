<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Una compra se genera a partir de un carrito existente (checkout).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cart_id'     => ['required', 'integer', 'exists:carts,id'],
            'metodo_pago' => ['required', Rule::in(['efectivo', 'tarjeta'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'cart_id.exists'   => 'El carrito indicado no existe.',
            'metodo_pago.required' => 'Elige una forma de pago.',
            'metodo_pago.in'   => 'La forma de pago debe ser efectivo o tarjeta.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'cart_id'     => 'carrito',
            'metodo_pago' => 'forma de pago',
        ];
    }
}
