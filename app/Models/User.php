<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Usuario del sistema.
 *
 * Nota: por ahora no se implementa autenticación. El campo `rol` se conserva
 * como simple columna informativa.
 */
class User extends Model
{
    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'user',
        'password',
        'rol',
    ];

    /**
     * Nunca exponemos el hash de la contraseña en las respuestas JSON.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
    ];

    public function carts(): HasMany
    {
        return $this->hasMany(Cart::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
