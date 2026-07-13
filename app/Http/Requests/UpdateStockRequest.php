<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Control de stock específico: ajusta las existencias de un artículo.
 *
 * Acepta una de dos operaciones:
 *   - "stock":  fija el valor absoluto de existencias.
 *   - "ajuste": suma (o resta, con negativos) al stock actual.
 */
class UpdateStockRequest extends FormRequest
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
            'stock'  => ['required_without:ajuste', 'integer', 'min:0'],
            'ajuste' => ['required_without:stock', 'integer'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'stock'  => 'stock',
            'ajuste' => 'ajuste',
        ];
    }
}
