<?php

namespace App\Imports;

use App\Models\Aporte;
use App\Models\Folder;
use App\Models\Plan;
use App\Models\Project;
use App\Models\Titular;
use App\Models\User;
use App\Services\TitularAuthService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToArray;

/**
 * Importa titulares, planes y aportes desde los Excel de datos-reyes-mama.
 * Formato A (listados): filas 0-2 títulos, fila 3 cabeceras, desde fila 4 datos.
 * Si la fila tiene nombre completo → nuevo titular (y aporte si hay datos de participación).
 * Si la fila no tiene nombre pero sí fecha/recibo/valor/programa → aporte del titular anterior.
 * Formato B (Nora Duarte): fila 0 cabeceras, desde fila 1 solo titulares (nombre + apellidos).
 */
class DatosReyesMamaImport implements ToArray
{
    public int $titularesCreated = 0;

    public int $aportesCreated = 0;

    public int $plansCreated = 0;

    /** @var array<int, array{row: int, message: string}> */
    public array $errors = [];

    public function __construct(
        private readonly string $filePath,
        private readonly string $projectTitle,
        private readonly Project $project,
        private readonly Folder $folder,
        private readonly User $user
    ) {}

    /**
     * @param  array<int, array<int, mixed>>  $array  Filas de la hoja actual
     * @return array<int, array<int, mixed>>
     */
    public function array(array $array): array
    {
        $sheet = $array;

        if ($this->isFormatoNora($sheet)) {
            $this->importFormatoNora($sheet);
        } else {
            $this->importFormatoListado($sheet);
        }

        return $array;
    }

    /**
     * @param  array<int, array<int, mixed>>  $sheet
     */
    private function isFormatoNora(array $sheet): bool
    {
        $first = $sheet[0] ?? [];
        $cell = is_array($first) ? ($first[0] ?? $first) : $first;

        return is_string($cell) && (stripos($cell, 'S.NO') !== false || stripos($cell, 'Submitted Time') !== false);
    }

    /**
     * @param  array<int, array<int, mixed>>  $sheet
     */
    private function importFormatoNora(array $sheet): void
    {
        for ($i = 1; $i < count($sheet); $i++) {
            $row = $sheet[$i] ?? [];
            if (! is_array($row)) {
                continue;
            }
            $nombre = trim((string) ($row[2] ?? '').' '.(string) ($row[3] ?? ''));
            if ($nombre === '') {
                continue;
            }

            try {
                $this->createTitular($nombre, $this->titularDataFromNoraRow($row));
                $this->titularesCreated++;
            } catch (\Throwable $e) {
                $this->errors[] = ['row' => $i + 1, 'message' => $e->getMessage()];
            }
        }
    }

    /**
     * @param  array<int, mixed>  $row
     * @return array<string, mixed>
     */
    private function titularDataFromNoraRow(array $row): array
    {
        $data = [];
        $doc = $this->cleanString($row[4] ?? null);
        if ($doc !== '') {
            $data['documento_identidad'] = $doc;
        }
        $correo = $this->cleanString($row[5] ?? null);
        if ($correo !== '') {
            $data['correo_electronico'] = $correo;
        }
        $telegram = $this->cleanString($row[6] ?? null);
        if ($telegram !== '') {
            $data['usuario_telegram'] = $telegram;
        }
        $celular = $this->cleanString($row[7] ?? null);
        if ($celular !== '') {
            $data['celular'] = $celular;
        }

        return $data;
    }

    /**
     * @param  array<int, array<int, mixed>>  $sheet
     */
    private function importFormatoListado(array $sheet): void
    {
        $headerRow = $sheet[3] ?? [];
        $currentTitular = null;

        for ($i = 4; $i < count($sheet); $i++) {
            $row = $sheet[$i] ?? [];
            if (! is_array($row)) {
                continue;
            }

            $nombre = $this->cleanString($row[1] ?? null);
            $fechaConsignacion = $this->valueAt($row, 13);
            $nroRecibo = $this->cleanString($row[14] ?? null);
            $valorRecibo = $this->numericValue($row[15] ?? null);
            $programaNombre = $this->cleanString($row[16] ?? null);
            $verific = $this->cleanString($row[17] ?? null);
            $observaciones = $this->cleanString($row[18] ?? null);

            $hasAporteData = $fechaConsignacion !== null || $nroRecibo !== '' || $valorRecibo > 0 || $programaNombre !== '';

            if ($nombre !== '') {
                $titularData = $this->titularDataFromListadoRow($row);
                try {
                    $currentTitular = $this->createTitular($nombre, $titularData);
                    $this->titularesCreated++;
                } catch (\Throwable $e) {
                    $this->errors[] = ['row' => $i + 1, 'message' => $e->getMessage()];
                    continue;
                }
                if ($hasAporteData) {
                    try {
                        $this->createAporte($currentTitular, $fechaConsignacion, $nroRecibo, $valorRecibo, $programaNombre, $verific, $observaciones);
                        $this->aportesCreated++;
                    } catch (\Throwable $e) {
                        $this->errors[] = ['row' => $i + 1, 'message' => 'Aporte: '.$e->getMessage()];
                    }
                }
            } elseif ($currentTitular !== null && $hasAporteData) {
                try {
                    $this->createAporte($currentTitular, $fechaConsignacion, $nroRecibo, $valorRecibo, $programaNombre, $verific, $observaciones);
                    $this->aportesCreated++;
                } catch (\Throwable $e) {
                    $this->errors[] = ['row' => $i + 1, 'message' => 'Aporte: '.$e->getMessage()];
                }
            }
        }
    }

    /**
     * @param  array<int, mixed>  $row
     * @return array<string, mixed>
     */
    private function titularDataFromListadoRow(array $row): array
    {
        $data = [];
        $map = [
            2 => 'documento_identidad',
            3 => 'pasaporte',
            4 => 'celular',
            5 => 'usuario_telegram',
            6 => 'correo_electronico',
            7 => 'direccion',
            8 => 'ciudad',
            9 => 'departamento',
            10 => 'pais',
            12 => 'codigo_billetera',
        ];
        foreach ($map as $col => $key) {
            $v = $this->cleanString($this->valueAt($row, $col));
            if ($v !== '') {
                $data[$key] = $v;
            }
        }

        return $data;
    }

    private function createTitular(string $nombre, array $data): Titular
    {
        $authService = new TitularAuthService;

        return Titular::query()->create([
            'nombre' => $nombre,
            'access_code' => $authService->generateAccessCode(),
            'unique_url' => $authService->generateUniqueUrl(),
            'project_id' => $this->project->id,
            'folder_id' => $this->folder->id,
            'folder_version' => $this->folder->version,
            'data' => $data,
            'consents_accepted' => [],
            'completion_percentage' => 0,
            'status' => Titular::STATUS_EN_PROCESO,
            'is_active' => true,
            'created_by' => $this->user->id,
        ]);
    }

    /**
     * @param  mixed  $fechaConsignacion  Excel serial date or Y-m-d string
     */
    private function createAporte(
        Titular $titular,
        mixed $fechaConsignacion,
        string $nroRecibo,
        float $valorRecibo,
        string $programaNombre,
        ?string $verific,
        ?string $observaciones
    ): void {
        $plan = null;
        if ($programaNombre !== '') {
            $plan = Plan::query()->firstOrCreate(
                ['nombre' => $programaNombre],
                [
                    'descripcion' => null,
                    'valor_ingreso' => 0,
                    'fecha_cierre' => null,
                    'created_by' => $this->user->id,
                ]
            );
            if ($plan->wasRecentlyCreated) {
                $this->plansCreated++;
            }
        }

        $fecha = $this->parseDate($fechaConsignacion);

        Aporte::query()->create([
            'titular_id' => $titular->id,
            'fecha_consignacion' => $fecha ?: null,
            'nro_recibo' => $nroRecibo !== '' ? $nroRecibo : null,
            'plan_id' => $plan?->id,
            'valor' => $valorRecibo > 0 ? $valorRecibo : 0,
            'verific_antecedentes' => $verific,
            'observaciones' => $observaciones,
            'estado' => Aporte::ESTADO_APROBADO,
        ]);
    }

    private function cleanString(mixed $value): string
    {
        if ($value === null) {
            return '';
        }
        $s = trim((string) $value);

        return $s;
    }

    private function valueAt(array $row, int $index): mixed
    {
        return $row[$index] ?? null;
    }

    private function numericValue(mixed $value): float
    {
        if ($value === null || $value === '') {
            return 0.0;
        }
        if (is_numeric($value)) {
            return (float) $value;
        }
        $s = preg_replace('/[^\d.,\-]/', '', (string) $value);
        $s = str_replace(',', '.', $s);

        return (float) $s;
    }

    private function parseDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        if ($value instanceof Carbon) {
            return $value->format('Y-m-d');
        }
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }
        if (is_string($value)) {
            $d = \DateTime::createFromFormat('Y-m-d', $value);
            if ($d !== false) {
                return $d->format('Y-m-d');
            }
            $d = \DateTime::createFromFormat('d/m/Y', $value);
            if ($d !== false) {
                return $d->format('Y-m-d');
            }
        }
        if (is_numeric($value)) {
            $serial = (float) $value;
            if ($serial > 10000) {
                $base = new \DateTime('1899-12-30');
                $base->modify('+'.(int) $serial.' days');

                return $base->format('Y-m-d');
            }
        }

        return null;
    }
}
