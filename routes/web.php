<?php

use App\Http\Controllers\FolderController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\Titular\AccessController;
use App\Http\Controllers\Titular\DashboardController as TitularDashboardController;
use App\Http\Controllers\Titular\LoginController;
use App\Models\Titular;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::bind('titulare', fn (string $value) => Titular::query()->findOrFail($value));

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('dashboard', \App\Http\Controllers\DashboardController::class)->name('dashboard');
    Route::resource('projects', ProjectController::class);
    Route::resource('folders', FolderController::class);
    Route::get('titulares/{titulare}/file', \App\Http\Controllers\TitularFileController::class)->name('titulares.file');
    Route::post('titulares/{titulare}/notes', [\App\Http\Controllers\TitularNoteController::class, 'store'])->name('titulares.notes.store');
    Route::patch('titulares/{titulare}/status', [\App\Http\Controllers\TitularController::class, 'updateStatus'])->name('titulares.status.update');
    Route::resource('titulares', \App\Http\Controllers\TitularController::class);
});

Route::prefix('titular')->name('titular.')->group(function (): void {
    Route::get('login', [LoginController::class, 'show'])->name('login');
    Route::post('login', [LoginController::class, 'store'])->name('login.store');
    Route::middleware('auth.titular')->group(function (): void {
        Route::post('logout', [LoginController::class, 'destroy'])->name('logout');
        Route::get('access/{uniqueUrl}', AccessController::class)->name('access');
        Route::get('dashboard', TitularDashboardController::class)->name('dashboard');
        Route::put('data', \App\Http\Controllers\Titular\DataController::class)->name('data.update');
        Route::get('file', \App\Http\Controllers\Titular\FileController::class)->name('file');
        Route::post('consents', \App\Http\Controllers\Titular\ConsentController::class)->name('consents.store');
        Route::post('notes/{noteId}/complete', \App\Http\Controllers\Titular\NoteCompletionController::class)->name('notes.complete');
    });
});

require __DIR__.'/settings.php';
