<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Carrito de compras de un usuario.
 */
class Cart extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'costo_total',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'costo_total' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * Recalcula y persiste el costo_total a partir del costo de los artículos
     * de sus items.
     */
    public function recalculateTotal(): void
    {
        $total = $this->items()
            ->with('article')
            ->get()
            ->sum(function (CartItem $item) {
                return $item->article ? (float) $item->article->costo : 0;
            });

        $this->update(['costo_total' => round($total, 2)]);
    }
}
