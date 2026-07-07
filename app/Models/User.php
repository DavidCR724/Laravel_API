<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * Modelo de usuario.
 *
 * IMPORTANTE: esta aplicación NO usa base de datos. La gestión real de usuarios
 * se hace en memoria mediante App\Support\MemoryStore y el UserController.
 *
 * Esta clase existe únicamente porque config/auth.php la referencia como
 * proveedor por defecto del framework; nunca se instancia contra una BD.
 */
class User extends Authenticatable
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
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
    ];
}
