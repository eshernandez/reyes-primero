<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('aportes', function (Blueprint $table) {
            $table->date('fecha_consignacion')->nullable()->after('titular_id');
            $table->string('nro_recibo')->nullable()->after('fecha_consignacion');
            $table->string('verific_antecedentes')->nullable()->after('plan_id');
            $table->text('observaciones')->nullable()->after('verific_antecedentes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aportes', function (Blueprint $table) {
            $table->dropColumn(['fecha_consignacion', 'nro_recibo', 'verific_antecedentes', 'observaciones']);
        });
    }
};
