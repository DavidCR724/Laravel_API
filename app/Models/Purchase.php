<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Compra realizada por un usuario (checkout de un carrito).
 */
class Purchase extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'total',
        'estado',
        'metodo_pago',
        'referencia_pago',
        'pagado_at',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'total'     => 'decimal:2',
        'pagado_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
