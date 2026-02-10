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
 *
 * Formato A (listados): filas 0-2 títulos, fila 3 cabeceras, desde fila 4 datos.
 * Si la fila tiene nombre completo → nuevo titular (y aporte si hay datos de participación).
 * Si la fila no tiene nombre pero sí fecha/recibo/valor/programa → aporte del titular anterior.
 *
 * Formato B (Nora Duarte): fila 0 cabeceras, desde fila 1 solo titulares (nombre + apellidos).
 *
 * Formato C (dbcompleta): fila 0 cabeceras, desde fila 1 datos completos con 47 columnas.
 * Cada fila es un titular único con datos financieros y aportes en columnas.
 */
class DatosReyesMamaImport implements ToArray
{
    public int $titularesCreated = 0;

    public int $titularesSkipped = 0;

    public int $aportesCreated = 0;

    public int $plansCreated = 0;

    /** @var array<int, array{row: int, message: string}> */
    public array $errors = [];

    /**
     * Cache de documentos y correos ya existentes para deduplicar rápido.
     *
     * @var array<string, int>
     */
    private static array $docIndex = [];

    private static array $emailIndex = [];

    public function __construct(
        private readonly string $filePath,
        private readonly string $projectTitle,
        private readonly Project $project,
        private readonly Folder $folder,
        private readonly User $user
    ) {}

    /**
     * Inicializar índices de deduplicación con los titulares ya existentes en BD.
     */
    public static function initDeduplicationIndex(): void
    {
        self::$docIndex = [];
        self::$emailIndex = [];

        Titular::query()->each(function (Titular $t) {
            $doc = trim((string) ($t->data['documento_identidad'] ?? ''));
            $email = strtolower(trim((string) ($t->data['correo_electronico'] ?? '')));

            if ($doc !== '') {
                self::$docIndex[$doc] = $t->id;
            }
            if ($email !== '') {
                self::$emailIndex[$email] = $t->id;
            }
        });
    }

    /**
     * @param  array<int, array<int, mixed>>  $array  Filas de la hoja actual
     * @return array<int, array<int, mixed>>
     */
    public function array(array $array): array
    {
        $sheet = $array;

        if ($this->isFormatoDbCompleta($sheet)) {
            $this->importFormatoDbCompleta($sheet);
        } elseif ($this->isFormatoNora($sheet)) {
            $this->importFormatoNora($sheet);
        } else {
            $this->importFormatoListado($sheet);
        }

        return $array;
    }

    // ─── Detección de formato ────────────────────────────────────────

    private function isFormatoDbCompleta(array $sheet): bool
    {
        $first = $sheet[0] ?? [];
        if (! is_array($first)) {
            return false;
        }
        $cell = (string) ($first[0] ?? '');

        return stripos($cell, 'N.I.F') !== false || stripos($cell, 'RAZ') !== false;
    }

    private function isFormatoNora(array $sheet): bool
    {
        $first = $sheet[0] ?? [];
        $cell = is_array($first) ? ($first[0] ?? $first) : $first;

        return is_string($cell) && (stripos($cell, 'S.NO') !== false || stripos($cell, 'Submitted Time') !== false);
    }

    // ─── Formato dbcompleta (47 columnas) ────────────────────────────

    private function importFormatoDbCompleta(array $sheet): void
    {
        for ($i = 1; $i < count($sheet); $i++) {
            $row = $sheet[$i] ?? [];
            if (! is_array($row)) {
                continue;
            }

            $nombres = $this->cleanString($row[1] ?? null);
            $apellidos = $this->cleanString($row[2] ?? null);
            $nombre = trim($nombres.' '.$apellidos);
            if ($nombre === '') {
                continue;
            }

            $data = $this->titularDataFromDbCompletaRow($row);

            try {
                $titular = $this->findOrCreateTitular($nombre, $data);
                if ($titular === null) {
                    $this->titularesSkipped++;

                    continue;
                }

                // Aporte Base
                $aporteBase = $this->numericValue($row[20] ?? null);
                $fechaPrimer = $this->valueAt($row, 18);
                $nroConsig = $this->cleanString($row[21] ?? null);

                if ($aporteBase > 0) {
                    $this->createAporte(
                        $titular, $fechaPrimer, $nroConsig, $aporteBase,
                        'APORTE BASE', null, null
                    );
                    $this->aportesCreated++;
                }

                // Aporte Oxigenación 2025
                $aporteOxi = $this->numericValue($row[25] ?? null);
                $fechaOxi = $this->valueAt($row, 24);
                $nroOxi = $this->cleanString($row[26] ?? null);

                if ($aporteOxi > 0) {
                    $this->createAporte(
                        $titular, $fechaOxi, $nroOxi, $aporteOxi,
                        'OXIGENACION 2025', null, null
                    );
                    $this->aportesCreated++;
                }
            } catch (\Throwable $e) {
                $this->errors[] = ['row' => $i + 1, 'message' => $e->getMessage()];
            }
        }
    }

    /**
     * Mapeo completo de las 47 columnas de dbcompleta a field_names del Folder.
     *
     * @return array<string, mixed>
     */
    private function titularDataFromDbCompletaRow(array $row): array
    {
        $map = [
            0 => 'nif_razon_social',
            1 => 'nombres',
            2 => 'apellidos',
            3 => 'documento_identidad',
            4 => 'pasaporte',
            5 => 'fecha_emision_pasaporte',
            6 => 'fecha_vencimiento_pasaporte',
            7 => 'entidad_emite',
            8 => 'celular',
            9 => 'correo_electronico',
            10 => 'usuario_telegram',
            11 => 'direccion',
            12 => 'ciudad',
            13 => 'departamento',
            14 => 'pais',
            15 => 'banco',
            16 => 'numero_cuenta',
            17 => 'tipo_cuenta',
            18 => 'fecha_primer_aporte',
            19 => 'valor_oxigenacion_inicial',
            20 => 'aporte_base',
            21 => 'numero_consignacion',
            22 => 'promesa_final',
            23 => 'regalo',
            24 => 'fecha_aporte_oxigenacion_2025',
            25 => 'aportado_multi_oxigena',
            26 => 'numero_recibo_oxigenacion',
            27 => 'quien_recibio',
            28 => 'factor_multiplicacion',
            29 => 'oxigenacion_final',
            30 => 'observaciones',
            31 => 'tipo_usuario',
            32 => 'marca_billetera',
            33 => 'codigo_billetera',
            34 => 'fecha_nacimiento',
            35 => 'fecha_expedicion_cedula',
            36 => 'coequipero_codigo',
            37 => 'coequipero_nombre',
            38 => 'llave_interbancaria',
            39 => 'red_monabit',
            40 => 'tarjeta_monabit',
            41 => 'pergaminos',
            42 => 'plataformas',
            43 => 'codigo_banco',
            44 => 'nombre_real_banco',
            45 => 'fecha_ultimo_ingreso',
            46 => 'hora_ultimo_ingreso',
        ];

        $data = [];
        foreach ($map as $col => $key) {
            $v = $this->cleanString($this->valueAt($row, $col));
            if ($v !== '' && strtolower($v) !== 'nan' && strtolower($v) !== 'n/a') {
                $data[$key] = $v;
            }
        }

        return $data;
    }

    // ─── Formato Nora Duarte ────────────────────────────────────────

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
                $data = $this->titularDataFromNoraRow($row);
                $titular = $this->findOrCreateTitular($nombre, $data);
                if ($titular === null) {
                    $this->titularesSkipped++;
                } else {
                    $this->titularesCreated++;
                }
            } catch (\Throwable $e) {
                $this->errors[] = ['row' => $i + 1, 'message' => $e->getMessage()];
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function titularDataFromNoraRow(array $row): array
    {
        $data = [];

        $nombres = $this->cleanString($row[2] ?? null);
        $apellidos = $this->cleanString($row[3] ?? null);
        if ($nombres !== '') {
            $data['nombres'] = $nombres;
        }
        if ($apellidos !== '') {
            $data['apellidos'] = $apellidos;
        }

        $doc = $this->cleanString($row[4] ?? null);
        if ($doc !== '') {
            $doc = rtrim($doc, 'Pp');
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

    // ─── Formato Listados ───────────────────────────────────────────

    private function importFormatoListado(array $sheet): void
    {
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
                    $titular = $this->findOrCreateTitular($nombre, $titularData);
                    if ($titular !== null) {
                        $currentTitular = $titular;
                    } else {
                        // Titular ya existía, buscar por doc/email para asociar aportes
                        $currentTitular = $this->findExistingTitular($titularData);
                        $this->titularesSkipped++;
                    }
                } catch (\Throwable $e) {
                    $this->errors[] = ['row' => $i + 1, 'message' => $e->getMessage()];

                    continue;
                }
                if ($currentTitular !== null && $hasAporteData) {
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

        // Incluir nombre y apellidos separados
        $nombreCompleto = $this->cleanString($row[1] ?? null);
        if ($nombreCompleto !== '') {
            $data['nombres'] = $nombreCompleto;
            $data['apellidos'] = '';
        }

        // Coequipero: usar el título del proyecto como referencia del líder
        $data['coequipero_nombre'] = $this->projectTitle;

        return $data;
    }

    // ─── Deduplicación y Creación ───────────────────────────────────

    /**
     * Busca un titular existente por documento o correo.
     * Si no existe, lo crea. Si ya existe, retorna null.
     */
    private function findOrCreateTitular(string $nombre, array $data): ?Titular
    {
        $doc = $this->normalizeDoc($data['documento_identidad'] ?? '');
        $email = strtolower(trim((string) ($data['correo_electronico'] ?? '')));

        // Buscar por documento
        if ($doc !== '' && isset(self::$docIndex[$doc])) {
            return null;
        }

        // Buscar por correo
        if ($email !== '' && isset(self::$emailIndex[$email])) {
            return null;
        }

        $titular = $this->createTitular($nombre, $data);

        // Actualizar índices
        if ($doc !== '') {
            self::$docIndex[$doc] = $titular->id;
        }
        if ($email !== '') {
            self::$emailIndex[$email] = $titular->id;
        }

        return $titular;
    }

    /**
     * Buscar titular existente por doc/email para asociarle aportes.
     */
    private function findExistingTitular(array $data): ?Titular
    {
        $doc = $this->normalizeDoc($data['documento_identidad'] ?? '');
        $email = strtolower(trim((string) ($data['correo_electronico'] ?? '')));

        if ($doc !== '' && isset(self::$docIndex[$doc])) {
            return Titular::query()->find(self::$docIndex[$doc]);
        }
        if ($email !== '' && isset(self::$emailIndex[$email])) {
            return Titular::query()->find(self::$emailIndex[$email]);
        }

        return null;
    }

    private function normalizeDoc(string $doc): string
    {
        $doc = trim($doc);
        $doc = str_replace(['.', ',', ' '], '', $doc);
        // Quitar .0 de números leídos como float
        $doc = preg_replace('/\.0$/', '', $doc);

        return $doc;
    }

    private function createTitular(string $nombre, array $data): Titular
    {
        $authService = new TitularAuthService;

        $titular = Titular::query()->create([
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

        $this->titularesCreated++;

        return $titular;
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

    // ─── Utilidades ─────────────────────────────────────────────────

    private function cleanString(mixed $value): string
    {
        if ($value === null) {
            return '';
        }
        $s = trim((string) $value);
        if (strtolower($s) === 'nan' || strtolower($s) === 'none') {
            return '';
        }

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
        $strVal = (string) $value;
        if (strtolower($strVal) === 'nan' || strtolower($strVal) === '0000-00-00') {
            return null;
        }
        if ($value instanceof Carbon) {
            return $value->format('Y-m-d');
        }
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }
        if (is_string($value)) {
            // Formato Y-m-d H:i:s o Y-m-d
            $d = \DateTime::createFromFormat('Y-m-d H:i:s', $value);
            if ($d !== false) {
                return $d->format('Y-m-d');
            }
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
