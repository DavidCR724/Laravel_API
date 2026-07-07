<?php

use App\Support\MemorySeeder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * memory:seed — Reinicializa los datos de ejemplo en la memoria simulada.
 * Uso: php artisan memory:seed
 */
Artisan::command('memory:seed', function () {
    MemorySeeder::seed();
    $this->info('Datos de ejemplo (usuarios, artículos, carrito) reinicializados en memoria.');
})->purpose('Reinicializa los datos en memoria');
