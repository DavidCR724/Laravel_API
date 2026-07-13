<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCaracteristicasToArticlesTable extends Migration
{
    /**
     * Agrega los atributos dinámicos del sombrero (talla, color, material,
     * estilo de ala, etc.) en una columna JSONB de PostgreSQL.
     */
    public function up()
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->jsonb('caracteristicas')->nullable();
        });
    }

    public function down()
    {
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('caracteristicas');
        });
    }
}
