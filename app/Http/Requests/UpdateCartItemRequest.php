<?php

namespace App\Http\Requests;

use App\Support\MemoryStore;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        $cartIds    = MemoryStore::for(MemoryStore::CARTS)->ids();
        $articleIds = MemoryStore::for(MemoryStore::ARTICLES)->ids();

        return [
            'cart_id'    => ['sometimes', 'required', 'integer', Rule::in($cartIds)],
            'article_id' => ['sometimes', 'required', 'integer', Rule::in($articleIds)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'cart_id.in'    => 'El carrito indicado no existe.',
            'article_id.in' => 'El artículo indicado no existe.',
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
