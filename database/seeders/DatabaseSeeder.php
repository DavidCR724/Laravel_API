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

        // --- Artículos (sombreros con atributos dinámicos en JSONB) ----------
        $fedora = Article::create([
            'nombre'          => 'Sombrero Fedora Clásico',
            'descripcion'     => 'Fedora de fieltro de lana con cinta de grosgrain.',
            'costo'           => 799.00,
            'stock'           => 25,
            'caracteristicas' => [
                'talla'         => 'M',
                'color'         => 'Negro',
                'material'      => 'Fieltro de lana',
                'estilo_ala'    => 'Ala media curva',
                'dimensiones'   => ['ala_cm' => 6, 'copa_cm' => 11],
            ],
        ]);

        $panama = Article::create([
            'nombre'          => 'Sombrero Panamá Montecristi',
            'descripcion'     => 'Tejido a mano en paja toquilla, ligero y transpirable.',
            'costo'           => 349.50,
            'stock'           => 40,
            'caracteristicas' => [
                'talla'      => 'L',
                'color'      => 'Natural',
                'material'   => 'Paja toquilla',
                'estilo_ala' => 'Ala ancha',
                'origen'     => 'Ecuador',
            ],
        ]);

        $texano = Article::create([
            'nombre'          => 'Sombrero Vaquero Texano',
            'descripcion'     => 'Sombrero de ala ancha estilo western con banda de cuero.',
            'costo'           => 2599.00,
            'stock'           => 12,
            'caracteristicas' => [
                'talla'      => 'XL',
                'color'      => 'Café',
                'material'   => 'Fieltro de castor',
                'estilo_ala' => 'Ala ancha levantada',
                'accesorios' => ['banda_cuero', 'concha_metalica'],
            ],
        ]);

        // --- Carrito de ejemplo ---------------------------------------------
        $cart = Cart::create([
            'user_id'     => $cliente->id,
            'costo_total' => 0,
        ]);

        $cart->items()->create(['article_id' => $fedora->id]);
        $cart->items()->create(['article_id' => $panama->id]);
        $cart->recalculateTotal();

        // --- Compra de ejemplo ----------------------------------------------
        $purchase = Purchase::create([
            'user_id' => $cliente->id,
            'total'   => 0,
        ]);

        $purchase->items()->create([
            'article_id' => $texano->id,
            'costo'      => $texano->costo,
        ]);

        $purchase->update(['total' => $texano->costo]);

        // --- Reseñas de ejemplo ---------------------------------------------
        Review::create([
            'article_id'   => $fedora->id,
            'user_id'      => $cliente->id,
            'calificacion' => 5,
            'descripcion'  => 'Excelente fedora, el fieltro es de gran calidad y la talla es exacta.',
        ]);

        Review::create([
            'article_id'   => $panama->id,
            'user_id'      => $cliente->id,
            'calificacion' => 4,
            'descripcion'  => 'Muy ligero y fresco; el ala ancha protege bien del sol.',
        ]);
    }
}
