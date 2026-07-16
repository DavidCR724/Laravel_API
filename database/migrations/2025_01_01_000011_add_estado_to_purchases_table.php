<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Estado del pedido: 'pendiente', 'completado' o 'cancelado'.
 *
 * Las compras existentes (checkout de clientes) se consideran 'completado'.
 * Cancelar un pedido cambia el estado a 'cancelado' pero conserva el registro
 * en el historial (no se borra).
 */
class AddEstadoToPurchasesTable extends Migration
{
    public function up()
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->string('estado', 20)->default('completado');
        });
    }

    public function down()
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn('estado');
        });
    }
}
