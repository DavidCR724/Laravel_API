<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pasarela de pagos (simulada) para los pedidos.
 *
 * - metodo_pago: 'efectivo' (tipo OXXO Pay, con código de barras) o 'tarjeta'.
 * - referencia_pago: referencia numérica que respalda el código de barras del
 *   pago en efectivo (nula para tarjeta).
 * - pagado_at: momento en que el pago se confirmó (nulo mientras esté pendiente).
 *
 * Los estados del pedido pasan a manejar el ciclo:
 *   pendiente_pago -> pagado -> en_transito -> completado (y cancelado).
 */
class AddPaymentToPurchasesTable extends Migration
{
    public function up()
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->string('metodo_pago', 20)->nullable()->after('estado');
            $table->string('referencia_pago', 40)->nullable()->after('metodo_pago');
            $table->timestamp('pagado_at')->nullable()->after('referencia_pago');
        });
    }

    public function down()
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn(['metodo_pago', 'referencia_pago', 'pagado_at']);
        });
    }
}
