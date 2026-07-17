<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

/**
 * Usuario del sistema.
 *
 * - Es "Authenticatable": puede iniciar sesión.
 * - Usa "HasApiTokens" (Sanctum): puede emitir/revocar tokens de API.
 *
 * El campo `rol` define los permisos: 'admin' o 'cliente'. Los "invitados"
 * son peticiones sin token (no existen como registro).
 */
class User extends Authenticatable
{
    use HasApiTokens;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'user',
        'nombre',
        'correo',
        'telefono',
        'password',
        'rol',
        'activo',
    ];

    /**
     * Nunca exponemos el hash de la contraseña ni los tokens en las respuestas.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'activo' => 'boolean',
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
