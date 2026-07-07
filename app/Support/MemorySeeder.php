<?php

namespace App\Support;

use App\Services\CartService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

/**
 * Inicializa los "arrays" de datos de cada entidad en la memoria simulada.
 *
 * El seeding se ejecuta una única vez (protegido por una bandera en cache) y
 * su resultado persiste entre peticiones HTTP gracias al driver de cache file.
 */
class MemorySeeder
{
    protected const SEED_FLAG = 'memory_store:seeded';

    /**
     * Ejecuta el seeding sólo si aún no se ha hecho.
     */
    public static function seedOnce(): void
    {
        if (Cache::get(self::SEED_FLAG)) {
            return;
        }

        static::seed();

        Cache::forever(self::SEED_FLAG, true);
    }

    /**
     * Fuerza un re-seeding limpio (útil para pruebas o el comando artisan).
     */
    public static function seed(): void
    {
        $users    = MemoryStore::for(MemoryStore::USERS);
        $articles = MemoryStore::for(MemoryStore::ARTICLES);
        $carts    = MemoryStore::for(MemoryStore::CARTS);
        $items    = MemoryStore::for(MemoryStore::CART_ITEMS);

        // Partimos siempre de colecciones vacías.
        $users->truncate();
        $articles->truncate();
        $carts->truncate();
        $items->truncate();

        // --- Usuarios --------------------------------------------------------
        $users->create([
            'user'     => 'admin',
            'password' => Hash::make('admin123'),
            'rol'      => 'admin',
        ]);

        $cliente = $users->create([
            'user'     => 'cliente',
            'password' => Hash::make('cliente123'),
            'rol'      => 'cliente',
        ]);

        // --- Artículos -------------------------------------------------------
        $teclado = $articles->create([
            'nombre'      => 'Teclado mecánico',
            'descripcion' => 'Teclado retroiluminado con switches azules.',
            'costo'       => 799.00,
        ]);

        $mouse = $articles->create([
            'nombre'      => 'Mouse inalámbrico',
            'descripcion' => 'Mouse ergonómico 2.4GHz con receptor USB.',
            'costo'       => 349.50,
        ]);

        $articles->create([
            'nombre'      => 'Monitor 24 pulgadas',
            'descripcion' => 'Monitor IPS Full HD a 75Hz.',
            'costo'       => 2599.00,
        ]);

        // --- Carrito de ejemplo ---------------------------------------------
        $cart = $carts->create([
            'user_id'     => $cliente['id'],
            'costo_total' => 0,
        ]);

        $items->create([
            'cart_id'    => $cart['id'],
            'article_id' => $teclado['id'],
        ]);

        $items->create([
            'cart_id'    => $cart['id'],
            'article_id' => $mouse['id'],
        ]);

        // Total del carrito calculado a partir de sus items.
        (new CartService())->recalculateTotal($cart['id']);
    }
}
