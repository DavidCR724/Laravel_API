<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Línea de un carrito: relaciona un carrito con un artículo.
 */
class CartItem extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'cart_id',
        'article_id',
    ];

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}
