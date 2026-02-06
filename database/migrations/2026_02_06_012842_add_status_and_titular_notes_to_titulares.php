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
        Schema::table('titulares', function (Blueprint $table) {
            $table->string('status', 20)->default('en_proceso')->after('completion_percentage');
        });

        Schema::create('titular_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('titular_id')->constrained('titulares')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('titular_notes');
        Schema::table('titulares', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
