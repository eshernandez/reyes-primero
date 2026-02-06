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
        Schema::create('titulares', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('access_code', 6)->unique();
            $table->string('unique_url')->unique();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('folder_id')->constrained()->cascadeOnDelete();
            $table->string('folder_version');
            $table->json('data')->nullable();
            $table->json('consents_accepted')->nullable();
            $table->unsignedTinyInteger('completion_percentage')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_access')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('titulares');
    }
};
