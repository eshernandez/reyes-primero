<?php

namespace Database\Seeders;

use App\Imports\DatosReyesMamaImport;
use App\Models\Folder;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;
use Maatwebsite\Excel\Facades\Excel;

class DatosReyesMamaSeeder extends Seeder
{
    private const DIR = 'datos-reyes-mama';

    /**
     * Carga los 4 Excel de datos-reyes-mama: crea proyectos por archivo,
     * titulares, planes (por nombre de programa) y aportes.
     * Cuando una fila no trae nombre pero sí datos de participación,
     * se asocia al titular de la fila anterior.
     */
    public function run(): void
    {
        $basePath = base_path(self::DIR);

        if (! is_dir($basePath)) {
            $this->command->warn('Carpeta '.self::DIR.' no encontrada. No se cargan datos.');

            return;
        }

        $user = User::query()->first();
        if (! $user) {
            $this->command->warn('No hay usuario en la base. Ejecuta antes ReyesPrimeroSeeder.');

            return;
        }

        $folder = Folder::query()->where('is_default', true)->first();
        if (! $folder) {
            $this->command->warn('No hay carpeta por defecto. Ejecuta antes ReyesPrimeroSeeder.');

            return;
        }

        $files = [
            'LISTADO PROYECTO REYES LIDER OLGA EMILCE ROJAS, COEQUIPERA CARMEN ALICIA GARCIA CUATIN copia.xlsx' => 'Proyecto Reyes - Olga Emilce Rojas',
            'LISTADO PRYECTO REYES - LIDER GLORIA NELLY PEREZ DE SUPANTEVE copia.xlsx' => 'Proyecto Reyes - Gloria Nelly Pérez',
            'LISTADO PRYECTO REYES DE ALBA LILIA GOMEZ - copia (2).xlsx' => 'Proyecto Reyes - Alba Lilia Gómez',
            'PROYETO REYES NORA DUARTE.xlsx' => 'Proyecto Reyes - Nora Duarte',
        ];

        $totalTitulares = 0;
        $totalAportes = 0;
        $totalPlans = 0;

        foreach ($files as $filename => $projectTitle) {
            $path = $basePath.DIRECTORY_SEPARATOR.$filename;

            if (! is_file($path)) {
                $this->command->warn("Archivo no encontrado: {$filename}");
                continue;
            }

            $project = Project::query()->firstOrCreate(
                ['title' => $projectTitle],
                [
                    'description' => 'Importado desde '.$filename,
                    'valor_ingreso' => 0,
                    'fecha_inicio' => now()->toDateString(),
                    'fecha_fin' => null,
                    'status' => Project::STATUS_ACTIVO,
                    'created_by' => $user->id,
                ]
            );

            $import = new DatosReyesMamaImport($path, $projectTitle, $project, $folder, $user);

            try {
                Excel::import($import, $path);
            } catch (\Throwable $e) {
                $this->command->error("Error importando {$filename}: ".$e->getMessage());
                if (! empty($import->errors)) {
                    foreach (array_slice($import->errors, 0, 5) as $err) {
                        $this->command->line("  Fila {$err['row']}: {$err['message']}");
                    }
                    if (count($import->errors) > 5) {
                        $this->command->line('  ... y '.(count($import->errors) - 5).' más.');
                    }
                }
                continue;
            }

            $totalTitulares += $import->titularesCreated;
            $totalAportes += $import->aportesCreated;
            $totalPlans += $import->plansCreated;

            $this->command->info("{$filename}: {$import->titularesCreated} titulares, {$import->aportesCreated} aportes, {$import->plansCreated} planes nuevos.");

            if (! empty($import->errors)) {
                foreach (array_slice($import->errors, 0, 3) as $err) {
                    $this->command->warn("  Fila {$err['row']}: {$err['message']}");
                }
            }
        }

        $this->command->info("Total: {$totalTitulares} titulares, {$totalAportes} aportes, {$totalPlans} planes nuevos.");
    }
}
