<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateArticleRequest extends FormRequest
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
            'nombre'          => ['sometimes', 'required', 'string', 'max:255'],
            'descripcion'     => ['sometimes', 'required', 'string', 'max:2000'],
            'costo'           => ['sometimes', 'required', 'numeric', 'min:0'],
            'caracteristicas' => ['sometimes', 'nullable', 'array'],
            'stock'           => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'nombre'          => 'nombre',
            'descripcion'     => 'descripción',
            'costo'           => 'costo',
            'caracteristicas' => 'características',
            'stock'           => 'stock',
        ];
    }
}
