<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Artículo / producto del catálogo.
 */
class Article extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'nombre',
        'descripcion',
        'costo',
        'caracteristicas',
        'stock',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'costo'          => 'decimal:2',
        'caracteristicas' => 'array',
        'stock'          => 'integer',
    ];

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
