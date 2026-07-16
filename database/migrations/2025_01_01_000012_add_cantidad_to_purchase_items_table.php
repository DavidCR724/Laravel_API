<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cantidad de unidades por línea de compra. El campo `costo` sigue siendo el
 * costo UNITARIO; el subtotal de la línea es `costo * cantidad`.
 *
 * Las líneas existentes se consideran de 1 unidad (default).
 */
class AddCantidadToPurchaseItemsTable extends Migration
{
    public function up()
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->unsignedInteger('cantidad')->default(1);
        });
    }

    public function down()
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropColumn('cantidad');
        });
    }
}
