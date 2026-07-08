<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Cart;
use App\Models\Purchase;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Carga datos de ejemplo en PostgreSQL.
     */
    public function run()
    {
        // --- Usuarios --------------------------------------------------------
        $admin = User::create([
            'user'     => 'admin',
            'password' => Hash::make('admin123'),
            'rol'      => 'admin',
        ]);

        $cliente = User::create([
            'user'     => 'cliente',
            'password' => Hash::make('cliente123'),
            'rol'      => 'cliente',
        ]);

        // --- Artículos -------------------------------------------------------
        $teclado = Article::create([
            'nombre'      => 'Teclado mecánico',
            'descripcion' => 'Teclado retroiluminado con switches azules.',
            'costo'       => 799.00,
        ]);

        $mouse = Article::create([
            'nombre'      => 'Mouse inalámbrico',
            'descripcion' => 'Mouse ergonómico 2.4GHz con receptor USB.',
            'costo'       => 349.50,
        ]);

        $monitor = Article::create([
            'nombre'      => 'Monitor 24 pulgadas',
            'descripcion' => 'Monitor IPS Full HD a 75Hz.',
            'costo'       => 2599.00,
        ]);

        // --- Carrito de ejemplo ---------------------------------------------
        $cart = Cart::create([
            'user_id'     => $cliente->id,
            'costo_total' => 0,
        ]);

        $cart->items()->create(['article_id' => $teclado->id]);
        $cart->items()->create(['article_id' => $mouse->id]);
        $cart->recalculateTotal();

        // --- Compra de ejemplo ----------------------------------------------
        $purchase = Purchase::create([
            'user_id' => $cliente->id,
            'total'   => 0,
        ]);

        $purchase->items()->create([
            'article_id' => $monitor->id,
            'costo'      => $monitor->costo,
        ]);

        $purchase->update(['total' => $monitor->costo]);

        // --- Reseñas de ejemplo ---------------------------------------------
        Review::create([
            'article_id'   => $teclado->id,
            'user_id'      => $cliente->id,
            'calificacion' => 5,
            'descripcion'  => 'Excelente teclado, muy buena respuesta de las teclas.',
        ]);

        Review::create([
            'article_id'   => $mouse->id,
            'user_id'      => $cliente->id,
            'calificacion' => 4,
            'descripcion'  => 'Cómodo y preciso, aunque la pila dura poco.',
        ]);
    }
}
