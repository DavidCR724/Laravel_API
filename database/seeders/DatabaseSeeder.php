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
     * Carga datos de ejemplo en PostgreSQL: al menos 10 registros por tabla
     * (usuarios, artículos, carritos, items de carrito, compras, items de
     * compra y reseñas).
     */
    public function run()
    {
        $faker = \Faker\Factory::create('es_ES');

        // --- Usuarios --------------------------------------------------------
        User::create([
            'user'     => 'admin',
            'nombre'   => 'Administrador General',
            'correo'   => 'admin@sombreria.mx',
            'telefono' => '9510000000',
            'password' => Hash::make('admin123'),
            'rol'      => 'admin',
        ]);

        // Cliente de prueba "clásico" (compatibilidad con guías previas).
        $clientes = [];
        $clientes[] = User::create([
            'user'     => 'cliente',
            'nombre'   => 'Cliente de Prueba',
            'correo'   => 'cliente@sombreria.mx',
            'telefono' => '9511111111',
            'password' => Hash::make('cliente123'),
            'rol'      => 'cliente',
        ]);

        // 10 clientes adicionales. Contraseña de todos: "password".
        $nombres = [
            'Ana Robles', 'Bruno Martínez', 'Carla Domínguez', 'Diego Fuentes',
            'Elena Vázquez', 'Fernando Ríos', 'Gabriela Nava', 'Héctor Salas',
            'Irene Castro', 'Javier Pineda',
        ];
        foreach ($nombres as $i => $nombre) {
            $userName = 'cliente' . ($i + 1);
            $clientes[] = User::create([
                'user'     => $userName,
                'nombre'   => $nombre,
                'correo'   => $userName . '@correo.mx',
                'telefono' => '951' . str_pad((string) random_int(1000000, 9999999), 7, '0', STR_PAD_LEFT),
                'password' => Hash::make('password'),
                'rol'      => 'cliente',
            ]);
        }

        // --- Artículos (sombreros con atributos dinámicos en JSONB) ----------
        $definiciones = [
            ['Sombrero Fedora Clásico', 'Fedora de fieltro de lana con cinta de grosgrain.', 799.00, 25, ['talla' => 'M', 'color' => 'Negro', 'material' => 'Fieltro de lana', 'estilo_ala' => 'Ala media curva']],
            ['Sombrero Panamá Montecristi', 'Tejido a mano en paja toquilla, ligero y transpirable.', 349.50, 40, ['talla' => 'L', 'color' => 'Natural', 'material' => 'Paja toquilla', 'estilo_ala' => 'Ala ancha']],
            ['Sombrero Vaquero Texano', 'Ala ancha estilo western con banda de cuero.', 2599.00, 12, ['talla' => 'XL', 'color' => 'Café', 'material' => 'Fieltro de castor', 'estilo_ala' => 'Ala ancha levantada']],
            ['Bombín Inglés', 'Clásico bombín de fieltro rígido, elegante y formal.', 1290.00, 18, ['talla' => 'M', 'color' => 'Negro', 'material' => 'Fieltro rígido', 'estilo_ala' => 'Ala corta enrollada']],
            ['Sombrero Trilby', 'Trilby de ala corta, ideal para uso urbano diario.', 459.00, 35, ['talla' => 'S', 'color' => 'Gris', 'material' => 'Fieltro de lana', 'estilo_ala' => 'Ala corta']],
            ['Sombrero de Paja Playero', 'Sombrero de paja liviano con ala flexible para el sol.', 199.00, 60, ['talla' => 'Única', 'color' => 'Beige', 'material' => 'Paja natural', 'estilo_ala' => 'Ala ancha flexible']],
            ['Boina Vasca', 'Boina de lana suave, cómoda y atemporal.', 289.00, 45, ['talla' => 'Única', 'color' => 'Azul marino', 'material' => 'Lana', 'estilo_ala' => 'Sin ala']],
            ['Sombrero Cordobés', 'Ala plana y copa recta, estilo andaluz tradicional.', 990.00, 15, ['talla' => 'L', 'color' => 'Negro', 'material' => 'Fieltro', 'estilo_ala' => 'Ala plana ancha']],
            ['Gorra Flat Cap', 'Gorra plana de tweed, look británico casual.', 359.00, 50, ['talla' => 'M', 'color' => 'Marrón', 'material' => 'Tweed de lana', 'estilo_ala' => 'Visera corta']],
            ['Sombrero Aguadeño', 'Sombrero colombiano tejido en caña flecha.', 429.00, 30, ['talla' => 'L', 'color' => 'Crema', 'material' => 'Caña flecha', 'estilo_ala' => 'Ala media']],
            ['Sombrero Cloché', 'Estilo años 20, ajustado a la cabeza, femenino y retro.', 620.00, 22, ['talla' => 'S', 'color' => 'Vino', 'material' => 'Fieltro de lana', 'estilo_ala' => 'Ala corta hacia abajo']],
            ['Sombrero Safari', 'Sombrero de explorador con cordón barbiquejo.', 540.00, 28, ['talla' => 'L', 'color' => 'Verde oliva', 'material' => 'Algodón encerado', 'estilo_ala' => 'Ala ancha rígida']],
        ];

        $articles = [];
        foreach ($definiciones as $d) {
            $articles[] = Article::create([
                'nombre'          => $d[0],
                'descripcion'     => $d[1],
                'costo'           => $d[2],
                'stock'           => $d[3],
                'caracteristicas' => $d[4],
            ]);
        }

        $estados = ['completado', 'completado', 'completado', 'pendiente', 'cancelado'];
        $frasesResena = [
            'Excelente calidad, superó mis expectativas.',
            'Muy cómodo y la talla es exacta.',
            'El material se siente premium, lo recomiendo.',
            'Buen sombrero por el precio, llegó bien empacado.',
            'Me encantó el estilo, combina con todo.',
            'Cumple lo prometido, volvería a comprar.',
            'El ala es perfecta para el sol, muy fresco.',
            'Acabados finos, se nota el trabajo artesanal.',
        ];

        // --- Carritos, compras y reseñas por cliente ------------------------
        foreach ($clientes as $cliente) {
            // Carrito con 2-3 artículos distintos.
            $cart = Cart::create(['user_id' => $cliente->id, 'costo_total' => 0]);
            foreach ((array) array_rand($articles, random_int(2, 3)) as $idx) {
                $cart->items()->create(['article_id' => $articles[$idx]->id]);
            }
            $cart->recalculateTotal();

            // 1-2 compras, cada una con 1-3 líneas.
            $numCompras = random_int(1, 2);
            $articulosComprados = [];
            for ($c = 0; $c < $numCompras; $c++) {
                $estado = $estados[array_rand($estados)];
                $purchase = Purchase::create([
                    'user_id' => $cliente->id,
                    'estado'  => $estado,
                    'total'   => 0,
                ]);

                $total = 0.0;
                foreach ((array) array_rand($articles, random_int(1, 3)) as $idx) {
                    $article = $articles[$idx];
                    $cantidad = random_int(1, 3);
                    $purchase->items()->create([
                        'article_id' => $article->id,
                        'costo'      => $article->costo,
                        'cantidad'   => $cantidad,
                    ]);
                    $total += (float) $article->costo * $cantidad;
                    if ($estado !== 'cancelado') {
                        $articulosComprados[$article->id] = $article->id;
                    }
                }
                $purchase->update(['total' => round($total, 2)]);
            }

            // Reseñas de artículos efectivamente comprados (no cancelados).
            foreach (array_slice($articulosComprados, 0, random_int(1, 2)) as $articleId) {
                Review::create([
                    'article_id'   => $articleId,
                    'user_id'      => $cliente->id,
                    'calificacion' => random_int(3, 5),
                    'descripcion'  => $frasesResena[array_rand($frasesResena)],
                ]);
            }
        }
    }
}
