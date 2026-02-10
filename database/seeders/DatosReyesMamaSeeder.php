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
     * Carga los 5 Excel de datos-reyes-mama en un único proyecto.
     *
     * Orden de importación:
     * 1. dbcompleta → base de 802 titulares con datos completos + aportes
     * 2. Listados de líderes → titulares nuevos + aportes (deduplicando por doc/email)
     * 3. Nora Duarte → titulares nuevos sin aportes (deduplicando)
     *
     * Todos los titulares se asocian al Folder con id=1 (carpeta por defecto).
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

        $folder = Folder::query()->find(1);
        if (! $folder) {
            $folder = Folder::query()->where('is_default', true)->first();
        }
        if (! $folder) {
            $this->command->warn('No hay carpeta con id=1 ni carpeta por defecto. Ejecuta antes ReyesPrimeroSeeder.');

            return;
        }

        // Proyecto único para todos los datos
        $project = Project::query()->firstOrCreate(
            ['title' => 'Proyecto Reyes'],
            [
                'description' => 'Proyecto consolidado con todos los datos de titulares importados desde Excel',
                'valor_ingreso' => 0,
                'fecha_inicio' => now()->toDateString(),
                'fecha_fin' => null,
                'status' => Project::STATUS_ACTIVO,
                'created_by' => $user->id,
            ]
        );

        // Inicializar índices de deduplicación (vacíos en migrate:fresh)
        DatosReyesMamaImport::initDeduplicationIndex();

        // Orden de importación: dbcompleta PRIMERO (es la base maestra)
        $files = [
            'dbcompleta (3).xlsx' => 'DB Completa',
            'LISTADO PROYECTO REYES LIDER OLGA EMILCE ROJAS, COEQUIPERA CARMEN ALICIA GARCIA CUATIN copia.xlsx' => 'Proyecto Reyes - Olga Emilce Rojas',
            'LISTADO PRYECTO REYES - LIDER GLORIA NELLY PEREZ DE SUPANTEVE copia.xlsx' => 'Proyecto Reyes - Gloria Nelly Pérez',
            'LISTADO PRYECTO REYES DE ALBA LILIA GOMEZ - copia (2).xlsx' => 'Proyecto Reyes - Alba Lilia Gómez',
            'PROYETO REYES NORA DUARTE.xlsx' => 'Proyecto Reyes - Nora Duarte',
        ];

        $totalTitulares = 0;
        $totalSkipped = 0;
        $totalAportes = 0;
        $totalPlans = 0;

        foreach ($files as $filename => $label) {
            $path = $basePath.DIRECTORY_SEPARATOR.$filename;

            if (! is_file($path)) {
                $this->command->warn("Archivo no encontrado: {$filename}");

                continue;
            }

            $this->command->info("Importando: {$label}...");

            $import = new DatosReyesMamaImport($path, $label, $project, $folder, $user);

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
            $totalSkipped += $import->titularesSkipped;
            $totalAportes += $import->aportesCreated;
            $totalPlans += $import->plansCreated;

            $this->command->info(
                "  ✓ {$import->titularesCreated} titulares creados, ".
                "{$import->titularesSkipped} duplicados omitidos, ".
                "{$import->aportesCreated} aportes, ".
                "{$import->plansCreated} planes nuevos."
            );

            if (! empty($import->errors)) {
                $this->command->warn('  ⚠ '.count($import->errors).' errores:');
                foreach (array_slice($import->errors, 0, 5) as $err) {
                    $this->command->warn("    Fila {$err['row']}: {$err['message']}");
                }
                if (count($import->errors) > 5) {
                    $this->command->line('    ... y '.(count($import->errors) - 5).' más.');
                }
            }
        }

        $this->command->newLine();
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info("  Total titulares creados:   {$totalTitulares}");
        $this->command->info("  Total duplicados omitidos: {$totalSkipped}");
        $this->command->info("  Total aportes creados:     {$totalAportes}");
        $this->command->info("  Total planes creados:      {$totalPlans}");
        $this->command->info("  Folder asignado:           #{$folder->id} - {$folder->name}");
        $this->command->info("  Proyecto:                  #{$project->id} - {$project->title}");
        $this->command->info('═══════════════════════════════════════════');
    }
}
