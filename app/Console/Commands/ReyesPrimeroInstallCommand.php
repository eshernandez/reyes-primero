<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

class ReyesPrimeroInstallCommand extends Command
{
    protected $signature = 'reyes-primero:install
                            {--no-build : Skip npm run build}
                            {--no-migrate : Skip migrations and seeding}';

    protected $description = 'Install Reyes Primero: migrate, seed, storage link, and optional build';

    public function handle(): int
    {
        $this->info('Instalando Reyes Primero...');

        if (! $this->option('no-migrate')) {
            $this->info('Ejecutando migraciones...');
            Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true], $this->getOutput());
        }

        $this->info('Creando enlace de storage...');
        Artisan::call('storage:link', [], $this->getOutput());

        $privatePath = storage_path('app/private');
        if (! File::isDirectory($privatePath)) {
            File::makeDirectory($privatePath, 0755, true);
            $this->info("Directorio privado creado: {$privatePath}");
        }

        if (empty(config('app.key'))) {
            $this->info('Generando application key...');
            Artisan::call('key:generate', ['--force' => true], $this->getOutput());
        }

        if (! $this->option('no-build')) {
            $this->info('Compilando assets (npm run build)...');
            $exitCode = $this->runExternalCommand('npm run build');
            if ($exitCode !== 0) {
                $this->warn('npm run build falló. Ejecute manualmente: npm run build');
            }
        }

        $this->newLine();
        $this->info('✅ Instalación completada.');
        $this->newLine();
        $this->line('Credenciales de acceso:');
        $this->line('  Super Admin: super@reyesprimero.com / password');
        $this->line('  Admin:        admin@reyesprimero.com / password');
        $this->line('  Auxiliar:     auxiliar@reyesprimero.com / password');
        $this->newLine();
        $this->line('Accede al panel en: '.config('app.url').'/login');
        $this->line('Acceso titular:     '.config('app.url').'/titular/login');
        $this->newLine();

        return self::SUCCESS;
    }

    private function runExternalCommand(string $command): int
    {
        $process = proc_open(
            $command,
            [1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
            base_path()
        );
        if (! is_resource($process)) {
            return 1;
        }
        stream_get_contents($pipes[1]);
        stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        return proc_close($process);
    }
}
