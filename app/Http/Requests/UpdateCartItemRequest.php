<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCartItemRequest extends FormRequest
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
            'cart_id'    => ['sometimes', 'required', 'integer', 'exists:carts,id'],
            'article_id' => ['sometimes', 'required', 'integer', 'exists:articles,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'cart_id.exists'    => 'El carrito indicado no existe.',
            'article_id.exists' => 'El artículo indicado no existe.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'cart_id'    => 'carrito',
            'article_id' => 'artículo',
        ];
    }
}
