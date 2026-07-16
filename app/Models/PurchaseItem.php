<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Línea de una compra. Guarda el costo del artículo en el momento de comprar.
 */
class PurchaseItem extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'purchase_id',
        'article_id',
        'costo',
        'cantidad',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'costo'    => 'decimal:2',
        'cantidad' => 'integer',
    ];

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}
