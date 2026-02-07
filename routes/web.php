<?php

use App\Http\Controllers\AporteController;
use App\Http\Controllers\AporteSoporteController;
use App\Http\Controllers\ConsentController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\InformeController;
use App\Http\Controllers\InformeTitularesAportesExcelController;
use App\Http\Controllers\InformeTitularesExcelController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\Titular\AccessController;
use App\Http\Controllers\Titular\AporteController as TitularAporteController;
use App\Http\Controllers\Titular\DashboardController as TitularDashboardController;
use App\Http\Controllers\Titular\LoginController;
use App\Http\Controllers\TitularImportController;
use App\Http\Controllers\UserController;
use App\Models\Aporte;
use App\Models\Titular;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::bind('titulare', fn (string $value) => Titular::query()->findOrFail($value));
Route::bind('usuario', fn (string $value) => User::query()->findOrFail($value));
Route::bind('aporte', fn (string $value) => Aporte::query()->findOrFail($value));

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('dashboard', \App\Http\Controllers\DashboardController::class)->name('dashboard');
    Route::resource('usuarios', UserController::class)->except(['show']);
    Route::get('informes', InformeController::class)->name('informes.index');
    Route::get('informes/titulares/excel', InformeTitularesExcelController::class)->name('informes.titulares.excel');
    Route::get('informes/titulares/aportes-excel', InformeTitularesAportesExcelController::class)->name('informes.titulares.aportes.excel');
    Route::resource('plans', PlanController::class);
    Route::resource('aportes', AporteController::class)->only(['index', 'show', 'update']);
    Route::get('aportes/{aporte}/soporte', AporteSoporteController::class)->name('aportes.soporte');
    Route::resource('consents', ConsentController::class);
    Route::resource('projects', ProjectController::class);
    Route::resource('folders', FolderController::class);
    Route::get('titulares/{titulare}/file', \App\Http\Controllers\TitularFileController::class)->name('titulares.file');
    Route::get('titulares/{titulare}/data', [\App\Http\Controllers\TitularController::class, 'editData'])->name('titulares.data.edit');
    Route::put('titulares/{titulare}/data', [\App\Http\Controllers\TitularController::class, 'updateData'])->name('titulares.data.update');
    Route::post('titulares/{titulare}/notes', [\App\Http\Controllers\TitularNoteController::class, 'store'])->name('titulares.notes.store');
    Route::post('titulares/{titulare}/regenerate-code', [\App\Http\Controllers\TitularController::class, 'regenerateAccessCode'])->name('titulares.regenerate-code');
    Route::post('titulares/{titulare}/regenerate-url', [\App\Http\Controllers\TitularController::class, 'regenerateUniqueUrl'])->name('titulares.regenerate-url');
    Route::patch('titulares/{titulare}/status', [\App\Http\Controllers\TitularController::class, 'updateStatus'])->name('titulares.status.update');
    Route::get('titulares/import/template', [TitularImportController::class, 'template'])->name('titulares.import.template');
    Route::get('titulares/import/create', [TitularImportController::class, 'create'])->name('titulares.import.create');
    Route::post('titulares/import', [TitularImportController::class, 'store'])->name('titulares.import.store');
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
        Route::get('aportes', [TitularAporteController::class, 'index'])->name('aportes.index');
        Route::get('aportes/create', [TitularAporteController::class, 'create'])->name('aportes.create');
        Route::post('aportes', [TitularAporteController::class, 'store'])->name('aportes.store');
        Route::get('aportes/{aporte}/soporte', AporteSoporteController::class)->name('aportes.soporte');
    });
});

require __DIR__.'/settings.php';
