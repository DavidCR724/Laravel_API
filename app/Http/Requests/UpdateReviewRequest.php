<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReviewRequest extends FormRequest
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
            'article_id'   => ['sometimes', 'required', 'integer', 'exists:articles,id'],
            'user_id'      => ['sometimes', 'required', 'integer', 'exists:users,id'],
            'calificacion' => ['sometimes', 'required', 'integer', 'between:1,5'],
            'descripcion'  => ['sometimes', 'required', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'article_id.exists'    => 'El artículo indicado no existe.',
            'user_id.exists'       => 'El usuario indicado no existe.',
            'calificacion.between' => 'La calificación debe estar entre 1 y 5.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'article_id'   => 'artículo',
            'user_id'      => 'usuario',
            'calificacion' => 'calificación',
            'descripcion'  => 'descripción',
        ];
    }
}
