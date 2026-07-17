<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Datos de perfil del usuario: nombre completo, correo (único, sirve también
 * para iniciar sesión) y número de teléfono.
 */
class AddProfileFieldsToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nombre')->nullable()->after('user');
            $table->string('correo')->nullable()->unique()->after('nombre');
            $table->string('telefono', 30)->nullable()->after('correo');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nombre', 'correo', 'telefono']);
        });
    }
}
