<?php

namespace App\Providers;

use App\Support\MemorySeeder;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * Inicializa (una sola vez) los "arrays" de datos de cada entidad en la
     * memoria simulada. Al usar el driver de cache "file", el seeding sólo se
     * ejecuta la primera vez y persiste entre peticiones HTTP posteriores.
     *
     * @return void
     */
    public function boot()
    {
        MemorySeeder::seedOnce();
    }
}
